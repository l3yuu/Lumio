from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Set, Any, Optional
import json
import jwt
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..email import send_group_invite_email
from ..config import settings
from ..time_utils import now_ph, now_ph_naive
from ..redis_client import cache_get, cache_set, cache_delete, cache_delete_pattern
from .. import models, schemas, auth

router = APIRouter(prefix="/api/groups", tags=["groups"])

# Cache migrated to Redis under groups:public:listings:*

def _invalidate_public_groups():
    cache_delete_pattern("groups:public:listings:*")

# --- REST ENDPOINTS ---

@router.get("", response_model=List[schemas.StudyGroupOut])
def get_groups(
    skip: int = 0,
    limit: int = 10,
    q: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Returns groups that the current user is a member of with pagination and search
    query = db.query(models.StudyGroup).filter(
        models.StudyGroup.members.any(models.User.id == current_user.id),
        models.StudyGroup.is_banned == False
    )
    if q:
        query = query.filter(models.StudyGroup.name.ilike(f"%{q}%"))
    return query.order_by(models.StudyGroup.id.desc()).offset(skip).limit(limit).all()

@router.get("/public", response_model=schemas.PublicGroupsOut)
def get_public_groups(
    skip: int = 0,
    limit: int = 10,
    q: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    cache_key = f"groups:public:listings:{current_user.id}:{skip}:{limit}:{q or ''}"
    cached_groups = cache_get(cache_key)
    if cached_groups is not None:
        if isinstance(cached_groups, dict) and "results" in cached_groups:
            return cached_groups
        else:
            cache_delete(cache_key)

    base_query = db.query(models.StudyGroup).filter(
        models.StudyGroup.is_public == True,
        models.StudyGroup.is_banned == False,
        ~models.StudyGroup.members.any(models.User.id == current_user.id)
    )
    if q:
        base_query = base_query.filter(models.StudyGroup.name.ilike(f"%{q}%"))

    total = base_query.count()

    results = base_query.order_by(models.StudyGroup.id.desc()).offset(skip).limit(limit).all()
    
    try:
        serialized_results = []
        for g in results:
            if hasattr(schemas.StudyGroupOut, "model_validate"):
                serialized_results.append(schemas.StudyGroupOut.model_validate(g).model_dump())
            else:
                serialized_results.append(schemas.StudyGroupOut.from_orm(g).dict())
        
        response_data = {
            "results": serialized_results,
            "total": total
        }
        cache_set(cache_key, response_data, expire_seconds=3600)
    except Exception:
        response_data = {
            "results": results,
            "total": total
        }
        
    return response_data

@router.post("/{group_id}/join", response_model=schemas.StudyGroupOut)
def join_public_group(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if not group.is_public:
        raise HTTPException(status_code=403, detail="This group is not public")
    if group.is_banned:
        raise HTTPException(status_code=403, detail="This study group has been banned")
    if current_user in group.members:
        raise HTTPException(status_code=400, detail="You are already a member of this group")
    group.members.append(current_user)
    
    # Notify the group creator
    if group.creator_id and group.creator_id != current_user.id:
        notif = models.Notification(
            user_id=group.creator_id,
            type="group_member_joined",
            title=f"New member in {group.name}",
            message=f"{current_user.name} has joined your study group \"{group.name}\"",
            related_id=group.id,
            related_type="group"
        )
        db.add(notif)

    _invalidate_public_groups()
    db.commit()
    db.refresh(group)
    return group

@router.post("", response_model=schemas.StudyGroupOut)
def create_group(
    group_in: schemas.StudyGroupCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    from ..system_config import get_system_config
    if get_system_config(db, "allow_circle_creation") == "false" and current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Study group (Circle) creation is currently disabled by the administrator."
        )

    if not current_user.is_premium:
        created_groups_count = db.query(models.StudyGroup).filter(models.StudyGroup.creator_id == current_user.id).count()
        if created_groups_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Free accounts are limited to creating 2 collaborative circles. Upgrade to Pro for unlimited circles."
            )

    db_group = models.StudyGroup(name=group_in.name, creator_id=current_user.id, is_public=group_in.is_public)
    db_group.members.append(current_user)
    db.add(db_group)
    db.flush()  # flush so db_group.id is available for invitations
    
    # Send invitations to other members instead of adding directly
    for email in group_in.members:
        invited_user = db.query(models.User).filter(models.User.email == email.strip()).first()
        if invited_user and invited_user != current_user and invited_user not in db_group.members:
            invitation = models.GroupInvitation(
                group_id=db_group.id,
                inviter_id=current_user.id,
                invitee_id=invited_user.id,
                status='pending',
                created_at=now_ph_naive()
            )
            db.add(invitation)
            notif = models.Notification(
                user_id=invited_user.id,
                type="group_invite",
                title=f"Group Invitation from {current_user.name}",
                message=f"You've been invited to join \"{group_in.name}\"",
                related_type="invitation"
            )
            db.add(notif)
            
            # Send group invitation email
            from ..email import send_group_invite_email
            send_group_invite_email(background_tasks, invited_user.email, invited_user.name, current_user.name, group_in.name)
            
    _invalidate_public_groups()
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/invitations", response_model=List[schemas.GroupInvitationOut])
def get_my_invitations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    invitations = db.query(models.GroupInvitation).options(
        joinedload(models.GroupInvitation.inviter),
        joinedload(models.GroupInvitation.group)
    ).filter(
        models.GroupInvitation.invitee_id == current_user.id,
        models.GroupInvitation.status == 'pending'
    ).all()
    return [
        schemas.GroupInvitationOut(
            id=inv.id,
            group_id=inv.group_id,
            group_name=inv.group.name,
            inviter_name=inv.inviter.name,
            inviter_avatar=inv.inviter.avatar,
            status=inv.status,
            created_at=inv.created_at.strftime("%b %d, %Y")
        )
        for inv in invitations
    ]


@router.post("/invitations/{invitation_id}/accept", response_model=schemas.StudyGroupOut)
async def accept_invitation(
    invitation_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    invitation = db.query(models.GroupInvitation).filter(
        models.GroupInvitation.id == invitation_id,
        models.GroupInvitation.invitee_id == current_user.id,
        models.GroupInvitation.status == 'pending'
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == invitation.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group no longer exists")

    invitation.status = 'accepted'
    is_new_member = current_user not in group.members
    if is_new_member:
        group.members.append(current_user)

    # Notify the inviter that their invitation was accepted
    notif = models.Notification(
        user_id=invitation.inviter_id,
        type="group_invite_accepted",
        title=f"{current_user.name} accepted your invitation",
        message=f"{current_user.name} has joined \"{group.name}\"",
        related_id=group.id,
        related_type="group"
    )
    db.add(notif)
    _invalidate_public_groups()
    db.commit()
    db.refresh(group)

    if is_new_member:
        await discussion_manager.broadcast_member_joined(group.id, {
            "name": current_user.name,
            "email": current_user.email,
            "avatar": current_user.avatar,
            "online": True
        })

    return group


@router.post("/invitations/{invitation_id}/decline")
def decline_invitation(
    invitation_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    invitation = db.query(models.GroupInvitation).filter(
        models.GroupInvitation.id == invitation_id,
        models.GroupInvitation.invitee_id == current_user.id,
        models.GroupInvitation.status == 'pending'
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation.status = 'declined'
    db.commit()
    return {"message": "Invitation declined"}


@router.post("/{group_id}/join-via-link", response_model=schemas.StudyGroupOut)
async def join_group_via_link(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    is_new_member = current_user not in group.members
    if is_new_member:
        group.members.append(current_user)
        
        # Notify the group creator
        if group.creator_id and group.creator_id != current_user.id:
            notif = models.Notification(
                user_id=group.creator_id,
                type="group_member_joined",
                title=f"New member in {group.name}",
                message=f"{current_user.name} has joined your study group \"{group.name}\"",
                related_id=group.id,
                related_type="group"
            )
            db.add(notif)
            
        _invalidate_public_groups()
        db.commit()
        db.refresh(group)

    if is_new_member:
        await discussion_manager.broadcast_member_joined(group.id, {
            "name": current_user.name,
            "email": current_user.email,
            "avatar": current_user.avatar,
            "online": True
        })

    return group


@router.delete("/{group_id}/members/{user_id}", response_model=schemas.StudyGroupOut)
async def remove_group_member(
    group_id: int,
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can remove members")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Use the leave group option.")

    member_to_remove = db.query(models.User).filter(models.User.id == user_id).first()
    if not member_to_remove or member_to_remove not in group.members:
        raise HTTPException(status_code=404, detail="Member not found in this study group")

    group.members.remove(member_to_remove)
    _invalidate_public_groups()
    db.commit()
    db.refresh(group)

    await discussion_manager.broadcast_member_removed(group_id, user_id)

    return group


@router.post("/{group_id}/transfer-ownership/{user_id}", response_model=schemas.StudyGroupOut)
async def transfer_group_ownership(
    group_id: int,
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can transfer ownership")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You are already the owner of this group")

    new_owner = db.query(models.User).filter(models.User.id == user_id).first()
    if not new_owner or new_owner not in group.members:
        raise HTTPException(status_code=404, detail="New owner must be a member of this study group")

    group.creator_id = user_id
    db.commit()
    db.refresh(group)

    await discussion_manager.broadcast_ownership_transferred(group_id, user_id)

    return group


@router.patch("/{group_id}", response_model=schemas.StudyGroupOut)
async def update_group(
    group_id: int,
    group_in: schemas.StudyGroupUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")

    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can edit the group")

    group.name = group_in.name
    if group_in.is_public is not None:
        group.is_public = group_in.is_public
    _invalidate_public_groups()
    db.commit()
    db.refresh(group)

    await discussion_manager.broadcast_group_renamed(group_id, group.name)

    return group


@router.get("/{group_id}", response_model=schemas.StudyGroupOut)
def get_group(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if group.is_banned:
        raise HTTPException(status_code=403, detail="This study group has been banned by the administrator")
    # Verify membership
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this study group")
    return group

@router.post("/{group_id}/invite", status_code=201)
def invite_member(
    group_id: int,
    body: schemas.GroupInviteRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    invitee = db.query(models.User).filter(models.User.email == body.email.strip()).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="No user found with that email")
    if invitee.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot invite yourself")
    if invitee in group.members:
        raise HTTPException(status_code=400, detail="User is already a member of this group")

    # Check for existing pending invitation
    existing = db.query(models.GroupInvitation).filter(
        models.GroupInvitation.group_id == group_id,
        models.GroupInvitation.invitee_id == invitee.id,
        models.GroupInvitation.status == 'pending'
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An invitation has already been sent to this user")

    invitation = models.GroupInvitation(
        group_id=group_id,
        inviter_id=current_user.id,
        invitee_id=invitee.id,
        status='pending',
        created_at=now_ph_naive()
    )
    db.add(invitation)

    # Create notification for the invitee
    notif = models.Notification(
        user_id=invitee.id,
        type="group_invite",
        title=f"Group Invitation from {current_user.name}",
        message=f"You've been invited to join \"{group.name}\"",
        related_id=invitation.id,
        related_type="invitation"
    )
    db.add(notif)
    
    # Send group invitation email
    from ..email import send_group_invite_email
    send_group_invite_email(background_tasks, invitee.email, invitee.name, current_user.name, group.name)
    
    db.commit()
    return {"message": f"Invitation sent to {invitee.name}"}


class LeaveGroupRequest(BaseModel):
    new_owner_id: Optional[int] = None

@router.post("/{group_id}/leave")
async def leave_group(
    group_id: int,
    body: Optional[LeaveGroupRequest] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # If the leaver is the owner and other members exist, require a new owner
    if group.creator_id == current_user.id and len(group.members) > 1:
        if not body or not body.new_owner_id:
            raise HTTPException(
                status_code=400,
                detail="As the group owner, you must designate a new owner before leaving."
            )
        new_owner = db.query(models.User).filter(models.User.id == body.new_owner_id).first()
        if not new_owner or new_owner not in group.members:
            raise HTTPException(status_code=400, detail="New owner must be an existing member of this group")
        group.creator_id = new_owner.id
        await discussion_manager.broadcast_ownership_transferred(group_id, new_owner.id)

    group.members.remove(current_user)

    if len(group.members) == 0:
        db.delete(group)

    _invalidate_public_groups()
    db.commit()
    return {"message": "You have left the group"}


@router.get("/{group_id}/members", response_model=schemas.GroupMembersWithPrefsOut)
def get_group_members_with_prefs(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    members_out = []
    for member in group.members:
        pref = db.query(models.GroupNotificationPref).filter(
            models.GroupNotificationPref.group_id == group_id,
            models.GroupNotificationPref.user_id == member.id
        ).first()
        members_out.append(schemas.GroupMemberWithPrefOut(
            name=member.name,
            email=member.email,
            avatar=member.avatar,
            online=member.online,
            notifications_enabled=pref.enabled if pref else True
        ))
    return schemas.GroupMembersWithPrefsOut(
        group_id=group.id,
        group_name=group.name,
        members=members_out
    )


@router.post("/{group_id}/notifications/toggle", response_model=schemas.GroupNotificationPrefOut)
def toggle_group_notifications(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    pref = db.query(models.GroupNotificationPref).filter(
        models.GroupNotificationPref.group_id == group_id,
        models.GroupNotificationPref.user_id == current_user.id
    ).first()

    if pref:
        pref.enabled = not pref.enabled
    else:
        pref = models.GroupNotificationPref(
            group_id=group_id,
            user_id=current_user.id,
            enabled=False
        )
        db.add(pref)

    db.commit()
    db.refresh(pref)
    return schemas.GroupNotificationPrefOut(
        group_id=pref.group_id,
        enabled=pref.enabled
    )


@router.get("/{group_id}/notification-pref", response_model=schemas.GroupNotificationPrefOut)
def get_group_notification_pref(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    pref = db.query(models.GroupNotificationPref).filter(
        models.GroupNotificationPref.group_id == group_id,
        models.GroupNotificationPref.user_id == current_user.id
    ).first()

    return schemas.GroupNotificationPrefOut(
        group_id=group_id,
        enabled=pref.enabled if pref else True
    )


@router.post("/{group_id}/share-note/{note_id}", response_model=schemas.StudyGroupOut)
def share_note(group_id: int, note_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not authorized")

    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note not in group.notes:
        group.notes.append(note)
        for member in group.members:
            if member.id != current_user.id:
                notif = models.Notification(
                    user_id=member.id,
                    type="note_shared",
                    title=f"{current_user.name} shared a note",
                    message=f"\"{note.title}\" shared in \"{group.name}\"",
                    related_id=note.id,
                    related_type="note"
                )
                db.add(notif)
        db.commit()
        db.refresh(group)
    return group


@router.post("/{group_id}/share-module/{module_id}", response_model=schemas.StudyGroupOut)
def share_module(group_id: int, module_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    module = db.query(models.Module).filter(models.Module.id == module_id, models.Module.user_id == current_user.id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    if module not in group.modules:
        group.modules.append(module)
        # Notify all group members except the sharer
        for member in group.members:
            if member.id != current_user.id:
                notif = models.Notification(
                    user_id=member.id,
                    type="module_shared",
                    title=f"{current_user.name} shared a module",
                    message=f"\"{module.name}\" shared in \"{group.name}\"",
                    related_id=module.id,
                    related_type="module"
                )
                db.add(notif)
        db.commit()
        db.refresh(group)
    return group


# --- REMOVE MODULE FROM GROUP ---
@router.delete("/{group_id}/remove-module/{module_id}", response_model=schemas.StudyGroupOut)
def remove_module_from_group(group_id: int, module_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Group owner or the module sharer can remove it
    if group.creator_id != current_user.id and module.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group owner or module sharer can remove this module")

    if module in group.modules:
        group.modules.remove(module)
        db.commit()
        db.refresh(group)

    return group


# --- WEBSOCKETS REAL-TIME MULTIPLAYER QUIZ ROOMS ---

class ConnectionManager:
    def __init__(self):
        # Maps room_id (group_id + "_" + module_id) to active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Maps room_id to active user rosters: user_id -> participant details dict
        self.room_rosters: Dict[str, Dict[int, Dict[str, Any]]] = {}

    async def connect(self, room_id: str, websocket: WebSocket, user: models.User):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
            self.room_rosters[room_id] = {}
            
        self.active_connections[room_id].add(websocket)
        
        # Add user to roster
        self.room_rosters[room_id][user.id] = {
            "user_id": user.id,
            "name": user.name,
            "avatar": user.avatar,
            "email": user.email,
            "score": "0/0",
            "percentage": 0,
            "time": "0s",
            "finished": False,
            "online": True
        }
        await self.broadcast_roster(room_id)

    def disconnect(self, room_id: str, websocket: WebSocket, user_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if user_id in self.room_rosters[room_id]:
                # Mark as offline instead of removing so they don't disappear from results
                self.room_rosters[room_id][user_id]["online"] = False
                
            if not self.active_connections[room_id]:
                # Clean up if room is completely empty
                self.active_connections.pop(room_id, None)
                self.room_rosters.pop(room_id, None)

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

    async def broadcast_roster(self, room_id: str):
        roster = list(self.room_rosters[room_id].values())
        await self.broadcast_to_room(room_id, {
            "type": "roster_update",
            "members": roster
        })

    async def update_score(self, room_id: str, user_id: int, score: str, percentage: int, time: str):
        if room_id in self.room_rosters and user_id in self.room_rosters[room_id]:
            self.room_rosters[room_id][user_id].update({
                "score": score,
                "percentage": percentage,
                "time": time,
                "finished": True
            })
            
            # Recalculate average score of finished members
            finished_members = [m for m in self.room_rosters[room_id].values() if m["finished"]]
            avg_score = 0
            if finished_members:
                avg_score = round(sum(m["percentage"] for m in finished_members) / len(finished_members))
                
            rankings = sorted(
                list(self.room_rosters[room_id].values()),
                key=lambda x: (not x["finished"], -x["percentage"], x["time"])
            )
            
            await self.broadcast_to_room(room_id, {
                "type": "scoreboard_update",
                "avgScore": f"{avg_score}%",
                "rankings": rankings
            })
            return avg_score, rankings
        return None, None

manager = ConnectionManager()

class DiscussionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, group_id: int, websocket: WebSocket):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = set()
        self.active_connections[group_id].add(websocket)

    def disconnect(self, group_id: int, websocket: WebSocket):
        if group_id in self.active_connections:
            self.active_connections[group_id].discard(websocket)
            if not self.active_connections[group_id]:
                self.active_connections.pop(group_id, None)

    async def broadcast_new_posts(self, group_id: int, posts: list):
        if group_id in self.active_connections:
            message = {
                "type": "new_posts",
                "posts": posts
            }
            for connection in list(self.active_connections[group_id]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.disconnect(group_id, connection)

    async def broadcast_user_status(self, group_id: int, email: str, online: bool):
        if group_id in self.active_connections:
            message = {
                "type": "user_status",
                "email": email,
                "online": online
            }
            for connection in list(self.active_connections[group_id]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.disconnect(group_id, connection)

    async def broadcast_member_joined(self, group_id: int, member: dict):
        if group_id in self.active_connections:
            message = {
                "type": "member_joined",
                "member": member
            }
            for connection in list(self.active_connections[group_id]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.disconnect(group_id, connection)

    async def broadcast_member_removed(self, group_id: int, user_id: int):
        if group_id in self.active_connections:
            message = {
                "type": "member_removed",
                "user_id": user_id
            }
            for connection in list(self.active_connections[group_id]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.disconnect(group_id, connection)

    async def broadcast_ownership_transferred(self, group_id: int, new_owner_id: int):
        if group_id in self.active_connections:
            message = {
                "type": "ownership_transferred",
                "creator_id": new_owner_id
            }
            for connection in list(self.active_connections[group_id]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.disconnect(group_id, connection)

    async def broadcast_group_renamed(self, group_id: int, new_name: str):
        if group_id in self.active_connections:
            message = {
                "type": "group_renamed",
                "name": new_name
            }
            for connection in list(self.active_connections[group_id]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    self.disconnect(group_id, connection)

discussion_manager = DiscussionManager()

@router.websocket("/ws/{group_id}/quiz/{module_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: int, module_id: int, token: str, db: Session = Depends(get_db)):
    # Authenticate user from JWT token passed in query parameters
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    
    if not user or not group or not module or user not in group.members:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    room_id = f"{group_id}_{module_id}"
    await manager.connect(room_id, websocket, user)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "submit_score":
                score = message.get("score")
                percentage = message.get("percentage")
                time_taken = message.get("time")
                
                # Update score and broadcast live rankings
                avg_score_int, rankings = await manager.update_score(
                    room_id, user.id, score, percentage, time_taken
                )
                
                # Check if this is the first submission in the session to create the completed record
                # We save a database record so it displays in scorecards history!
                if avg_score_int is not None:
                    # Create or update QuizSession record in db
                    session_record = db.query(models.QuizSession).filter(
                        models.QuizSession.group_id == group_id,
                        models.QuizSession.module_name == module.name
                    ).order_by(models.QuizSession.id.desc()).first()
                    
                    # If last session was created > 10 minutes ago, or doesn't exist, create a new session
                    # Otherwise, update the current session's rankings
                    is_new_session = True
                    if session_record:
                        # Simple mock: if there are no rankings yet, we can update it
                        # For simplicity, we just save a new one when first user submits,
                        # and then we append rankings to it!
                        # We store session ID in memory or search for it
                        # Let's see: we can look for a session created in the last 10 minutes
                        # We'll just reuse the latest session if it has the same module name
                        pass
                        
                    # Let's create a new database record for safety or append
                    # We can store active sessions on the WebSocket ConnectionManager
                    # Let's write code to create/update the session and rankings:
                    session_id_attr = f"session_id_{room_id}"
                    active_session_id = getattr(manager, session_id_attr, None)
                    
                    if active_session_id is None:
                        # Create new session in DB
                        db_session = models.QuizSession(
                            group_id=group_id,
                            module_name=module.name,
                            date=now_ph().strftime("%b %d, %Y %H:%M"),
                            avg_score=f"{avg_score_int}%"
                        )
                        db.add(db_session)
                        db.commit()
                        db.refresh(db_session)
                        active_session_id = db_session.id
                        setattr(manager, session_id_attr, active_session_id)
                    else:
                        # Update session average
                        db_session = db.query(models.QuizSession).filter(models.QuizSession.id == active_session_id).first()
                        if db_session:
                            db_session.avg_score = f"{avg_score_int}%"
                            db.commit()
                            
                    # Remove existing ranking for this user in this session (if any) and insert new
                    if active_session_id:
                        existing_ranking = db.query(models.QuizRanking).filter(
                            models.QuizRanking.session_id == active_session_id,
                            models.QuizRanking.user_id == user.id
                        ).first()
                        if existing_ranking:
                            existing_ranking.score = score
                            existing_ranking.percentage = percentage
                            existing_ranking.time = time_taken
                        else:
                            db_ranking = models.QuizRanking(
                                session_id=active_session_id,
                                name=user.name,
                                score=score,
                                percentage=percentage,
                                time=time_taken,
                                is_user=True,
                                user_id=user.id
                            )
                            db.add(db_ranking)
                        db.commit()

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket, user.id)
        # Check if room is closed and clean up database session cache attribute
        if room_id not in manager.active_connections:
            session_id_attr = f"session_id_{room_id}"
            if hasattr(manager, session_id_attr):
                delattr(manager, session_id_attr)
        await manager.broadcast_roster(room_id)


@router.websocket("/ws/{group_id}/discussion")
async def websocket_discussion_endpoint(
    websocket: WebSocket,
    group_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id")
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user = db.query(models.User).filter(models.User.id == user_id).first()
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not user or not group or user not in group.members or group.is_banned:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await discussion_manager.connect(group_id, websocket)
    await discussion_manager.broadcast_user_status(group_id, user.email, True)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        discussion_manager.disconnect(group_id, websocket)
        await discussion_manager.broadcast_user_status(group_id, user.email, False)


@router.get("/{group_id}/discussion", response_model=List[schemas.GroupPostOut])
def get_group_discussion(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if group.is_banned:
        raise HTTPException(status_code=403, detail="This study group has been banned by the administrator")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this study group")
    
    return db.query(models.GroupPost).filter(models.GroupPost.group_id == group_id).order_by(models.GroupPost.id.asc()).all()


@router.post("/{group_id}/discussion", response_model=List[schemas.GroupPostOut])
async def post_to_group_discussion(
    group_id: int,
    post_in: schemas.GroupPostCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if group.is_banned:
        raise HTTPException(status_code=403, detail="This study group has been banned by the administrator")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this study group")

    created_str = now_ph().strftime("%b %d, %Y %H:%M")
    user_post = models.GroupPost(
        group_id=group_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_avatar=current_user.avatar,
        content=post_in.content,
        created_at=created_str,
        is_ai=False
    )
    db.add(user_post)
    db.commit()
    db.refresh(user_post)

    created_posts = [user_post]

    content_lower = post_in.content.lower()
    if "@ai" in content_lower or "@tutor" in content_lower:
        query = post_in.content.replace("@ai", "").replace("@AI", "").replace("@tutor", "").replace("@TUTOR", "").strip()
        if not query:
            query = "What is this module about?"
            
        from .tutor import search_relevant_context, generate_mock_tutor_response
        context = search_relevant_context(query, group.modules)
        
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "YOUR_GEMINI_API_KEY":
            ai_answer = generate_mock_tutor_response(query)
        else:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                prompt = f"""
You are "Lumio", an expert academic tutor participating in a study group chat.
Answer the student's question clearly, educationally, and concisely. Use bullet points or simple paragraphs.

Instructions to reduce hallucinations:
1. Use the provided Shared Study Context blocks below as your primary source of information.
2. For every key fact, definition, or explanation you extract from a block, append its source document name as an inline citation at the end of the sentence or paragraph, e.g., `[Chapter 1 - Cell Biology]`.
3. If the answer cannot be found or reasonably inferred from the provided Shared Study Context, explain it using general academic knowledge but explicitly prefix your response with a disclaimer like: "*(Note: This explanation is based on general knowledge as it was not found in your group's shared materials)*".
4. Keep the explanation clear, educational, and structured using bullet points or simple paragraphs.

Shared Study Context:
---
{context}
---

Student Question:
"{query}"
"""
                from ..system_config import get_system_config
                model_name = get_system_config(db, "default_llm_model") or "gemini-2.5-flash"
                try:
                    temp_val = float(get_system_config(db, "ai_temperature") or "0.2")
                except Exception:
                    temp_val = 0.2

                from google.genai import types
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=temp_val
                    )
                )
                ai_answer = response.text if response.text else "I analyzed the shared materials but couldn't generate a clear explanation. Let's try another question!"
            except Exception as e:
                print(f"Error querying Gemini inside group discussion: {e}")
                ai_answer = generate_mock_tutor_response(query)
                
        ai_post = models.GroupPost(
            group_id=group_id,
            user_id=None,
            user_name="Lumio",
            user_avatar=None,
            content=ai_answer,
            created_at=now_ph().strftime("%b %d, %Y %H:%M"),
            is_ai=True
        )
        db.add(ai_post)
        db.commit()
        db.refresh(ai_post)
        created_posts.append(ai_post)

    # Broadcast new posts to all active websocket connections
    posts_out = [
        {
            "id": p.id,
            "group_id": p.group_id,
            "user_id": p.user_id,
            "user_name": p.user_name,
            "user_avatar": p.user_avatar,
            "content": p.content,
            "created_at": p.created_at,
            "is_ai": p.is_ai
        }
        for p in created_posts
    ]
    await discussion_manager.broadcast_new_posts(group_id, posts_out)

    return created_posts

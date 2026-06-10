from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Set, Any
import json
import jwt
from datetime import datetime
from ..database import get_db
from .. import models, schemas, auth
from ..config import settings
from ..time_utils import now_ph, now_ph_naive

router = APIRouter(prefix="/api/groups", tags=["groups"])

# --- REST ENDPOINTS ---

@router.get("", response_model=List[schemas.StudyGroupOut])
def get_groups(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Returns groups that the current user is a member of
    return current_user.joined_groups

@router.post("", response_model=schemas.StudyGroupOut)
def create_group(
    group_in: schemas.StudyGroupCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_group = models.StudyGroup(name=group_in.name, creator_id=current_user.id)
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
def accept_invitation(
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
    if current_user not in group.members:
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
    db.commit()
    db.refresh(group)
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


@router.get("/{group_id}", response_model=schemas.StudyGroupOut)
def get_group(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
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


@router.post("/{group_id}/leave")
def leave_group(
    group_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    group.members.remove(current_user)

    # If no members left, delete the group entirely
    if len(group.members) == 0:
        db.delete(group)

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

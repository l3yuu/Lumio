from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict, Set, Any
import json
import jwt
from datetime import datetime
from ..database import get_db
from .. import models, schemas, auth
from ..config import settings

router = APIRouter(prefix="/api/groups", tags=["groups"])

# --- REST ENDPOINTS ---

@router.get("", response_model=List[schemas.StudyGroupOut])
def get_groups(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Returns groups that the current user is a member of
    return current_user.joined_groups

@router.post("", response_model=schemas.StudyGroupOut)
def create_group(group_in: schemas.StudyGroupCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_group = models.StudyGroup(name=group_in.name, creator_id=current_user.id)
    db_group.members.append(current_user)
    
    # Add other invited members
    for email in group_in.members:
        invited_user = db.query(models.User).filter(models.User.email == email.strip()).first()
        if invited_user and invited_user not in db_group.members:
            db_group.members.append(invited_user)
            
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/{group_id}", response_model=schemas.StudyGroupOut)
def get_group(group_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    # Verify membership
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not a member of this study group")
    return group

@router.post("/{group_id}/members", response_model=schemas.StudyGroupOut)
def add_member(group_id: int, member_email: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.StudyGroup).filter(models.StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    if current_user not in group.members:
        raise HTTPException(status_code=403, detail="Not authorized to manage this group")
        
    invited_user = db.query(models.User).filter(models.User.email == member_email.strip()).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="User with this email not found")
        
    if invited_user not in group.members:
        group.members.append(invited_user)
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
                            date=datetime.utcnow().strftime("%b %d, %Y %H:%M"),
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

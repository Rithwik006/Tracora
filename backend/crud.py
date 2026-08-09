from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
import models, schemas
from core.security import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user: models.User, new_password: str):
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user

def get_tasks(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(models.Task).filter(models.Task.owner_id == user_id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Task.title.ilike(search_filter),
                models.Task.description.ilike(search_filter)
            )
        )

    if priority and priority.lower() != 'all':
        query = query.filter(models.Task.priority == priority.lower())

    if status == 'completed':
        query = query.filter(models.Task.is_completed == True)
    elif status == 'active' or status == 'pending':
        query = query.filter(models.Task.is_completed == False)
    elif status == 'overdue':
        now = datetime.now()
        query = query.filter(models.Task.is_completed == False, models.Task.due_date < now)


    return query.order_by(models.Task.id.desc()).offset(skip).limit(limit).all()

def create_user_task(db: Session, task: schemas.TaskCreate, user_id: int):
    db_task = models.Task(**task.model_dump(), owner_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, user_id: int, task_update: schemas.TaskUpdate):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.owner_id == user_id).first()
    if not db_task:
        return None
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.owner_id == user_id).first()
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True

def delete_completed_tasks(db: Session, user_id: int) -> int:
    deleted_count = db.query(models.Task).filter(
        models.Task.owner_id == user_id,
        models.Task.is_completed == True
    ).delete(synchronize_session=False)
    db.commit()
    return deleted_count


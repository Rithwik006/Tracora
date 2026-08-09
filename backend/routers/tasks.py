from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import schemas, crud, models
from routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.TaskResponse)
def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_user_task(db=db, task=task, user_id=current_user.id)

@router.get("/", response_model=List[schemas.TaskResponse])
def read_tasks(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tasks = crud.get_tasks(
        db, user_id=current_user.id, skip=skip, limit=limit,
        status=status, priority=priority, search=search
    )
    return tasks

@router.delete("/completed/clear")
def clear_completed_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    count = crud.delete_completed_tasks(db, user_id=current_user.id)
    return {"message": f"Deleted {count} completed tasks", "deleted_count": count}

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    updated_task = crud.update_task(db, task_id=task_id, user_id=current_user.id, task_update=task_update)
    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated_task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    success = crud.delete_task(db, task_id=task_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


import os
import sys
import tempfile
from pathlib import Path
import pytest
from starlette.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import models
from main import app
from database import Base, get_db

@pytest.fixture(scope="session")
def test_db_setup():
    # Create temporary database file
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test.db")
    test_db_url = f"sqlite:///{db_path}"

    test_engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield test_engine, TestingSessionLocal

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    try:
        os.remove(db_path)
    except OSError:
        pass

@pytest.fixture
def client(test_db_setup):
    return TestClient(app)

def test_root_and_health(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()

    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

def test_user_registration_and_login(client):
    # Register user
    reg_resp = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "securepassword123"
    })
    assert reg_resp.status_code == 200
    user_data = reg_resp.json()
    assert user_data["email"] == "test@example.com"
    assert "id" in user_data

    # Duplicate registration should fail
    dup_resp = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "anotherpassword"
    })
    assert dup_resp.status_code == 400
    assert dup_resp.json()["detail"] == "Email already registered"

    # Short password should fail validation (< 4 chars)
    short_resp = client.post("/auth/register", json={
        "email": "short@example.com",
        "password": "12"
    })
    assert short_resp.status_code == 422

    # Login with correct password
    login_resp = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "securepassword123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token

    # Login with wrong password
    bad_login = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401

    # /auth/me with valid token
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "test@example.com"

def test_task_crud_and_lifecycle(client):
    # Register and get auth token
    client.post("/auth/register", json={"email": "taskuser@example.com", "password": "password123"})
    login_resp = client.post("/auth/login", data={"username": "taskuser@example.com", "password": "password123"})
    token = login_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Create task with due date
    create_resp = client.post("/tasks/", json={
        "title": "Finish Project Report",
        "description": "Complete sections 1 to 5",
        "priority": "high",
        "due_date": "2026-12-01T15:30:00"
    }, headers=auth_headers)
    assert create_resp.status_code == 200
    task1 = create_resp.json()
    assert task1["title"] == "Finish Project Report"
    assert task1["priority"] == "high"
    assert task1["is_completed"] is False
    task1_id = task1["id"]

    # 2. Get single task by ID
    get_resp = client.get(f"/tasks/{task1_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == task1_id

    # 3. Create second task
    client.post("/tasks/", json={
        "title": "Buy Groceries",
        "description": "Milk, eggs, coffee",
        "priority": "low"
    }, headers=auth_headers)

    # 4. List tasks
    list_resp = client.get("/tasks/", headers=auth_headers)
    assert list_resp.status_code == 200
    tasks = list_resp.json()
    assert len(tasks) == 2

    # 5. Search filter
    search_resp = client.get("/tasks/?search=Groceries", headers=auth_headers)
    assert search_resp.status_code == 200
    assert len(search_resp.json()) == 1
    assert search_resp.json()[0]["title"] == "Buy Groceries"

    # 6. Priority filter
    prio_resp = client.get("/tasks/?priority=high", headers=auth_headers)
    assert prio_resp.status_code == 200
    assert len(prio_resp.json()) == 1
    assert prio_resp.json()[0]["priority"] == "high"

    # 7. Update task - mark completed and clear due_date
    update_resp = client.put(f"/tasks/{task1_id}", json={
        "is_completed": True,
        "due_date": None
    }, headers=auth_headers)
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["is_completed"] is True
    assert updated["due_date"] is None

    # 8. Status filter: completed
    completed_resp = client.get("/tasks/?status=completed", headers=auth_headers)
    assert completed_resp.status_code == 200
    assert len(completed_resp.json()) == 1

    # 9. Clear completed tasks
    clear_resp = client.delete("/tasks/completed/clear", headers=auth_headers)
    assert clear_resp.status_code == 200
    assert clear_resp.json()["deleted_count"] == 1

    # Verify only 1 active task left
    remaining_resp = client.get("/tasks/", headers=auth_headers)
    assert len(remaining_resp.json()) == 1

    # 10. Delete remaining task
    rem_id = remaining_resp.json()[0]["id"]
    del_resp = client.delete(f"/tasks/{rem_id}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Verify empty list
    final_list = client.get("/tasks/", headers=auth_headers)
    assert len(final_list.json()) == 0

def test_multi_user_isolation(client):
    # User A
    client.post("/auth/register", json={"email": "alice@example.com", "password": "password123"})
    token_a = client.post("/auth/login", data={"username": "alice@example.com", "password": "password123"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B
    client.post("/auth/register", json={"email": "bob@example.com", "password": "password123"})
    token_b = client.post("/auth/login", data={"username": "bob@example.com", "password": "password123"}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Alice creates a task
    alice_task = client.post("/tasks/", json={"title": "Alice Secret Task"}, headers=headers_a).json()

    # Bob lists tasks - should see 0
    bob_tasks = client.get("/tasks/", headers=headers_b).json()
    assert len(bob_tasks) == 0

    # Bob tries to access Alice's task by ID - should return 404
    bob_get_alice_task = client.get(f"/tasks/{alice_task['id']}", headers=headers_b)
    assert bob_get_alice_task.status_code == 404

    # Bob tries to delete Alice's task - should return 404
    bob_del_alice_task = client.delete(f"/tasks/{alice_task['id']}", headers=headers_b)
    assert bob_del_alice_task.status_code == 404

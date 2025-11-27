import pytest
from httpx import AsyncClient
from app.main import app
from app.models.user import User
from app.utils.security import hash_password, create_access_token
from app.database import init_db

@pytest.fixture(scope="function")
async def setup_db():
    """Setup test database."""
    await init_db()
    yield
    # Cleanup
    await User.find().delete()

@pytest.fixture
async def test_admin():
    """Create a test admin."""
    user = User(
        username="admin",
        password_hash=hash_password("AdminPass123"),
        role="admin",
        name="Admin User",
        email="admin@example.com",
        pay_rate=0.0,
        status="active"
    )
    await user.insert()
    return user

@pytest.fixture
async def test_employee():
    """Create a test employee."""
    user = User(
        username="employee",
        password_hash=hash_password("EmpPass123"),
        role="employee",
        name="Employee User",
        email="emp@example.com",
        pay_rate=25.0,
        status="active"
    )
    await user.insert()
    return user

@pytest.fixture
def admin_token(test_admin):
    """Generate token for admin."""
    return create_access_token(
        data={
            "user_id": str(test_admin.id),
            "username": test_admin.username,
            "role": test_admin.role
        }
    )

@pytest.fixture
def employee_token(test_employee):
    """Generate token for employee."""
    return create_access_token(
        data={
            "user_id": str(test_employee.id),
            "username": test_employee.username,
            "role": test_employee.role
        }
    )

@pytest.mark.asyncio
async def test_admin_only_endpoint_rejects_employee(setup_db, test_admin, test_employee, employee_token):
    """Test that admin-only endpoints reject employee tokens."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/users",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
    
    assert response.status_code == 403
    assert "Admin access required" in response.json()["detail"]

@pytest.mark.asyncio
async def test_admin_can_access_admin_endpoint(setup_db, test_admin, admin_token):
    """Test that admin can access admin-only endpoints."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_unauthorized_request_fails(setup_db):
    """Test that requests without token fail."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/users")
    
    assert response.status_code == 403  # FastAPI HTTPBearer returns 403 for missing token

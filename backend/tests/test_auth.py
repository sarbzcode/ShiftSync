import pytest
from httpx import AsyncClient
from app.main import app
from app.models.user import User
from app.utils.security import hash_password
from app.database import init_db

@pytest.fixture(scope="function")
async def setup_db():
    """Setup test database."""
    await init_db()
    yield
    # Cleanup
    await User.find().delete()

@pytest.fixture
async def test_user():
    """Create a test user."""
    user = User(
        username="testuser",
        password_hash=hash_password("TestPass123"),
        role="employee",
        name="Test User",
        email="test@example.com",
        pay_rate=20.0,
        status="active"
    )
    await user.insert()
    return user

@pytest.mark.asyncio
async def test_login_success(setup_db, test_user):
    """Test successful login."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"username": "testuser", "password": "TestPass123"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["username"] == "testuser"
    assert data["role"] == "employee"

@pytest.mark.asyncio
async def test_login_invalid_credentials(setup_db, test_user):
    """Test login with invalid credentials."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"username": "testuser", "password": "WrongPassword"}
        )
    
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_seed_admin(setup_db):
    """Test admin seeding."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/auth/seed-admin")
    
    assert response.status_code == 200
    data = response.json()
    assert "Admin user created" in data["message"]

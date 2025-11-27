import pytest
from httpx import AsyncClient
from datetime import datetime, timezone, date, timedelta
from app.main import app
from app.models.user import User
from app.models.attendance import Attendance
from app.models.shift import Shift
from app.utils.security import hash_password, create_access_token
from app.database import init_db

@pytest.fixture(scope="function")
async def setup_db():
    """Setup test database."""
    await init_db()
    yield
    # Cleanup
    await User.find().delete()
    await Attendance.find().delete()

@pytest.fixture
async def test_employee():
    """Create a test employee."""
    user = User(
        username="employee1",
        password_hash=hash_password("Pass123"),
        role="employee",
        name="Employee One",
        email="emp1@example.com",
        pay_rate=25.0,
        status="active"
    )
    await user.insert()
    return user

@pytest.fixture
async def admin_user():
    """Create a test admin."""
    user = User(
        username="admin1",
        password_hash=hash_password("Pass123"),
        role="admin",
        name="Admin User",
        email="admin@example.com",
        pay_rate=0.0,
        status="active"
    )
    await user.insert()
    return user

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

@pytest.fixture
def admin_token(admin_user):
    """Generate token for admin."""
    return create_access_token(
        data={
            "user_id": str(admin_user.id),
            "username": admin_user.username,
            "role": admin_user.role
        }
    )

@pytest.mark.asyncio
async def test_clock_in(setup_db, test_employee, employee_token):
    """Test employee clock in."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/attendance/start",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == str(test_employee.id)
    assert data["clock_in"] is not None
    assert data["clock_out"] is None

@pytest.mark.asyncio
async def test_double_clock_in_prevented(setup_db, test_employee, employee_token):
    """Test that double clock-in is prevented."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First clock in
        await client.post(
            "/attendance/start",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        
        # Try to clock in again
        response = await client.post(
            "/attendance/start",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
    
    assert response.status_code == 400
    assert "Already clocked in" in response.json()["detail"]

@pytest.mark.asyncio
async def test_hours_worked_calculation(setup_db, test_employee, employee_token):
    """Test hours worked calculation on clock out."""
    # Manually create an attendance record with clock_in
    now = datetime.now(timezone.utc)
    attendance = Attendance(
        user_id=test_employee.id,
        clock_in=now,
        date=now.date()
    )
    await attendance.insert()
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/attendance/end",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["clock_out"] is not None
    assert data["hours_worked"] is not None
    assert data["hours_worked"] >= 0

@pytest.mark.asyncio
async def test_clock_in_marks_shift_completed(setup_db, test_employee, employee_token):
    """Clocking in should mark assigned shift as completed."""
    today = date.today()
    shift = Shift(
        employee_id=test_employee.id,
        shift_date=today,
        start_time="09:00",
        end_time="17:00",
        status="assigned",
    )
    await shift.insert()

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/attendance/start",
            headers={"Authorization": f"Bearer {employee_token}"}
        )

    assert response.status_code == 200
    updated_shift = await Shift.get(shift.id)
    assert updated_shift is not None
    assert updated_shift.status == "completed"


@pytest.mark.asyncio
async def test_admin_can_clock_in_employee(setup_db, test_employee, admin_token):
    """Admins should be able to clock in an employee."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            f"/attendance/admin/{test_employee.id}/start",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == str(test_employee.id)
    assert data["clock_in"] is not None
    assert data["clock_out"] is None


@pytest.mark.asyncio
async def test_admin_can_clock_out_employee(setup_db, test_employee, admin_token):
    """Admins should be able to clock out an employee."""
    now = datetime.now(timezone.utc)
    attendance = Attendance(
        user_id=test_employee.id,
        clock_in=now - timedelta(hours=1),
        date=now.date()
    )
    await attendance.insert()

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            f"/attendance/admin/{test_employee.id}/end",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["clock_out"] is not None
    assert data["hours_worked"] is not None

@pytest.mark.asyncio
async def test_clock_out_marks_shift_completed(setup_db, test_employee, employee_token):
    """Clocking out should also mark assigned shift as completed."""
    now = datetime.now(timezone.utc)
    attendance = Attendance(
        user_id=test_employee.id,
        clock_in=now - timedelta(hours=4),
        date=now.date()
    )
    await attendance.insert()

    shift = Shift(
        employee_id=test_employee.id,
        shift_date=now.date(),
        start_time="08:00",
        end_time="12:00",
        status="assigned",
    )
    await shift.insert()

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/attendance/end",
            headers={"Authorization": f"Bearer {employee_token}"}
        )

    assert response.status_code == 200
    updated_shift = await Shift.get(shift.id)
    assert updated_shift is not None
    assert updated_shift.status == "completed"

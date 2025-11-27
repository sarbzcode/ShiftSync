import pytest
from httpx import AsyncClient
from datetime import date, timedelta, datetime
from app.main import app
from app.models.user import User
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.utils.security import hash_password, create_access_token
from app.utils.scheduler import generate_payroll
from app.database import init_db

@pytest.fixture(scope="function")
async def setup_db():
    """Setup test database."""
    await init_db()
    yield
    # Cleanup
    await User.find().delete()
    await Attendance.find().delete()
    await Payroll.find().delete()

@pytest.fixture
async def test_employee():
    """Create a test employee."""
    user = User(
        username="payroll_emp",
        password_hash=hash_password("Pass123"),
        role="employee",
        name="Payroll Employee",
        email="payroll@example.com",
        pay_rate=30.0,
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

@pytest.mark.asyncio
async def test_employee_cannot_see_pending_payroll(setup_db, test_employee, employee_token):
    """Test that employee cannot see pending payroll."""
    # Create a pending payroll
    payroll = Payroll(
        user_id=test_employee.id,
        period_start=date.today() - timedelta(days=14),
        period_end=date.today() - timedelta(days=1),
        total_hours=80.0,
        gross_pay=2400.0,
        status="pending"
    )
    await payroll.insert()
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/payroll/my",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0  # Should not see pending payroll

@pytest.mark.asyncio
async def test_payroll_generation_aggregates_hours(setup_db, test_employee):
    """Test that payroll generation correctly aggregates hours."""
    # Create some completed attendance records
    today = date.today()
    for i in range(5):
        attendance = Attendance(
            user_id=test_employee.id,
            clock_in=datetime(today.year, today.month, today.day, 8, 0),
            clock_out=datetime(today.year, today.month, today.day, 17, 0),
            hours_worked=9.0,
            date=today - timedelta(days=i)
        )
        await attendance.insert()
    
    # Generate payroll
    await generate_payroll()
    
    # Check payroll created
    payroll = await Payroll.find_one(Payroll.user_id == test_employee.id)
    assert payroll is not None
    assert payroll.total_hours == 45.0  # 9 hours * 5 days
    assert payroll.gross_pay == 1350.0  # 45 hours * $30/hour
    assert payroll.status == "pending"

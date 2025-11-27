from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta, timezone, date
import logging
from bson import ObjectId

from app.models.user import User
from app.models.attendance import Attendance
from app.models.payroll import Payroll
from app.services.system_settings import get_current_date

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def generate_payroll():
    """Generate payroll for all employees for the previous 14-day period."""
    try:
        logger.info("[Scheduler] Starting payroll generation...")
        
        # Calculate period
        today = await get_current_date()
        period_end = today - timedelta(days=1)  # Yesterday
        period_start = period_end - timedelta(days=13)  # 14 days total
        
        logger.info(f"[Scheduler] Generating payroll for period {period_start} to {period_end}")
        
        # Get all active employees
        employees = await User.find(User.role == "employee", User.status == "active").to_list()
        
        payroll_count = 0
        
        for employee in employees:
            # Get attendance records for the period
            attendance_records = await Attendance.find(
                Attendance.user_id == employee.id,
                Attendance.date >= period_start,
                Attendance.date <= period_end,
                Attendance.clock_out != None  # Only completed attendance
            ).to_list()
            
            # Calculate total hours
            total_hours = sum(record.hours_worked or 0 for record in attendance_records)
            
            # Skip if no hours worked
            if total_hours == 0:
                logger.info(f"[Scheduler] Skipping {employee.username} - no hours worked")
                continue
            
            # Calculate gross pay
            gross_pay = total_hours * employee.pay_rate
            
            # Create payroll entry
            payroll = Payroll(
                user_id=employee.id,
                period_start=period_start,
                period_end=period_end,
                total_hours=total_hours,
                gross_pay=gross_pay,
                status="pending"
            )
            
            await payroll.insert()
            payroll_count += 1
            
            logger.info(f"[Scheduler] Created payroll for {employee.username}: {total_hours}h = ${gross_pay:.2f}")
        
        logger.info(f"[Scheduler] Created {payroll_count} payroll entries for period {period_start} to {period_end}")
        
    except Exception as e:
        logger.error(f"[Scheduler] Payroll generation failed: {e}")

def start_scheduler():
    """Start the APScheduler for automated payroll."""
    try:
        # Run every 14 days at midnight
        scheduler.add_job(
            generate_payroll,
            trigger=IntervalTrigger(days=14),
            id="payroll_generation",
            name="Generate bi-weekly payroll",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("[Scheduler] APScheduler started - payroll will run every 14 days")
    except Exception as e:
        logger.error(f"[Scheduler] Failed to start scheduler: {e}")

def shutdown_scheduler():
    """Shutdown the APScheduler."""
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("[Scheduler] APScheduler shut down")
    except Exception as e:
        logger.error(f"[Scheduler] Failed to shutdown scheduler: {e}")

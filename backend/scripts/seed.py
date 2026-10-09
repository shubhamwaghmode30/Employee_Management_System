"""Idempotent seed script for roles and bootstrap admin.

Run from backend/ directory:
    python scripts/seed.py
"""

import os
import sys
from datetime import UTC, datetime

from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.models  # noqa: F401
from app.core.database import Base, SessionLocal, engine
from app.core.security import Argon2PasswordHasher
from app.domain.primitives import EmploymentType, RoleName
from app.models.employee import ContractEmployee, Employee, FullTimeEmployee
from app.models.role import Role


def seed_roles(session: Session) -> None:
    """Insert the three system roles if they don't exist."""
    roles = [
        Role(name=RoleName.ADMIN, description="Administrator with full access"),
        Role(
            name=RoleName.HR_MANAGER,
            description="HR Manager with read/create/update access",
        ),
        Role(name=RoleName.EMPLOYEE, description="Employee with read-only access"),
    ]

    for role in roles:
        existing = session.query(Role).filter_by(name=role.name).first()
        if not existing:
            session.add(role)

    session.commit()


def seed_admin(session: Session) -> None:
    """Insert a bootstrap admin user from environment variables."""
    admin_email = os.getenv("SEED_ADMIN_EMAIL")
    admin_password = os.getenv("SEED_ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise ValueError(
            "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in environment"
        )

    admin_role = session.query(Role).filter_by(name=RoleName.ADMIN).first()
    if not admin_role:
        raise ValueError("Admin role not found. Run seed_roles first.")

    existing_admin = (
        session.query(FullTimeEmployee)
        .filter_by(email=admin_email)
        .filter_by(role_id=admin_role.id)
        .first()
    )

    if not existing_admin:
        hasher = Argon2PasswordHasher()
        admin = FullTimeEmployee(
            employee_code="ADMIN001",
            first_name="System",
            last_name="Administrator",
            email=admin_email,
            password_hash=hasher.hash(admin_password),
            department="Administration",
            job_title="System Administrator",
            hire_date=datetime.now(UTC),
            role_id=admin_role.id,
            employment_type=EmploymentType.FULL_TIME,
            is_active=True,
        )
        session.add(admin)
        session.commit()


def seed_sample_employees(session: Session) -> None:
    """Insert 4 realistic sample employees if they don't exist."""
    sample_password = os.getenv("SEED_SAMPLE_PASSWORD")
    if not sample_password:
        return

    hr_role = session.query(Role).filter_by(name=RoleName.HR_MANAGER).first()
    employee_role = session.query(Role).filter_by(name=RoleName.EMPLOYEE).first()

    if not hr_role or not employee_role:
        raise ValueError("HR Manager and Employee roles must exist first.")

    hasher = Argon2PasswordHasher()

    sample_employees = [
        FullTimeEmployee(
            employee_code="HRM001",
            first_name="Priya",
            last_name="Sharma",
            email="priya.sharma@company.com",
            password_hash=hasher.hash(sample_password),
            phone="+91-9876543210",
            department="Human Resources",
            job_title="HR Manager",
            hire_date=datetime.now(UTC),
            role_id=hr_role.id,
            employment_type=EmploymentType.FULL_TIME,
            is_active=True,
        ),
        FullTimeEmployee(
            employee_code="ENG001",
            first_name="Rahul",
            last_name="Verma",
            email="rahul.verma@company.com",
            password_hash=hasher.hash(sample_password),
            phone="+91-9876543211",
            department="Engineering",
            job_title="Senior Software Engineer",
            hire_date=datetime.now(UTC),
            role_id=employee_role.id,
            employment_type=EmploymentType.FULL_TIME,
            is_active=True,
        ),
        FullTimeEmployee(
            employee_code="ENG002",
            first_name="Anita",
            last_name="Desai",
            email="anita.desai@company.com",
            password_hash=hasher.hash(sample_password),
            phone="+91-9876543212",
            department="Engineering",
            job_title="Software Engineer",
            hire_date=datetime.now(UTC),
            role_id=employee_role.id,
            employment_type=EmploymentType.FULL_TIME,
            is_active=True,
        ),
        ContractEmployee(
            employee_code="CON001",
            first_name="Vikram",
            last_name="Patel",
            email="vikram.patel@company.com",
            password_hash=hasher.hash(sample_password),
            phone="+91-9876543213",
            department="Marketing",
            job_title="Marketing Consultant",
            hire_date=datetime.now(UTC),
            role_id=employee_role.id,
            employment_type=EmploymentType.CONTRACT,
            is_active=True,
        ),
    ]

    for emp in sample_employees:
        existing = session.query(Employee).filter_by(email=emp.email).first()
        if not existing:
            session.add(emp)

    session.commit()


def main() -> None:
    """Run all seed operations."""
    Base.metadata.create_all(engine)

    session = SessionLocal()
    try:
        seed_roles(session)
        seed_admin(session)
        seed_sample_employees(session)
        print("Seed completed successfully.")
    finally:
        session.close()


if __name__ == "__main__":
    main()

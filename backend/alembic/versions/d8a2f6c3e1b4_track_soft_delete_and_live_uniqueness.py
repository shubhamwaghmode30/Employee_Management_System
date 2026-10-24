"""track who soft-deleted an employee and scope uniqueness to live rows

Soft-deleted rows keep their data for audit and restore. Email and employee
code stay unique among live rows only, so a departed employee's address can be
reused, and restoring is checked for clashes by the service.

Revision ID: d8a2f6c3e1b4
Revises: c41e7b2d9f10
Create Date: 2026-10-24 11:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd8a2f6c3e1b4'
down_revision: str | Sequence[str] | None = 'c41e7b2d9f10'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LIVE_ROWS = sa.text('deleted_at IS NULL')


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('employees') as batch_op:
        batch_op.add_column(
            sa.Column('deleted_by_id', sa.String(length=36), nullable=True)
        )
        batch_op.create_foreign_key(
            'fk_employees_deleted_by_id', 'employees', ['deleted_by_id'], ['id']
        )
        batch_op.drop_index('ix_employees_email')
        batch_op.drop_index('ix_employees_employee_code')
        batch_op.create_index('ix_employees_deleted_at', ['deleted_at'])
        batch_op.create_index(
            'uq_employees_email_live',
            ['email'],
            unique=True,
            sqlite_where=LIVE_ROWS,
            postgresql_where=LIVE_ROWS,
        )
        batch_op.create_index(
            'uq_employees_employee_code_live',
            ['employee_code'],
            unique=True,
            sqlite_where=LIVE_ROWS,
            postgresql_where=LIVE_ROWS,
        )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            "INSERT INTO permissions (name, description) "
            "VALUES ('EMPLOYEE_RESTORE', 'View and restore soft-deleted employees')"
        )
    )
    connection.execute(
        sa.text(
            "INSERT INTO role_permissions (role_id, permission_name) "
            "SELECT id, 'EMPLOYEE_RESTORE' FROM roles WHERE name = 'ADMIN'"
        )
    )


def downgrade() -> None:
    """Downgrade schema. Fails if live and deleted rows now share an email."""
    connection = op.get_bind()
    connection.execute(
        sa.text(
            "DELETE FROM role_permissions WHERE permission_name = 'EMPLOYEE_RESTORE'"
        )
    )
    connection.execute(
        sa.text("DELETE FROM permissions WHERE name = 'EMPLOYEE_RESTORE'")
    )
    with op.batch_alter_table('employees') as batch_op:
        batch_op.drop_index('uq_employees_employee_code_live')
        batch_op.drop_index('uq_employees_email_live')
        batch_op.drop_index('ix_employees_deleted_at')
        batch_op.create_index(
            'ix_employees_employee_code', ['employee_code'], unique=True
        )
        batch_op.create_index('ix_employees_email', ['email'], unique=True)
        batch_op.drop_constraint('fk_employees_deleted_by_id', type_='foreignkey')
        batch_op.drop_column('deleted_by_id')

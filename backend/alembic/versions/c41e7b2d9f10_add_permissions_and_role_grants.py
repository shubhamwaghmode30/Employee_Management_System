"""add permissions and role grants as reference data

Roles, permissions and the grants between them live in the database so that
access can be audited and changed without editing seed scripts or code.

Revision ID: c41e7b2d9f10
Revises: a6193a57a1ea
Create Date: 2026-10-24 10:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c41e7b2d9f10'
down_revision: str | Sequence[str] | None = 'a6193a57a1ea'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Frozen copies: migrations must not change when application code does.
ROLES: list[tuple[str, str]] = [
    ('ADMIN', 'Administrator with full access'),
    ('HR_MANAGER', 'HR Manager with read/create/update access'),
    ('EMPLOYEE', 'Employee with read-only access'),
]

PERMISSIONS: list[tuple[str, str]] = [
    ('EMPLOYEE_READ', 'View employee records'),
    ('EMPLOYEE_CREATE', 'Create employee records'),
    ('EMPLOYEE_UPDATE', 'Update employee records'),
    ('EMPLOYEE_DELETE', 'Soft-delete employee records'),
    ('ROLE_ASSIGN', 'Grant the ADMIN role'),
]

GRANTS: list[tuple[str, str]] = [
    ('ADMIN', 'EMPLOYEE_READ'),
    ('ADMIN', 'EMPLOYEE_CREATE'),
    ('ADMIN', 'EMPLOYEE_UPDATE'),
    ('ADMIN', 'EMPLOYEE_DELETE'),
    ('ADMIN', 'ROLE_ASSIGN'),
    ('HR_MANAGER', 'EMPLOYEE_READ'),
    ('HR_MANAGER', 'EMPLOYEE_CREATE'),
    ('HR_MANAGER', 'EMPLOYEE_UPDATE'),
    ('EMPLOYEE', 'EMPLOYEE_READ'),
]


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('permissions',
    sa.Column(
        'name',
        sa.Enum(
            'EMPLOYEE_READ',
            'EMPLOYEE_CREATE',
            'EMPLOYEE_UPDATE',
            'EMPLOYEE_DELETE',
            'ROLE_ASSIGN',
            name='permission',
            native_enum=False,
            length=50,
        ),
        nullable=False,
    ),
    sa.Column('description', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('name')
    )
    op.create_table('role_permissions',
    sa.Column('role_id', sa.Integer(), nullable=False),
    sa.Column('permission_name', sa.String(length=50), nullable=False),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(
        ['permission_name'], ['permissions.name'], ondelete='CASCADE'
    ),
    sa.PrimaryKeyConstraint('role_id', 'permission_name')
    )

    connection = op.get_bind()
    # Databases seeded by the old seed script already hold the roles.
    for role_name, description in ROLES:
        connection.execute(
            sa.text(
                'INSERT INTO roles (name, description, created_at) '
                'SELECT :name, :description, CURRENT_TIMESTAMP '
                'WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = :name)'
            ),
            {'name': role_name, 'description': description},
        )
    for permission_name, description in PERMISSIONS:
        connection.execute(
            sa.text(
                'INSERT INTO permissions (name, description) '
                'VALUES (:name, :description)'
            ),
            {'name': permission_name, 'description': description},
        )
    for role_name, permission_name in GRANTS:
        connection.execute(
            sa.text(
                'INSERT INTO role_permissions (role_id, permission_name) '
                'SELECT id, :permission_name FROM roles WHERE name = :role_name'
            ),
            {'role_name': role_name, 'permission_name': permission_name},
        )


def downgrade() -> None:
    """Downgrade schema. Roles stay, since employees reference them."""
    op.drop_table('role_permissions')
    op.drop_table('permissions')

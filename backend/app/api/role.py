"""Role routes for listing assignable roles."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_role_repository, require_permission
from app.domain.primitives import Permission
from app.repositories.role import RoleRepository
from app.schemas.role import RoleRead

role_router = APIRouter(prefix="/roles", tags=["roles"])


@role_router.get(
    "",
    response_model=list[RoleRead],
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_READ))],
)
def list_roles(
    role_repo: RoleRepository = Depends(get_role_repository),
) -> list[RoleRead]:
    """List system roles so clients can label and assign them."""
    roles = sorted(role_repo.list(), key=lambda role: role.id)
    return [RoleRead.model_validate(role) for role in roles]

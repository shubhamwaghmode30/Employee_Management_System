"""Pydantic schemas for Role model."""

from pydantic import BaseModel, ConfigDict


class RoleRead(BaseModel):
    """Schema for reading a role."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str

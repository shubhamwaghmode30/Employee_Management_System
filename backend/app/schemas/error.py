"""Pydantic schemas for API error responses."""

from pydantic import BaseModel, ConfigDict


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    model_config = ConfigDict(from_attributes=True)

    code: str
    message: str

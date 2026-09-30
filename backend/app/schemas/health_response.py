from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    """Liveness payload for load balancers and local smoke checks."""

    model_config = ConfigDict(strict=True, frozen=True)

    status: Literal["ok"] = Field(default="ok")

from typing import Optional
from pydantic import BaseModel
from app.models.investigation import Investigation, Recommendation, RootCause


class InvestigationRequest(BaseModel):
    rerun: Optional[bool] = False


InvestigationResponse = Investigation

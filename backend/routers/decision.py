from fastapi import APIRouter, HTTPException
from engine.models import DecisionRequest, DecisionResponse
from engine import decision_engine

router = APIRouter()


@router.post("/recommend", response_model=DecisionResponse)
async def recommend(request: DecisionRequest) -> DecisionResponse:
    """
    Takes plantation profile + hourly forecast and returns a tap/no-tap decision
    with reasoning.
    """
    try:
        return decision_engine.evaluate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision engine error: {str(e)}")

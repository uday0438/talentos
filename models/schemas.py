from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RankingWeights(BaseModel):
    w_semantic: float = 0.40
    w_skills: float = 0.20
    w_yoe: float = 0.15
    w_builder: float = 0.10
    w_behavioral: float = 0.10
    w_logistics: float = 0.05
    job_description: Optional[str] = None

class CandidateResponse(BaseModel):
    candidate_id: str
    rank: int
    score: float
    reasoning: str
    name: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    location: Optional[str] = None
    years_of_experience: float
    notice_period_days: int
    response_rate: int
    semantic_score: float
    skills_score: float
    builder_score: float
    behavioral_score: float
    yoe_score: float
    logistics_score: float
    hpi: float
    learning_velocity: float
    innovation_index: float
    growth_potential: float
    adaptability: float
    leadership: float
    risk_index: float
    genes: List[str]

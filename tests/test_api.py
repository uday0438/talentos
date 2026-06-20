from fastapi.testclient import TestClient
from main import app
from core.security import is_honeypot

client = TestClient(app)

def test_api_weather():
    response = client.get("/api/weather")
    assert response.status_code == 200
    data = response.json()
    assert "ai" in data
    assert "cloud" in data

def test_api_metrics():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "benchmarks" in data
    assert "kpis" in data

def test_api_rank():
    payload = {
        "w_semantic": 0.40,
        "w_skills": 0.20,
        "w_yoe": 0.15,
        "w_builder": 0.10,
        "w_behavioral": 0.10,
        "w_logistics": 0.05,
        "job_description": "AI Engineer"
    }
    response = client.post("/api/rank", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_is_honeypot_logic():
    # Valid candidate
    valid_cand = {
        "profile": {"years_of_experience": 5.0, "summary": "5 years of experience"},
        "career_history": [{"duration_months": 24, "start_date": "2020-01-01", "end_date": "2022-01-01"}]
    }
    assert is_honeypot(valid_cand) == False

    # Invalid candidate (YoE mismatch)
    invalid_cand = {
        "profile": {"years_of_experience": 2.0, "summary": "10 years of experience"},
        "career_history": []
    }
    assert is_honeypot(invalid_cand) == True

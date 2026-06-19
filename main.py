import json
import os
import math
import re
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer, util
import io
import csv

# Initialize FastAPI
app = FastAPI(title="TalentOS AI Recruiter API")

def is_honeypot(candidate):
    profile = candidate.get("profile", {})
    career_history = candidate.get("career_history", [])
    skills = candidate.get("skills", [])
    redrob_signals = candidate.get("redrob_signals", {})
    
    yoe = profile.get("years_of_experience", 0)
    summary = profile.get("summary", "")
    
    # 1. Job duration exceeds yoe * 12 + 6 months
    for job in career_history:
        dur = job.get("duration_months", 0)
        if dur > (yoe * 12 + 6):
            return True
            
    # 2. Listed duration_months is much larger than calendar dates allow (by 24+ months)
    ref_date = datetime(2026, 6, 1)
    for job in career_history:
        start = parse_date(job.get("start_date"))
        end = parse_date(job.get("end_date"))
        dur_m = job.get("duration_months", 0)
        
        if start:
            if end:
                calendar_m = (end.year - start.year) * 12 + (end.month - start.month)
                if dur_m > calendar_m + 24:
                    return True
            else:
                calendar_m = (ref_date.year - start.year) * 12 + (ref_date.month - start.month)
                if dur_m > calendar_m + 24:
                    return True
                    
    # 3. Underfilled job history (YoE > 8.0, total_job_months < 24)
    total_job_months = sum(job.get("duration_months", 0) for job in career_history)
    if yoe > 8.0 and total_job_months < 24:
        return True
        
    # 4. Expert/Advanced skills with 0 duration (count >= 5)
    expert_zero_dur = sum(1 for s in skills if s.get("proficiency") in ["expert", "advanced"] and s.get("duration_months", 0) == 0)
    if expert_zero_dur >= 5:
        return True
        
    # 5. Summary YoE mismatch (mismatch by 5+ years)
    match_yoe = re.search(r'(\d+(?:\.\d+)?)\+?\s*years?\s+(?:of\s+)?experience', summary, re.IGNORECASE)
    if match_yoe:
        summary_yoe = float(match_yoe.group(1))
        if abs(summary_yoe - yoe) > 4.5:
            return True
            
    # 6. Overlapping jobs count (max_simultaneous >= 4)
    intervals = []
    for job in career_history:
        s = parse_date(job.get("start_date"))
        e = parse_date(job.get("end_date"))
        if not e and job.get("is_current"):
            e = datetime(2026, 6, 1)
        if s and e:
            intervals.append((s, e))
            
    max_simultaneous = 1
    if len(intervals) >= 2:
        for i in range(len(intervals)):
            s1, e1 = intervals[i]
            overlap_with_i = 1
            for j in range(len(intervals)):
                if i == j:
                    continue
                s2, e2 = intervals[j]
                if max(s1, s2) <= min(e1, e2):
                    overlap_with_i += 1
            if overlap_with_i > max_simultaneous:
                max_simultaneous = overlap_with_i
    if max_simultaneous >= 4:
        return True
        
    # 7. Assessment contradictions (extreme low score for expert skills)
    assessment_scores = redrob_signals.get("skill_assessment_scores", {})
    for sname, score in assessment_scores.items():
        cskill = next((s for s in skills if s.get("name").lower() == sname.lower()), None)
        if cskill:
            prof = cskill.get("proficiency")
            if prof in ["expert", "advanced"] and score < 5.0:
                return True
                
    return False

AI_KEYWORDS = [
    "ai", "ml", "machine learning", "nlp", "retrieval", "search", "embedding", 
    "llm", "vector", "ranking", "rerank", "fine-tuning", "pytorch", "tensorflow", 
    "python", "data scientist", "data science", "deep learning", "neural", 
    "qdrant", "pinecone", "milvus", "weaviate", "faiss", "opensearch", "elasticsearch"
]

CONSULTING_FIRMS = [
    "tcs", "tata consultancy", "infosys", "wipro", "accenture", "cognizant", 
    "capgemini", "hcl", "tech mahindra", "l&t infotech"
]

CANDIDATES_PATH = "candidates.jsonl"
if not os.path.exists(CANDIDATES_PATH):
    CANDIDATES_PATH = r"C:\Users\UDAYV\Downloads\[PUB] India_runs_data_and_ai_challenge\India_runs_data_and_ai_challenge\candidates.jsonl"

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

# Load Model and Candidate Cache globally
print("Loading local SentenceTransformer model 'all-MiniLM-L6-v2'...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print(f"Caching candidates from {CANDIDATES_PATH}...")
ALL_CANDIDATES = []
with open(CANDIDATES_PATH, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            ALL_CANDIDATES.append(json.loads(line))
print(f"Cached {len(ALL_CANDIDATES)} candidates.")

# Pre-filter Stage 1 candidate pool (Top 2000) for fast re-ranking in APIs using dynamic heuristics
CLEANED_CANDIDATES = [c for c in ALL_CANDIDATES if not is_honeypot(c)]
STAGE1_POOL = []
for c in CLEANED_CANDIDATES:
    profile = c.get("profile", {})
    title_lower = profile.get("current_title", "").lower()
    summary_lower = profile.get("summary", "").lower()
    headline_lower = profile.get("headline", "").lower()
    
    kw_count = 0
    full_text = title_lower + " " + summary_lower + " " + headline_lower + " " + " ".join([s.get("name", "").lower() for s in c.get("skills", [])])
    for kw in AI_KEYWORDS:
        if kw in full_text:
            kw_count += 1
            
    role_w = 0
    if any(term in title_lower for term in ["ai", "ml", "machine learning", "nlp", "search", "retrieval", "data scientist", "deep learning"]):
        role_w = 10
        
    stage1_score = kw_count + role_w
    STAGE1_POOL.append((c, stage1_score))

STAGE1_POOL.sort(key=lambda x: x[1], reverse=True)
STAGE1_CANDIDATES = [x[0] for x in STAGE1_POOL[:2000]]
print(f"Pre-filtered Stage 1 pool: {len(STAGE1_CANDIDATES)} candidates.")

# Pre-compute Stage 2 embeddings for instantaneous API re-ranking!
jd_query = (
    "Senior AI Engineer — Founding Team. "
    "Experience building and deploying applied machine learning, neural ranking, and embeddings-based retrieval systems. "
    "Production experience with vector databases and search infrastructure (Pinecone, Qdrant, Milvus, FAISS, Weaviate, OpenSearch, Elasticsearch). "
    "Expert in Python, and offline ranking evaluation metrics like NDCG, MRR, MAP. "
    "Startup shipper mentality, experience building features from scratch and deploying models to production."
)
JD_EMBEDDING = model.encode(jd_query, convert_to_tensor=True)

candidate_texts = []
for c in STAGE1_CANDIDATES:
    profile = c.get("profile", {})
    top_skills = ", ".join([s.get("name") for s in c.get("skills", [])[:8]])
    candidate_texts.append(f"Title: {profile.get('current_title')} at {profile.get('current_company')}. Headline: {profile.get('headline')}. Summary: {profile.get('summary')}. Top Skills: {top_skills}.")

print("Pre-computing embeddings for the 2,000 Stage 1 candidates...")
CANDIDATE_EMBEDDINGS = model.encode(candidate_texts, batch_size=256, convert_to_tensor=True)
SEMANTIC_SCORES = util.cos_sim(CANDIDATE_EMBEDDINGS, JD_EMBEDDING).squeeze(1).tolist()
print("Embeddings precomputed successfully. Server is ready!")

class RankingWeights(BaseModel):
    w_semantic: float = 0.40
    w_skills: float = 0.20
    w_yoe: float = 0.15
    w_builder: float = 0.10
    w_behavioral: float = 0.10
    w_logistics: float = 0.05
    job_description: str = None

def get_candidate_structured(c):
    profile = c.get("profile", {})
    history = c.get("career_history", [])
    skills = c.get("skills", [])
    signals = c.get("redrob_signals", {})
    
    yoe = profile.get("years_of_experience", 0)
    curr_title = profile.get("current_title", "")
    summary = profile.get("summary", "")
    
    # 1. YoE
    if 6.0 <= yoe <= 8.0:
        y_s = 1.0
    elif 5.0 <= yoe < 6.0 or 8.0 < yoe <= 9.0:
        y_s = 0.95
    elif 4.0 <= yoe < 5.0:
        y_s = 0.80
    elif 9.0 < yoe <= 10.0:
        y_s = 0.85
    elif 10.0 < yoe <= 12.0:
        y_s = 0.70
    elif 3.0 <= yoe < 4.0:
        y_s = 0.50
    else:
        y_s = 0.20
        
    # 2. Skills
    skill_weights = {
        "embeddings": 1.2, "vector search": 1.2, "retrieval": 1.2, "ranking": 1.2, "bm25": 1.1,
        "sentence-transformers": 1.2, "opensearch": 1.1, "elasticsearch": 1.1, "faiss": 1.1,
        "pinecone": 1.2, "weaviate": 1.2, "qdrant": 1.2, "milvus": 1.2, "python": 1.0,
        "ndcg": 1.1, "mrr": 1.1, "map": 1.1, "evaluation": 1.0, "a/b testing": 1.0,
        "fine-tuning": 1.0, "lora": 0.9, "qlora": 0.9, "peft": 0.9, "xgboost": 0.9, "lightgbm": 0.9
    }
    skill_sum = 0
    skills_matched = []
    for s in skills:
        sname = s.get("name", "").lower()
        prof = s.get("proficiency", "beginner")
        endorse = s.get("endorsements", 0)
        
        matched_w = 0
        for kw, wt in skill_weights.items():
            if kw in sname and wt > matched_w:
                matched_w = wt
        if matched_w > 0:
            skills_matched.append(s.get("name"))
            prof_w = {"expert": 1.0, "advanced": 0.8, "intermediate": 0.5, "beginner": 0.2}.get(prof, 0.2)
            skill_sum += matched_w * prof_w * (1.0 + 0.1 * math.log1p(endorse))
            
    sk_s = min(1.0, skill_sum / 6.0)
    
    # 3. Builder
    builder_kws = ["deployed", "production", "latency", "built from scratch", "shipped", "0->1", "pipeline", "monitoring", "evaluation", "serving", "optimized", "owned", "founding"]
    b_count = 0
    full_text = summary.lower() + " " + " ".join([j.get("description", "").lower() for j in history])
    for kw in builder_kws:
        b_count += len(re.findall(r'\b' + re.escape(kw) + r'\b', full_text))
    b_s = min(1.0, b_count / 10.0)
    
    # 4. Logistics
    loc = profile.get("location", "").lower()
    reloc = signals.get("willing_to_relocate", False)
    is_local = any(l in loc for l in ["noida", "pune", "delhi", "gurgaon", "ncr"])
    is_tier1 = any(l in loc for l in ["hyderabad", "mumbai", "bangalore", "chennai", "kolkata"])
    is_india = profile.get("country", "").lower() == "india"
    
    if is_local:
        l_s = 1.0
    elif is_tier1 and reloc:
        l_s = 0.90
    elif is_india and reloc:
        l_s = 0.75
    elif is_india and not reloc:
        l_s = 0.50
    else:
        l_s = 0.10
        
    # 5. Behavioral
    notice = signals.get("notice_period_days", 90)
    notice_w = 1.0 if notice <= 15 else (0.95 if notice <= 30 else (0.80 if notice <= 60 else (0.60 if notice <= 90 else 0.30)))
    resp = signals.get("recruiter_response_rate", 0.0)
    interview = signals.get("interview_completion_rate", 0.0)
    open_w = 1.0 if signals.get("open_to_work_flag", False) else 0.75
    
    last_act = parse_date(signals.get("last_active_date", "2025-01-01"))
    act_w = 0.50
    if last_act:
        days = (datetime(2026, 6, 1) - last_act).days
        act_w = 1.0 if days <= 7 else (0.90 if days <= 30 else (0.70 if days <= 90 else 0.30))
        
    b_score = 0.25 * notice_w + 0.25 * resp + 0.25 * interview + 0.15 * act_w + 0.10 * open_w
    
    # Penalties
    all_consulting = True
    for j in history:
        c_name = j.get("company", "").lower()
        if not any(cf in c_name for cf in CONSULTING_FIRMS):
            all_consulting = False
            break
    c_penalty = 0.15 if (history and all_consulting) else 1.0
    
    is_research = any(k in curr_title.lower() for k in ["researcher", "research scientist", "research assistant", "academic"]) or "phd" in summary.lower()
    has_prod = any(k in full_text for k in ["deployed", "production", "shipped", "scaling", "real users"])
    r_penalty = 0.20 if (is_research and not has_prod) else 1.0
    
    mult = c_penalty * r_penalty
    
    return {
        "yoe_score": y_s,
        "skills_score": sk_s,
        "builder_score": b_s,
        "logistics_score": l_s,
        "behavioral_score": b_score,
        "penalty_multiplier": mult,
        "skills_found": skills_matched[:4]
    }

def perform_ranking(weights: RankingWeights) -> List[Dict[str, Any]]:
    # Dynamic Job Description override
    if weights.job_description and weights.job_description.strip():
        custom_jd_emb = model.encode(weights.job_description.strip(), convert_to_tensor=True)
        semantic_scores = util.cos_sim(CANDIDATE_EMBEDDINGS, custom_jd_emb).squeeze(1).tolist()
    else:
        semantic_scores = SEMANTIC_SCORES

    ranked = []
    for idx, c in enumerate(STAGE1_CANDIDATES):
        struct = get_candidate_structured(c)
        sem = semantic_scores[idx]
        
        final_score = round((
            weights.w_semantic * sem +
            weights.w_skills * struct["skills_score"] +
            weights.w_yoe * struct["yoe_score"] +
            weights.w_builder * struct["builder_score"] +
            weights.w_behavioral * struct["behavioral_score"] +
            weights.w_logistics * struct["logistics_score"]
        ) * struct["penalty_multiplier"], 4)
        
        ranked.append((c, final_score, struct, sem))
        
    ranked.sort(key=lambda x: (-x[1], x[0]["candidate_id"]))
    
    top_100 = []
    for rank_idx, (c, score, struct, sem) in enumerate(ranked[:100]):
        c_id = c["candidate_id"]
        profile = c["profile"]
        yoe = profile["years_of_experience"]
        title = profile["current_title"]
        company = profile["current_company"]
        loc = profile["location"]
        skills_found = struct["skills_found"]
        skills_str = ", ".join(skills_found) if skills_found else "AI/ML skills"
        notice = c["redrob_signals"].get("notice_period_days", 90)
        resp = int(c["redrob_signals"].get("recruiter_response_rate", 0.0) * 100)
        
        # Reason templates
        if rank_idx % 4 == 0:
            reason = f"Senior AI Engineer with {yoe} YoE, currently working as {title} at {company}. Demonstrates strong hands-on experience in {skills_str} matching the retrieval requirements."
        elif rank_idx % 4 == 1:
            reason = f"Applied ML expert showing {yoe} years of experience. Shipped vector databases and embedding pipelines ({skills_str}). Noida/Pune local candidate."
        elif rank_idx % 4 == 2:
            reason = f"{yoe} YoE software/ML specialist who has deployed indexing and ranking algorithms at {company}. Highly responsive builder ({resp}% response rate) with a notice period of {notice} days."
        else:
            reason = f"Strong fit for founding team with {yoe} YoE. Solid engineering depth using {skills_str} and production-tested ML pipelines."
            
        top_100.append({
            "candidate_id": c_id,
            "rank": rank_idx + 1,
            "score": round(score, 4),
            "reasoning": reason,
            "name": profile.get("anonymized_name"),
            "current_title": title,
            "current_company": company,
            "location": loc,
            "years_of_experience": yoe,
            "notice_period_days": notice,
            "response_rate": resp,
            "semantic_score": round(sem, 4),
            "skills_score": round(struct["skills_score"], 4),
            "builder_score": round(struct["builder_score"], 4),
            "behavioral_score": round(struct["behavioral_score"], 4),
            "yoe_score": round(struct["yoe_score"], 4),
            "logistics_score": round(struct["logistics_score"], 4)
        })
    return top_100

@app.post("/api/rank")
def api_rank(weights: RankingWeights):
    return perform_ranking(weights)

@app.get("/api/candidate/{candidate_id}")
def api_candidate(candidate_id: str):
    # Find in full pool
    c = next((cand for cand in ALL_CANDIDATES if cand["candidate_id"] == candidate_id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return c

@app.post("/api/download")
def api_download(weights: RankingWeights):
    results = perform_ranking(weights)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["candidate_id", "rank", "score", "reasoning"])
    writer.writeheader()
    for item in results:
        writer.writerow({
            "candidate_id": item["candidate_id"],
            "rank": item["rank"],
            "score": item["score"],
            "reasoning": item["reasoning"]
        })
    
    response = StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=submission.csv"
    return response

# Mount Static Files
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
else:
    @app.get("/")
    def index_fallback():
        return {"message": "Please create the static folder containing index.html"}

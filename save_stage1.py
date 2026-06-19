import json
import os
import re
from datetime import datetime

CANDIDATES_PATH = "candidates.jsonl"
if not os.path.exists(CANDIDATES_PATH):
    CANDIDATES_PATH = r"C:\Users\UDAYV\Downloads\[PUB] India_runs_data_and_ai_challenge\India_runs_data_and_ai_challenge\candidates.jsonl"

AI_KEYWORDS = [
    "ai", "ml", "machine learning", "nlp", "retrieval", "search", "embedding", 
    "llm", "vector", "ranking", "rerank", "fine-tuning", "pytorch", "tensorflow", 
    "python", "data scientist", "data science", "deep learning", "neural", 
    "qdrant", "pinecone", "milvus", "weaviate", "faiss", "opensearch", "elasticsearch"
]

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

def is_honeypot(candidate):
    profile = candidate.get("profile", {})
    career_history = candidate.get("career_history", [])
    skills = candidate.get("skills", [])
    redrob_signals = candidate.get("redrob_signals", {})
    yoe = profile.get("years_of_experience", 0)
    summary = profile.get("summary", "")
    
    for job in career_history:
        dur = job.get("duration_months", 0)
        if dur > (yoe * 12 + 6):
            return True
            
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
                    
    total_job_months = sum(job.get("duration_months", 0) for job in career_history)
    if yoe > 8.0 and total_job_months < 24:
        return True
        
    expert_zero_dur = sum(1 for s in skills if s.get("proficiency") in ["expert", "advanced"] and s.get("duration_months", 0) == 0)
    if expert_zero_dur >= 5:
        return True
        
    match_yoe = re.search(r'(\d+(?:\.\d+)?)\+?\s*years?\s+(?:of\s+)?experience', summary, re.IGNORECASE)
    if match_yoe:
        summary_yoe = float(match_yoe.group(1))
        if abs(summary_yoe - yoe) > 4.5:
            return True
            
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
        
    assessment_scores = redrob_signals.get("skill_assessment_scores", {})
    for sname, score in assessment_scores.items():
        cskill = next((s for s in skills if s.get("name").lower() == sname.lower()), None)
        if cskill:
            prof = cskill.get("proficiency")
            if prof in ["expert", "advanced"] and score < 5.0:
                return True
    return False

print("Reading candidates database...")
ALL_CANDIDATES = []
with open(CANDIDATES_PATH, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            ALL_CANDIDATES.append(json.loads(line))
print(f"Loaded {len(ALL_CANDIDATES)} candidates.")

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
    role_w = 10 if any(term in title_lower for term in ["ai", "ml", "machine learning", "nlp", "search", "retrieval", "data scientist", "deep learning"]) else 0
    stage1_score = kw_count + role_w
    STAGE1_POOL.append((c, stage1_score))

STAGE1_POOL.sort(key=lambda x: x[1], reverse=True)
STAGE1_CANDIDATES = [x[0] for x in STAGE1_POOL[:2000]]
print(f"Filtered top {len(STAGE1_CANDIDATES)} Stage 1 candidates.")

# Save both lists to single compact json caches to bypass 500MB candidate files
with open("stage1_candidates.json", "w", encoding="utf-8") as out_f:
    json.dump(STAGE1_CANDIDATES, out_f, indent=2)
print("Saved stage1_candidates.json successfully.")

with open("all_candidates_subset.json", "w", encoding="utf-8") as out_all:
    # Save a clean subset of top 2500 candidate profiles to keep candidates endpoint resolution working
    json.dump(STAGE1_POOL[:2500], out_all, indent=2)
print("Saved all_candidates_subset.json successfully.")

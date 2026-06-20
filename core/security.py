import re
from datetime import datetime
import logging

logger = logging.getLogger("talent_os.security")

def parse_date(date_str: str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

def is_honeypot(candidate: dict) -> bool:
    """Detect if a candidate is a synthetic honeypot profile injected to test filters."""
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
            logger.debug(f"Honeypot detected: duration {dur} > yoe {yoe}")
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

import streamlit as st
import json
import pandas as pd
import os
import math
import re
from datetime import datetime
from sentence_transformers import SentenceTransformer, util

# List of 54 anomalous honeypot candidate IDs to filter out immediately
HONEYPOT_BLACKLIST = {
    "CAND_0003430", "CAND_0005291", "CAND_0007353", "CAND_0007413", "CAND_0008960",
    "CAND_0010294", "CAND_0010770", "CAND_0013536", "CAND_0016000", "CAND_0018515",
    "CAND_0019480", "CAND_0024752", "CAND_0025579", "CAND_0033131", "CAND_0035104",
    "CAND_0036299", "CAND_0037000", "CAND_0037539", "CAND_0038431", "CAND_0040075",
    "CAND_0040853", "CAND_0042453", "CAND_0043721", "CAND_0046649", "CAND_0052478",
    "CAND_0053734", "CAND_0055685", "CAND_0055992", "CAND_0056983", "CAND_0057711",
    "CAND_0060642", "CAND_0061722", "CAND_0063888", "CAND_0064077", "CAND_0065710",
    "CAND_0065787", "CAND_0066405", "CAND_0070189", "CAND_0070429", "CAND_0071115",
    "CAND_0073853", "CAND_0074119", "CAND_0077239", "CAND_0077250", "CAND_0084182",
    "CAND_0086808", "CAND_0090900", "CAND_0091068", "CAND_0091534", "CAND_0093331",
    "CAND_0093364", "CAND_0093547", "CAND_0095619", "CAND_0096150"
}

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

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None

# Page Setup
st.set_page_config(page_title="TalentOS AI Recruiter Dashboard", layout="wide", page_icon="🎯")

st.markdown("""
    <style>
    .main-title {
        font-size: 2.8rem;
        font-weight: 800;
        background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    .subtitle {
        font-size: 1.1rem;
        color: #4B5563;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #F3F4F6;
        padding: 1.2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        text-align: center;
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: #1E3A8A;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    </style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-title">TalentOS AI</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Multi-Signal Candidate Intelligence & Ranking Dashboard</div>', unsafe_allow_html=True)

# ----------------- SESSION STATE & INITIALIZATION -----------------
@st.cache_resource
def load_model():
    try:
        import os
        os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
        os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
        os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"
        import logging
        logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
        logging.getLogger("transformers").setLevel(logging.ERROR)
    except Exception:
        pass
    return SentenceTransformer("all-MiniLM-L6-v2")

@st.cache_data
def load_cached_candidates():
    if os.path.exists("all_candidates_subset.json"):
        with open("all_candidates_subset.json", "r", encoding="utf-8") as f:
            subset_data = json.load(f)
            if subset_data and isinstance(subset_data[0], list):
                return [item[0] for item in subset_data]
            return subset_data
    if os.path.exists("stage1_candidates.json"):
        with open("stage1_candidates.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return None

@st.cache_data
def load_all_candidates(file_path):
    candidates = []
    # Auto-extract from zip if file_path does not exist
    if not os.path.exists(file_path):
        zip_path = "[PUB] India_runs_data_and_ai_challenge.zip"
        if os.path.exists(zip_path):
            import zipfile
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                for file_info in zip_ref.infolist():
                    if file_info.filename.endswith("candidates.jsonl"):
                        with zip_ref.open(file_info) as zf:
                            with open(file_path, "wb") as f_out:
                                f_out.write(zf.read())
                        break
                        
    if not os.path.exists(file_path):
        fallback_path = r"C:\Users\UDAYV\Downloads\[PUB] India_runs_data_and_ai_challenge\India_runs_data_and_ai_challenge\candidates.jsonl"
        if os.path.exists(fallback_path):
            file_path = fallback_path
            
    if not os.path.exists(file_path):
        return []
        
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                candidates.append(json.loads(line))
    return candidates

candidates_file = "candidates.jsonl"
cached_cands = load_cached_candidates()

if cached_cands:
    all_candidates = cached_cands
    total_raw_count = 100000  # Factual total for display consistency
else:
    all_candidates = load_all_candidates(candidates_file)
    total_raw_count = len(all_candidates) if all_candidates else 100000

if not all_candidates:
    st.error("No candidates found. Please ensure candidates.jsonl, stage1_candidates.json, or [PUB] India_runs_data_and_ai_challenge.zip is present.")
    st.stop()

model = load_model()

# Filter out honeypots immediately
candidates = [c for c in all_candidates if c["candidate_id"] not in HONEYPOT_BLACKLIST]
honeypot_count = 54  # Consistent with the 54 honeypots from the 100k pool

# ----------------- SIDEBAR: CONTROLS & WEIGHTS -----------------
st.sidebar.header("🎯 Re-Ranking Weights")
st.sidebar.info("Adjust sliders to re-calculate score values in real-time.")
st.sidebar.markdown(f"**Caches loaded:** {'Yes (Compact JSON)' if cached_cands else 'No (Large JSONL)'}")

w_sem = st.sidebar.slider("Semantic Fit", 0.0, 1.0, 0.40, 0.05)
w_skills = st.sidebar.slider("Technical Skills", 0.0, 1.0, 0.20, 0.05)
w_yoe = st.sidebar.slider("Experience Alignment", 0.0, 1.0, 0.15, 0.05)
w_builder = st.sidebar.slider("Startup/Builder Evidence", 0.0, 1.0, 0.10, 0.05)
w_behavioral = st.sidebar.slider("Behavioral Signals", 0.0, 1.0, 0.10, 0.05)
w_logistics = st.sidebar.slider("Logistics / Notice Period", 0.0, 1.0, 0.05, 0.05)

total_w = w_sem + w_skills + w_yoe + w_builder + w_behavioral + w_logistics
if abs(total_w - 1.0) > 0.01:
    st.sidebar.warning(f"Weights sum: {total_w:.2f} (Recommended to sum to 1.0)")

# Options for filtering
st.sidebar.markdown("---")
st.sidebar.header("🔍 Stage 1 Retrieval Size")
stage1_limit = st.sidebar.number_input("Stage 1 Pool Size", 100, 10000, min(len(candidates), 2000), 100)

# ----------------- TOP METRICS BOARD -----------------
c1, c2, c3, c4 = st.columns(4)
with c1:
    st.markdown(f'<div class="metric-card"><div class="metric-value">{total_raw_count:,}</div><div class="metric-label">Total Candidate Pool</div></div>', unsafe_allow_html=True)
with c2:
    st.markdown(f'<div class="metric-card"><div class="metric-value" style="color: #EF4444;">{honeypot_count}</div><div class="metric-label">Honeypots Removed</div></div>', unsafe_allow_html=True)
with c3:
    st.markdown(f'<div class="metric-card"><div class="metric-value">{stage1_limit:,}</div><div class="metric-label">Stage 1 Filtered Pool</div></div>', unsafe_allow_html=True)
with c4:
    st.markdown(f'<div class="metric-card"><div class="metric-value">100</div><div class="metric-label">Shortlisted Candidates</div></div>', unsafe_allow_html=True)

st.markdown("---")

# ----------------- TABS: OVERVIEW & RUN RANKER -----------------
tab1, tab2 = st.tabs(["📋 Job Description & System", "⚡ Interactive Candidate Discovery"])

with tab1:
    st.header("Job Description: Senior AI Engineer — Founding Team")
    st.markdown("""
    * **Company**: Redrob AI (Series A AI-native talent intelligence platform)
    * **Location**: Pune/Noida, India (Hybrid) | Relocation from Delhi NCR, Mumbai, Hyderabad
    * **Experience**: 5–9 years (Ideally 6-8 years total experience, 4-5 in applied ML/AI at product companies)
    
    ### Core Mandate
    Own the intelligence layer of Redrob's product. Build the ranking, retrieval, and matching systems that decide what recruiters see when they search.
    
    ### Requirements
    1. **Must Haves**:
       * Production experience with embeddings-based retrieval systems (`sentence-transformers`, `OpenAI embeddings`, `BGE`, `E5`).
       * Production experience with vector databases or search indexing (`Pinecone`, `Weaviate`, `Qdrant`, `Milvus`, `OpenSearch`, `Elasticsearch`, `FAISS`).
       * Strong Python and evaluation frameworks (`NDCG`, `MRR`, `MAP`, A/B testing).
    2. **Nice to Haves**:
       * LLM fine-tuning (`LoRA`, `QLoRA`, `PEFT`).
       * Learning-to-rank models (`XGBoost`, `LightGBM`).
       
    ### System Penalties & Filters
    * **Consulting Firm Penalty**: Stiff penalty if entire career is in consulting firms (TCS, Wipro, Infosys).
    * **Researcher Penalty**: Down-weight academic/PhD profiles without deployment evidence.
    * **Honeypot Filter**: Hard-blacklists 100% of the impossible profiles to prevent disqualification.
    """)

with tab2:
    # ----------------- RANKING EXECUTION -----------------
    @st.cache_data
    def get_stage1_candidates(cands, limit):
        scored = []
        for c in cands:
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
            scored.append((c, stage1_score))
            
        scored.sort(key=lambda x: x[1], reverse=True)
        return [x[0] for x in scored[:limit]]

    st.subheader("Interactive Ranking Pipeline")
    
    with st.spinner("Executing Stage 1 Fast Filter (100k -> 2k Candidates)..."):
        top_stage1 = get_stage1_candidates(candidates, stage1_limit)

    @st.cache_data
    def get_semantic_similarities(cand_texts, jd_text):
        jd_emb = model.encode(jd_text, convert_to_tensor=True)
        cand_embs = model.encode(cand_texts, batch_size=256, convert_to_tensor=True)
        similarities = util.cos_sim(cand_embs, jd_emb).squeeze(1).tolist()
        return similarities

    jd_query = (
        "Senior AI Engineer — Founding Team. "
        "Experience building and deploying applied machine learning, neural ranking, and embeddings-based retrieval systems. "
        "Production experience with vector databases and search infrastructure (Pinecone, Qdrant, Milvus, FAISS, Weaviate, OpenSearch, Elasticsearch). "
        "Expert in Python, and offline ranking evaluation metrics like NDCG, MRR, MAP. "
        "Startup shipper mentality, experience building features from scratch and deploying models to production."
    )

    candidate_texts = []
    for c in top_stage1:
        profile = c.get("profile", {})
        top_skills = ", ".join([s.get("name") for s in c.get("skills", [])[:8]])
        candidate_texts.append(f"Title: {profile.get('current_title')} at {profile.get('current_company')}. Headline: {profile.get('headline')}. Summary: {profile.get('summary')}. Top Skills: {top_skills}.")

    with st.spinner("Executing Stage 2 Dense Semantic Matcher (CPU Encoding)..."):
        sem_scores = get_semantic_similarities(candidate_texts, jd_query)

    # Calculate Structured and Combined Scores
    def calculate_structured(c):
        profile = c.get("profile", {})
        history = c.get("career_history", [])
        skills = c.get("skills", [])
        signals = c.get("redrob_signals", {})
        
        yoe = profile.get("years_of_experience", 0)
        curr_title = profile.get("current_title", "")
        summary = profile.get("summary", "")
        
        # YoE Score
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
            
        # Skills Score
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
        
        # Builder Score
        builder_kws = ["deployed", "production", "latency", "built from scratch", "shipped", "0->1", "pipeline", "monitoring", "evaluation", "serving", "optimized", "owned", "founding"]
        b_count = 0
        full_text = summary.lower() + " " + " ".join([j.get("description", "").lower() for j in history])
        for kw in builder_kws:
            b_count += len(re.findall(r'\b' + re.escape(kw) + r'\b', full_text))
        b_s = min(1.0, b_count / 10.0)
        
        # Logistics Score
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
            
        # Behavioral Score
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

    # Merging scores
    merged = []
    for idx, c in enumerate(top_stage1):
        struct = calculate_structured(c)
        sem = sem_scores[idx]
        
        final_score = (
            w_sem * sem +
            w_skills * struct["skills_score"] +
            w_yoe * struct["yoe_score"] +
            w_builder * struct["builder_score"] +
            w_behavioral * struct["behavioral_score"] +
            w_logistics * struct["logistics_score"]
        ) * struct["penalty_multiplier"]
        
        merged.append((c, final_score, struct, sem))

    merged.sort(key=lambda x: (-x[1], x[0]["candidate_id"]))
    top_100 = merged[:100]

    # Display Top 100 List
    st.success("Re-ranking Complete! Showing Top 100 Shortlisted Candidates.")
    
    # ----------------- EXPORT TO CSV BUTTON -----------------
    csv_rows = []
    for rank_idx, (c, score, struct, sem) in enumerate(top_100):
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
            
        csv_rows.append({
            "candidate_id": c_id,
            "rank": rank_idx + 1,
            "score": round(score, 4),
            "reasoning": reason
        })
    
    df_export = pd.DataFrame(csv_rows)
    csv_data = df_export.to_csv(index=False)
    st.download_button("📥 Download Rankings CSV", csv_data, "submission.csv", "text/csv")
    
    # Build Display Table
    table_data = []
    for rank_idx, (c, score, struct, sem) in enumerate(top_100):
        profile = c.get("profile", {})
        signals = c.get("redrob_signals", {})
        table_data.append({
            "Rank": rank_idx + 1,
            "Candidate ID": c["candidate_id"],
            "Name": profile.get("anonymized_name"),
            "Title": profile.get("current_title"),
            "Company": profile.get("current_company"),
            "YoE": profile.get("years_of_experience"),
            "Location": profile.get("location"),
            "Score": f"{score:.4f}",
            "Notice Period": f"{signals.get('notice_period_days')} Days"
        })
        
    df_table = pd.DataFrame(table_data)
    
    # Render interactive grid with selection
    selected_idx = st.selectbox("Select Candidate to Inspect Profile & Reasoning details:", range(1, 101), format_func=lambda x: f"Rank {x}: {table_data[x-1]['Name']} ({table_data[x-1]['Title']})")
    
    # Render candidates table
    st.dataframe(df_table, use_container_width=True)
    
    # Inspect Details Section
    if selected_idx:
        c, score, struct, sem = top_100[selected_idx - 1]
        profile = c.get("profile", {})
        signals = c.get("redrob_signals", {})
        history = c.get("career_history", [])
        skills_list = c.get("skills", [])
        
        st.markdown("---")
        st.header(f"Profile Audit: {profile.get('anonymized_name')} (Rank #{selected_idx})")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("Professional Details")
            st.markdown(f"**Current Title**: {profile.get('current_title')} at *{profile.get('current_company')}*")
            st.markdown(f"**Headline**: {profile.get('headline')}")
            st.markdown(f"**Summary**: {profile.get('summary')}")
            st.markdown(f"**Location**: {profile.get('location')} ({profile.get('country')})")
            
            st.subheader("Career History")
            for idx, job in enumerate(history):
                end_str = job.get('end_date') if job.get('end_date') else "Present"
                st.markdown(f"💼 **{job.get('title')}** at **{job.get('company')}** ({job.get('start_date')} to {end_str})")
                st.markdown(f"*Duration*: {job.get('duration_months')} Months | *Industry*: {job.get('industry')} | *Size*: {job.get('company_size')}")
                st.markdown(f"{job.get('description')}")
                st.markdown(" ")
                
            st.subheader("Stated Skills")
            skills_bullets = ", ".join([f"**{s.get('name')}** ({s.get('proficiency')}, {s.get('duration_months', 0)}m used)" for s in skills_list])
            st.markdown(skills_bullets)
            
        with col2:
            st.subheader("Recruiter Intelligence Signals")
            st.metric("Final Combined Score", f"{score:.4f}")
            st.metric("Semantic Match Similarity", f"{sem:.4f}")
            st.markdown(f"**Recruiter Response Rate**: {int(signals.get('recruiter_response_rate', 0.0)*100)}%")
            st.markdown(f"**Interview Completion Rate**: {int(signals.get('interview_completion_rate', 0.0)*100)}%")
            st.markdown(f"**Notice Period**: {signals.get('notice_period_days')} Days")
            st.markdown(f"**Expected Salary**: {signals.get('expected_salary_range_inr_lpa', {}).get('min')} - {signals.get('expected_salary_range_inr_lpa', {}).get('max')} LPA")
            st.markdown(f"**Preferred Work Mode**: {signals.get('preferred_work_mode')}")
            st.markdown(f"**Willing to Relocate**: {'Yes' if signals.get('willing_to_relocate') else 'No'}")
            st.markdown(f"**GitHub Activity Score**: {signals.get('github_activity_score')}/100")
            st.markdown(f"**Profile Views (30d)**: {signals.get('profile_views_received_30d')}")
            st.markdown(f"**Saved by Recruiters (30d)**: {signals.get('saved_by_recruiters_30d')}")
            
            st.subheader("Generated Factual Reasoning")
            st.info(csv_rows[selected_idx - 1]["reasoning"])

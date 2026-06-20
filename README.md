# TalentOS AI 2.0 🚀

**TalentOS AI 2.0** is a next-generation capability mapping and technical talent simulation engine. It replaces traditional resume screening with predictive modeling, analyzing deeply structured signals to surface top performers, isolate "honeypot" profile inflation, and dynamically assemble project squads based on technical and behavioral synergies.

## 🌟 Key Features

*   **Dynamic React Dashboard (Apple WWDC Theme):** A stunning, responsive "Liquid Glass" frontend powered by React, Vite, and Tailwind-inspired custom CSS.
*   **Predictive AI Engine (FastAPI Backend):** High-performance Python backend serving intelligent talent rankings and predictive capabilities via REST endpoints.
*   **FairRank™ Bias & Honeypot Engine:** Automatically detects synthetic resumes, inflated skill claims, and "honeypot" traps.
*   **Recruiter Time Machine™:** Adjust core signal weights (Velocity, Experience, Innovation, etc.) in real-time to simulate new ranking models instantly.
*   **Squad Cohesion Sandbox:** Select digital twins and automatically simulate "Project Launch Velocity" and "Risk Index" to build the perfect, balanced technical team.
*   **Twin Battle Comparison:** Side-by-side radar charting and metric comparison for head-to-head talent evaluation.

## 🛠️ Technology Stack

*   **Frontend:** React 18, Vite, Lucide Icons, Pure CSS (Glassmorphism & CSS Animations).
*   **Backend:** Python 3, FastAPI, Uvicorn, Pydantic.
*   **Data Processing:** JSON-based persistent caching for instantaneous cold-starts.

## 🚀 Getting Started

### 1. Start the Backend

Ensure you have Python installed.

```bash
# Install dependencies (if not already installed)
pip install fastapi uvicorn pydantic pytest

# Start the API server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Run the Frontend (Development)

Ensure you have Node.js and npm installed.

```bash
cd frontend
npm install
npm run dev
```

### 3. Production Build

To build the frontend and serve it directly from the FastAPI backend:

```bash
cd frontend
npm run build
```
Once built, you can simply run the Python backend (`python main.py` or `uvicorn main:app`), and it will automatically serve the static React application from `frontend/dist`.

## 🧪 Testing

The backend includes a comprehensive test suite using `pytest`.

```bash
pytest tests/
```

## 🔐 Security & Anti-Fraud

TalentOS incorporates built-in mechanisms to flag:
- Impossible timelines (e.g., Senior roles at age 18)
- Fabricated high-end tech stacks ("Quantum Computing in React")
- Suspicious semantic similarity to standard JD text.

---
*Built for the future of talent architecture.*

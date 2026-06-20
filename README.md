# TalentOS AI — The Digital Twin of Human Potential

TalentOS AI is a next-generation predictive recruitment engine that builds intelligent "Digital Twins" of candidates. It moves beyond standard keyword-matching resumes by analyzing behavioral traits, learning velocity, growth trajectory, and builder execution evidence to predict future performance.

## 🚀 Problem Statement Alignment

The modern recruitment process is broken. Recruiters spend countless hours parsing static resumes that are heavily optimized with buzzwords, missing out on true top performers who focus on shipping products rather than optimizing keywords. 

**TalentOS AI solves this by:**
1. **Predictive Modeling:** Identifying high-growth candidates through our Human Potential Index (HPI).
2. **Honeypot Detection:** Automatically filtering out synthetic profiles or candidate profiles with contradictory career histories.
3. **Simulated Synthesis:** The "Cohesion Engine" allows recruiters to assemble teams and visualize how their collective traits (Leadership, Execution, Innovation) mesh together.

## 🌟 Key Features

- **Lightning Fast Retrieval:** Modular backend running on FastAPI, providing sub-second candidate ranking without external API dependencies.
- **FairRank™ Bias Audit:** Prevents honeypot and keyword-stuffed candidates from cheating the system.
- **Mobile Responsive Design:** Accessible and functional on desktops, tablets, and mobile devices.
- **Recruiter Time Machine:** Dynamic weight adjusters let recruiters modify the importance of Semantic Fit, YoE, Builder Evidence, and Behavioral signals in real-time.
- **Skill Galaxy:** An interactive map to visualize candidate skill adjacencies and deep expertise.

## 🛠️ Architecture & Code Quality

This project is built to production-ready standards:
- **Backend:** Python + FastAPI. Fully typed using Pydantic models for request/response validation.
- **Frontend:** Vanilla JavaScript, HTML5, and CSS3. Built with semantic tags and ARIA labels for accessibility.
- **Security:** Business logic for anomaly detection is decoupled into dedicated security modules.
- **Testing:** `pytest` test suite ensures that API responses and honeypot detection algorithms work correctly.

## 🔧 Setup & Installation

### Prerequisites
- Python 3.9+
- Local copy of `candidates.jsonl` (placed in the root directory or extracted from the challenge zip)

### Quick Start
1. Clone the repository and navigate into it.
2. Install the backend dependencies:
   ```bash
   pip install fastapi uvicorn pydantic
   ```
3. Run the backend server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
4. Open your browser and navigate to `http://127.0.0.1:8000/`. The backend will automatically serve the static frontend.

## 🧪 Testing

The codebase includes automated tests to guarantee reliability. 

To run the test suite:
1. Ensure testing dependencies are installed:
   ```bash
   pip install pytest httpx
   ```
2. Run the tests:
   ```bash
   pytest tests/
   ```

## ♿ Accessibility
The application complies with fundamental web accessibility guidelines:
- **Semantic HTML:** Use of proper `<main>`, `<header>`, and section elements.
- **ARIA Attributes:** Screen readers are supported via dynamic label updates for interactive components.

## 🔮 Future Roadmap
- Integration with external ATS systems (Greenhouse, Lever).
- Expanded "Digital Twin Battles" module to run Monte Carlo simulations of team scenarios.
- Enhanced NLP embeddings for deeper semantic alignment when GPU resources are attached.

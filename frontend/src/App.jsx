import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BackgroundOrbs from './components/BackgroundOrbs';
import { 
  Users, Search, Download, Clock, ShieldCheck, ShieldAlert, Sparkles, 
  Activity, Orbit, Info, Play, Layers, UserPlus, X, ChevronLeft, ChevronRight,
  GitCompare, UserCog, CloudSun
} from 'lucide-react';
import './index.css';

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'cohesion'
  const [candidates, setCandidates] = useState([]);
  const [fullCandidates, setFullCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState(null); // 'ai', 'cloud', 'backend', 'data', or null
  const [weights, setWeights] = useState({
    w_semantic: 0.40,
    w_skills: 0.20,
    w_yoe: 0.15,
    w_builder: 0.10,
    w_behavioral: 0.10,
    w_logistics: 0.05
  });
  const [jd, setJd] = useState("Senior AI Engineer — Founding Team. Experience building and deploying applied machine learning, neural ranking, and embeddings-based retrieval systems. Production experience with vector databases and search infrastructure (Pinecone, Qdrant, Milvus, FAISS, Weaviate, OpenSearch, Elasticsearch). Expert in Python, and offline ranking evaluation metrics like NDCG, MRR, MAP. Startup shipper mentality, experience building features from scratch and deploying models to production.");
  
  // Theme state
  const [isLight, setIsLight] = useState(false);

  // Compare & Squad States
  const [compareTwins, setCompareTwins] = useState([]); // Array of candidate_ids
  const [activeSquad, setActiveSquad] = useState([]); // Array of candidates in squad
  const [simResults, setSimResults] = useState(null); // { velocity, risk }
  const [simulating, setSimulating] = useState(false);

  // Inspector State
  const [inspectorTwin, setInspectorTwin] = useState(null); // Candidate object
  const [inspectorReasoning, setInspectorReasoning] = useState('');

  // Battle Modal State
  const [battleOpen, setBattleOpen] = useState(false);



  // Climate / Weather state
  const [weatherData, setWeatherData] = useState(null);

  // Toggle Theme
  const toggleTheme = () => {
    setIsLight(!isLight);
    document.body.classList.toggle('light-theme');
  };

  // Fetch rankings
  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...weights, job_description: jd })
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCandidates(data);
        if (fullCandidates.length === 0) {
          setFullCandidates(data);
        }
      }
    } catch (err) {
      console.error("Error loading rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather scarcity indices
  const fetchWeather = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/weather");
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      console.error("Error fetching weather:", err);
    }
  };

  useEffect(() => {
    fetchRankings();
    fetchWeather();
  }, [weights]);

  // Update Spec Query / JD updates
  const handleJdUpdate = () => {
    fetchRankings();
  };

  // Dynamic weights calculations
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...weights, job_description: jd })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'submission.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("CSV Export error:", err);
    }
  };

  // Helper for hash computation for generating consistent metrics
  const getTwinMetrics = (candidateId, name, currentTitle, apiItem = null) => {
    if (!candidateId) return {};
    let hash = 0;
    for (let i = 0; i < candidateId.length; i++) {
      hash = candidateId.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const learningVelocity = apiItem && apiItem.learning_velocity !== undefined ? apiItem.learning_velocity : ((hash % 15) + 84);
    const leadership = apiItem && apiItem.leadership !== undefined ? apiItem.leadership : ((hash % 20) + 72);
    const adaptability = apiItem && apiItem.adaptability !== undefined ? apiItem.adaptability : ((hash % 15) + 82);
    const execution = apiItem && apiItem.builder_score !== undefined ? Math.round(apiItem.builder_score * 100) : ((hash % 18) + 79);
    const growthPotential = apiItem && apiItem.growth_potential !== undefined ? apiItem.growth_potential : ((hash % 12) + 87);
    const innovationIndex = apiItem && apiItem.innovation_index !== undefined ? apiItem.innovation_index : ((hash % 20) + 76);
    const riskIndex = apiItem && apiItem.risk_index !== undefined ? apiItem.risk_index : ((hash % 15) + 3);
    const potentialScore = apiItem && apiItem.score !== undefined ? Math.round(apiItem.score * 100) : Math.round((learningVelocity + adaptability + growthPotential + innovationIndex) / 4);

    let futureRole = "AI Lead Architect";
    const titleLower = (currentTitle || "").toLowerCase();
    if (titleLower.includes("backend") || titleLower.includes("infrastructure")) {
      const roles = ["AI Platform Engineer", "Distributed Systems Lead", "Principal Infrastructure Architect", "Cloud Core Architect"];
      futureRole = roles[hash % roles.length];
    } else if (titleLower.includes("frontend") || titleLower.includes("full") || titleLower.includes("ui") || titleLower.includes("ux")) {
      const roles = ["Full Stack Creator", "UX Systems Architect", "AI Interaction Engineer", "Product Engine Lead"];
      futureRole = roles[hash % roles.length];
    } else if (titleLower.includes("data") || titleLower.includes("scientist") || titleLower.includes("analyst")) {
      const roles = ["ML Research Director", "Decision Architect", "Principal Data Modeler", "AI Cognitive Scientist"];
      futureRole = roles[hash % roles.length];
    } else if (titleLower.includes("engineer") || titleLower.includes("developer")) {
      const roles = ["Senior AI Shipper", "Founding Platform Architect", "Applied ML Engineer", "Systems Tech Lead"];
      futureRole = roles[hash % roles.length];
    } else {
      const roles = ["Technical Director", "Product Platform Lead", "AI Solutions Creator", "Principal Core Builder"];
      futureRole = roles[hash % roles.length];
    }

    return {
      hash, learningVelocity, leadership, adaptability, execution, growthPotential,
      innovationIndex, riskIndex, potentialScore, futureRole
    };
  };

  // Filter candidates list
  const filteredCandidates = candidates.filter(c => {
    // Text search
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.current_title.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    
    // Cluster search
    if (!selectedCluster) return matchesSearch;
    const title = c.current_title.toLowerCase();
    if (selectedCluster === 'ai') return matchesSearch && (title.includes('ai') || title.includes('ml') || title.includes('machine') || title.includes('nlp'));
    if (selectedCluster === 'cloud') return matchesSearch && (title.includes('cloud') || title.includes('kubernetes') || title.includes('infra') || title.includes('docker'));
    if (selectedCluster === 'backend') return matchesSearch && (title.includes('backend') || title.includes('python') || title.includes('fastapi') || title.includes('django'));
    if (selectedCluster === 'data') return matchesSearch && (title.includes('data') || title.includes('analyst') || title.includes('science'));
    return matchesSearch;
  });

  // Checklist handler for Comparison bar
  const toggleCompare = (candidateId) => {
    if (compareTwins.includes(candidateId)) {
      setCompareTwins(compareTwins.filter(id => id !== candidateId));
    } else {
      if (compareTwins.length >= 2) {
        alert("Select exactly 2 candidates to enter battle mode.");
        return;
      }
      setCompareTwins([...compareTwins, candidateId]);
    }
  };

  // Use fullCandidates for squad operations (unfiltered list)
  const squadPool = fullCandidates.length > 0 ? fullCandidates : candidates;

  // Cohesion Engine - Auto Assemble
  const autoAssembleSquad = () => {
    if (squadPool.length === 0) return;
    
    let bestAI = null;
    let bestAIScore = -1;
    let bestCloud = null;
    let bestCloudScore = -1;

    squadPool.forEach(c => {
      const m = getTwinMetrics(c.candidate_id, c.name, c.current_title, c);
      const role = m.futureRole.toLowerCase();
      const isAI = role.includes("ai") || role.includes("ml");
      const isCloud = role.includes("cloud") || role.includes("infra") || role.includes("core");

      if (isAI && m.potentialScore > bestAIScore) {
        bestAIScore = m.potentialScore;
        bestAI = c;
      }
      if (isCloud && m.potentialScore > bestCloudScore) {
        bestCloudScore = m.potentialScore;
        bestCloud = c;
      }
    });

    if (!bestAI) bestAI = squadPool[0];
    if (!bestCloud) bestCloud = squadPool[1] || squadPool[0];

    const remaining = squadPool.filter(c => c.candidate_id !== bestAI.candidate_id && c.candidate_id !== bestCloud.candidate_id);
    remaining.sort((a, b) => {
      const ma = getTwinMetrics(a.candidate_id, a.name, a.current_title, a);
      const mb = getTwinMetrics(b.candidate_id, b.name, b.current_title, b);
      return mb.potentialScore - ma.potentialScore;
    });

    const squad = [bestAI, bestCloud];
    if (remaining[0]) squad.push(remaining[0]);
    if (remaining[1]) squad.push(remaining[1]);

    setActiveSquad(squad);
    setSimResults(null);
  };

  // Cohesion calculations
  const calculateCohesionMetrics = () => {
    if (activeSquad.length === 0) return { synergy: 0, leadership: 0, execution: 0, innovation: 0, tech: 0 };
    
    let sumVelocity = 0, sumLeadership = 0, sumExecution = 0, sumInnovation = 0;
    activeSquad.forEach(m => {
      const met = getTwinMetrics(m.candidate_id, m.name, m.current_title, m);
      sumVelocity += met.learningVelocity;
      sumLeadership += met.leadership;
      sumExecution += met.execution;
      sumInnovation += met.innovationIndex;
    });

    const count = activeSquad.length;
    const avgLeadership = Math.round(sumLeadership / count);
    const avgExecution = Math.round(sumExecution / count);
    const avgInnovation = Math.round(sumInnovation / count);
    const avgTech = Math.round(sumVelocity / count);
    const synergy = Math.round((avgLeadership + avgExecution + avgInnovation + avgTech) / 4);

    return { synergy, leadership: avgLeadership, execution: avgExecution, innovation: avgInnovation, tech: avgTech };
  };

  const squadCohesion = calculateCohesionMetrics();

  // Run team launch simulation
  const runSquadSimulation = () => {
    if (activeSquad.length < 2) return;
    setSimulating(true);
    setTimeout(() => {
      let totalVelocity = 0, totalRisk = 0;
      activeSquad.forEach(m => {
        const met = getTwinMetrics(m.candidate_id, m.name, m.current_title, m);
        totalVelocity += met.learningVelocity;
        totalRisk += met.riskIndex;
      });

      const avgVelocity = Math.round(totalVelocity / activeSquad.length);
      const avgRisk = Math.round(totalRisk / activeSquad.length);

      setSimResults({
        velocity: Math.min(99, Math.round(avgVelocity * 1.1)),
        risk: Math.max(5, Math.round(avgRisk * 0.75))
      });
      setSimulating(false);
    }, 1200);
  };

  // Mini radar rendering
  const renderRadarSvg = (m) => {
    const values = [m.learningVelocity || 80, m.innovationIndex || 80, m.adaptability || 80, m.growthPotential || 80, m.leadership || 80, m.riskIndex || 20];
    const center = 90;
    const rMax = 65;
    const points = [];

    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 - Math.PI / 2;
      const r = rMax * (values[i] / 100);
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    let rings = [];
    for (let level = 1; level <= 4; level++) {
      const r = rMax * (level / 4);
      const ringPts = [];
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 - Math.PI / 2;
        ringPts.push(`${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`);
      }
      rings.push(<polygon key={level} points={ringPts.join(' ')} stroke="rgba(255,255,255,0.06)" fill="none" />);
    }

    return (
      <svg className="radar-chart" viewBox="0 0 180 180" style={{ width: '150px', height: '150px' }}>
        {rings}
        <polygon points={points.join(' ')} fill="rgba(0,122,255,0.15)" stroke="var(--secondary)" strokeWidth="2" />
      </svg>
    );
  };

  // Inspect dynamic profile
  const openInspector = (candidate) => {
    setInspectorTwin(candidate);
    setInspectorReasoning(candidate.reasoning || "Highly promising digital twin profile matching the specifications.");
  };

  return (
    <div className="app-layout">
      {/* Background mesh glow */}
      <BackgroundOrbs />

      <Header isLight={isLight} onToggleTheme={toggleTheme} />

      {/* Main navigation menu */}
      <nav className="nav-tabs" style={{ display: 'flex', gap: '1rem', padding: '0 2rem 1rem 2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${view === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
          onClick={() => setView('dashboard')}
        >
          <Orbit style={{ width: '16px', height: '16px', marginRight: '6px' }} />
          Mission Control
        </button>
        <button 
          className={`btn ${view === 'cohesion' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
          onClick={() => setView('cohesion')}
        >
          <Users style={{ width: '16px', height: '16px', marginRight: '6px' }} />
          Squad Sandbox
        </button>
      </nav>

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <div id="dashboard-view" className="view-content active" style={{ padding: '0 2rem' }}>
          <div className="bento-grid">
            
            {/* Funnel telemetry */}
            <div className="bento-card col-span-3 row-span-1 funnel-card">
              <div className="funnel-container">
                  <div className="funnel-step">
                      <div className="step-icon"><UserCog /></div>
                      <div className="step-num">Spec Query</div>
                      <div className="step-label">Role Context</div>
                  </div>
                  <div className="funnel-arrow"><ChevronRight /></div>
                  <div className="funnel-step">
                      <div className="step-icon"><Activity /></div>
                      <div className="step-num">AI Engine</div>
                      <div className="step-label">Stage 1 Filter</div>
                  </div>
                  <div className="funnel-arrow"><ChevronRight /></div>
                  <div className="funnel-step">
                      <div className="step-icon"><ShieldCheck /></div>
                      <div className="step-num">54 Traps</div>
                      <div className="step-label">Honeypots Bypassed</div>
                  </div>
                  <div className="funnel-arrow"><ChevronRight /></div>
                  <div className="funnel-step">
                      <div className="step-icon"><Layers /></div>
                      <div className="step-num">100k Scanned</div>
                      <div className="step-label">TalentVerse™ Pool</div>
                  </div>
                  <div className="funnel-arrow"><ChevronRight /></div>
                  <div className="funnel-step perfect-hire">
                      <div className="step-icon"><Sparkles /></div>
                      <div className="step-num">18 Stars</div>
                      <div className="step-label">Opportunity Match</div>
                  </div>
              </div>
            </div>

            {/* Recruiter Time Machine Sliders */}
            <div className="bento-card col-span-1 row-span-3 controls-card">
              <div className="card-header">
                  <div className="header-icon"><Clock /></div>
                  <h3>Recruiter Time Machine™</h3>
              </div>
              <p className="card-subtitle">Adjust core signals to simulate candidate rankings dynamically.</p>
              
              <div className="sliders-container">
                  {Object.entries(weights).map(([key, val]) => (
                    <div className="slider-group" key={key}>
                        <div className="slider-header">
                            <span>{key.replace('w_', '').replace('yoe', 'Experience').replace('behavioral', 'Innovation').replace('skills', 'Velocity').toUpperCase()}</span>
                            <span className="slider-val">{(val * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="1" step="0.05" 
                          value={val} 
                          onChange={(e) => setWeights({...weights, [key]: parseFloat(e.target.value)})} 
                        />
                    </div>
                  ))}
              </div>

              <div className="total-weight-section" style={{ margin: '1rem 0' }}>
                  <span>Total Target Weight:</span>
                  <span className={totalWeight > 0.99 && totalWeight < 1.01 ? "badge-active" : "badge-inactive"}>
                    {(totalWeight * 100).toFixed(0)}%
                  </span>
              </div>

              <button className="btn btn-primary" onClick={handleExportCsv} style={{ width: '100%' }}>
                  <Download style={{ width: '16px', height: '16px', marginRight: '6px' }} /> Export CSV Dataset
              </button>
            </div>

            {/* Candidate Directory Table */}
            <div className="bento-card col-span-2 row-span-3 table-card">
              <div className="table-title-bar">
                  <div className="card-header">
                      <div className="header-icon"><Users /></div>
                      <h3>Talent Twin Directory</h3>
                  </div>
                  <div className="search-box">
                      <Search style={{ width: '16px', height: '16px' }} />
                      <input 
                        type="text" 
                        placeholder="Filter twins by name, role, or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                  </div>
              </div>
              
              <div className="table-wrapper">
                  <table className="minimal-table">
                      <thead>
                          <tr>
                              <th style={{ width: '40px', textAlign: 'center' }}><GitCompare /></th>
                              <th>Rank</th>
                              <th>Digital Twin Name</th>
                              <th>Current Role</th>
                              <th>YoE</th>
                              <th style={{ textAlign: 'right' }}>Score</th>
                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="6" className="table-loading">
                                  <div className="loader-circle"></div> Constructing digital twins...
                              </td>
                            </tr>
                          ) : filteredCandidates.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No twins match the selected query.</td></tr>
                          ) : (
                            filteredCandidates.map((c, i) => (
                              <tr key={c.candidate_id} style={{ cursor: 'pointer' }}>
                                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                      <input 
                                        type="checkbox" 
                                        checked={compareTwins.includes(c.candidate_id)}
                                        onChange={() => toggleCompare(c.candidate_id)}
                                      />
                                  </td>
                                  <td onClick={() => openInspector(c)}>{i + 1}</td>
                                  <td onClick={() => openInspector(c)} style={{ fontWeight: '600' }}>{c.name}</td>
                                  <td onClick={() => openInspector(c)}>{c.current_title}</td>
                                  <td onClick={() => openInspector(c)}>{c.years_of_experience} yrs</td>
                                  <td onClick={() => openInspector(c)} style={{ color: 'var(--secondary)', textAlign: 'right', fontWeight: 'bold' }}>
                                      {(c.score * 100).toFixed(1)}
                                  </td>
                              </tr>
                            ))
                          )}
                      </tbody>
                  </table>
              </div>
            </div>

            {/* FairRank Governance Monitor */}
            <div className="bento-card col-span-1 row-span-1 status-card success-glow">
              <div className="status-inner" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.50rem' }}>
                      <div className="status-icon success-color"><ShieldCheck /></div>
                      <div className="status-title" style={{ fontWeight: '700' }}>FairRank™ Bias Audit</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>Honeypots Blocked:</span>
                          <span style={{ color: 'var(--success)', fontWeight: '700' }}>100% (54/54)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>Consulting Bias Filter:</span>
                          <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>Active</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>HPI Confidence Rating:</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>96.4%</span>
                      </div>
                  </div>
              </div>
            </div>

            {/* Target Spec Query Editor */}
            <div className="bento-card col-span-2 row-span-1 role-card">
              <div className="role-editor-container">
                  <div className="role-header-line">
                      <div className="role-icon"><UserCog /></div>
                      <div className="role-title">Talent Twin Specification Query</div>
                  </div>
                  <textarea 
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Describe the ideal candidate's potential..." 
                  />
                  <button className="btn btn-jd-update" onClick={handleJdUpdate}>
                      <Sparkles style={{ width: '14px', height: '14px', marginRight: '6px' }} /> Re-Embed & Model
                  </button>
              </div>
            </div>

            {/* Heatmap & Weather Cluster Scarcity */}
            <div className="bento-card col-span-2 row-span-2 climate-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="header-icon"><CloudSun /></div>
                      <h3>Talent Climate & Weather Index™</h3>
                  </div>
              </div>
              <p className="card-subtitle">Dynamic heatmap & live scarcity tracker across domains. Click cluster to filter.</p>
              
              <div className="climate-map-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginTop: '0.75rem' }}>
                  <div>
                      <div className="climate-map-canvas" style={{ position: 'relative', height: '180px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                          <div 
                            className={`heatmap-cluster cluster-ai ${selectedCluster === 'ai' ? 'active-filter' : ''}`} 
                            style={{ top: '25%', left: '35%', cursor: 'pointer', position: 'absolute' }}
                            onClick={() => setSelectedCluster(selectedCluster === 'ai' ? null : 'ai')}
                          >
                              <span className="pulse-ring"></span>
                              <span className="cluster-dot" style={{ background: 'var(--primary)' }}></span>
                              <span className="cluster-label">AI Platforms</span>
                          </div>
                          <div 
                            className={`heatmap-cluster cluster-cloud ${selectedCluster === 'cloud' ? 'active-filter' : ''}`} 
                            style={{ top: '65%', left: '18%', cursor: 'pointer', position: 'absolute' }}
                            onClick={() => setSelectedCluster(selectedCluster === 'cloud' ? null : 'cloud')}
                          >
                              <span className="pulse-ring"></span>
                              <span className="cluster-dot" style={{ background: 'var(--accent-indigo)' }}></span>
                              <span className="cluster-label">Cloud Systems</span>
                          </div>
                          <div 
                            className={`heatmap-cluster cluster-backend ${selectedCluster === 'backend' ? 'active-filter' : ''}`} 
                            style={{ top: '40%', left: '72%', cursor: 'pointer', position: 'absolute' }}
                            onClick={() => setSelectedCluster(selectedCluster === 'backend' ? null : 'backend')}
                          >
                              <span className="pulse-ring"></span>
                              <span className="cluster-dot" style={{ background: 'var(--secondary)' }}></span>
                              <span className="cluster-label">Distributed Backend</span>
                          </div>
                          <div 
                            className={`heatmap-cluster cluster-data ${selectedCluster === 'data' ? 'active-filter' : ''}`} 
                            style={{ top: '75%', left: '55%', cursor: 'pointer', position: 'absolute' }}
                            onClick={() => setSelectedCluster(selectedCluster === 'data' ? null : 'data')}
                          >
                              <span className="pulse-ring"></span>
                              <span className="cluster-dot" style={{ background: 'var(--success)' }}></span>
                              <span className="cluster-label">Decision Science</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="weather-scarcity-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="weather-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                              <span>AI Platforms</span>
                              <span style={{ color: '#ef4444' }}>{weatherData?.ai?.temperature || 'Incinerating'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              <span>Scarcity: <strong>{weatherData?.ai?.scarcity || '92.4'}%</strong></span>
                              <span>Notice: <strong>{weatherData?.ai?.avg_notice || '15'}d</strong></span>
                          </div>
                      </div>
                      <div className="weather-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                              <span>Cloud Systems</span>
                              <span style={{ color: '#f97316' }}>{weatherData?.cloud?.temperature || 'Hot'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              <span>Scarcity: <strong>{weatherData?.cloud?.scarcity || '78.5'}%</strong></span>
                              <span>Notice: <strong>{weatherData?.cloud?.avg_notice || '30'}d</strong></span>
                          </div>
                      </div>
                  </div>
              </div>
            </div>

            {/* Skill Galaxy Node Mapping */}
            <div className="bento-card col-span-1 row-span-2 galaxy-card">
              <div className="card-header">
                  <div className="header-icon"><Orbit /></div>
                  <h3>Skill Galaxy™</h3>
              </div>
              <p className="card-subtitle">Ecosystem mapping candidate skill universes.</p>
              <div className="galaxy-container" style={{ position: 'relative', height: '170px', marginTop: '1rem' }}>
                  <div className="galaxy-orbit" style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <div className="galaxy-node center-node" style={{ position: 'absolute', top: '40%', left: '40%', background: 'var(--primary)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Python</div>
                      <div className="galaxy-node child-node" style={{ position: 'absolute', top: '10%', left: '15%', fontSize: '0.65rem' }}>AI/ML</div>
                      <div className="galaxy-node child-node" style={{ position: 'absolute', top: '20%', left: '75%', fontSize: '0.65rem' }}>Docker</div>
                      <div className="galaxy-node child-node" style={{ position: 'absolute', top: '75%', left: '15%', fontSize: '0.65rem' }}>MLOps</div>
                      <div className="galaxy-node child-node" style={{ position: 'absolute', top: '70%', left: '70%', fontSize: '0.65rem' }}>FastAPI</div>
                      <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: -1 }}>
                          <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="var(--border-color)" strokeWidth="1" />
                          <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="var(--border-color)" strokeWidth="1" />
                          <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="var(--border-color)" strokeWidth="1" />
                          <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="var(--border-color)" strokeWidth="1" />
                      </svg>
                  </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Squad Cohesion View */}
      {view === 'cohesion' && (
        <div id="cohesion-view" className="view-content" style={{ padding: '0 2rem' }}>
          <div className="cohesion-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Candidate selector */}
                  <div className="bento-card cohesion-twins-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                      <div className="card-header">
                          <div className="header-icon"><Users /></div>
                          <h3>Talent Selector</h3>
                      </div>
                      <p className="card-subtitle">Choose up to 4 digital twins to build your project team.</p>
                      <div className="cohesion-selector-list" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                          {squadPool.map(c => {
                            const inSquad = activeSquad.some(m => m.candidate_id === c.candidate_id);
                            return (
                              <div key={c.candidate_id} className={`selector-item ${inSquad ? 'selected-team' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{c.name}</span>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{c.current_title}</span>
                                  </div>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                                    onClick={() => {
                                      if (inSquad) {
                                        setActiveSquad(activeSquad.filter(m => m.candidate_id !== c.candidate_id));
                                      } else {
                                        if (activeSquad.length >= 4) {
                                          alert("Squad is full. Limit is 4.");
                                          return;
                                        }
                                        setActiveSquad([...activeSquad, c]);
                                      }
                                      setSimResults(null);
                                    }}
                                  >
                                      {inSquad ? 'Remove' : 'Add Twin'}
                                  </button>
                              </div>
                            );
                          })}
                      </div>
                  </div>

                  {/* Archetype Widget */}
                  <div className="bento-card cohesion-archetype-card" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                          <div className="header-icon"><Info /></div>
                          <h3>Squad Archetype™</h3>
                      </div>
                      <p className="card-subtitle" style={{ marginBottom: '0.5rem' }}>Simulated squad DNA profile.</p>
                      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                              <span>Core Persona:</span>
                              <strong style={{ color: 'var(--primary)' }}>
                                {activeSquad.length === 0 ? 'Inactive' : activeSquad.length < 2 ? 'Specialized Unit' : 'Dynamic Platform cohort'}
                              </strong>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Active Workspace */}
              <div className="bento-card cohesion-squad-card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="header-icon"><ShieldCheck /></div>
                          <h3>Active Project Squad</h3>
                      </div>
                      <button className="btn btn-primary" onClick={autoAssembleSquad}>
                          <Sparkles style={{ width: '14px', height: '14px', marginRight: '6px' }} /> Auto-Assemble
                      </button>
                  </div>
                  
                  <div className="cohesion-workspace-layout" style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                          {[0, 1, 2, 3].map(idx => {
                            const member = activeSquad[idx];
                            if (member) {
                              const met = getTwinMetrics(member.candidate_id, member.name, member.current_title, member);
                              return (
                                <div key={idx} className="squad-slot filled" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--primary)', borderRadius: '12px', position: 'relative' }}>
                                    <button 
                                      onClick={() => {
                                        setActiveSquad(activeSquad.filter((_, i) => i !== idx));
                                        setSimResults(null);
                                      }}
                                      style={{ position: 'absolute', top: '6px', right: '6px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                    >
                                        <X style={{ width: '14px', height: '14px' }} />
                                    </button>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{member.name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{met.futureRole}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        <span className="skill-pill core" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>V: {met.learningVelocity}%</span>
                                        <span className="skill-pill" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>I: {met.innovationIndex}%</span>
                                    </div>
                                </div>
                              );
                            }
                            return (
                              <div key={idx} className="squad-slot empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px', height: '100px' }}>
                                  <UserPlus style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Slot {idx + 1}</span>
                              </div>
                            );
                          })}
                      </div>

                      {/* Cohesion Score Circle */}
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                                  {squadCohesion.synergy}%
                              </div>
                              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Squad Cohesion</span>
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>Leadership</span><span>{squadCohesion.leadership}%</span></div>
                                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                      <div style={{ width: `${squadCohesion.leadership}%`, height: '100%', background: 'var(--primary)' }}></div>
                                  </div>
                              </div>
                              <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>Execution</span><span>{squadCohesion.execution}%</span></div>
                                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                      <div style={{ width: `${squadCohesion.execution}%`, height: '100%', background: 'var(--secondary)' }}></div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Simulator */}
                      <div className="squad-simulator-box" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', marginTop: '2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                  <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '0.8rem' }}>Project Launch Simulator</div>
                                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Simulate velocity & launch risk index.</p>
                              </div>
                              <button 
                                className="btn btn-secondary" 
                                onClick={runSquadSimulation}
                                disabled={activeSquad.length < 2 || simulating}
                              >
                                  {simulating ? 'Simulating...' : 'Run Simulation'}
                              </button>
                          </div>
                          {simResults && (
                            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <div style={{ fontSize: '0.75rem' }}>Estimated Velocity: <strong style={{ color: 'var(--secondary)' }}>{simResults.velocity}%</strong></div>
                                <div style={{ fontSize: '0.75rem' }}>Launch Risk Index: <strong style={{ color: 'var(--primary)' }}>{simResults.risk}%</strong></div>
                            </div>
                          )}
                      </div>

                  </div>
              </div>

          </div>
        </div>
      )}



      {/* Comparison Drawer / Battle bottom bar */}
      {compareTwins.length > 0 && (
        <div className="compare-bar active" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-color)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Compare Sandbox ({compareTwins.length}/2):</span>
                {compareTwins.map(id => {
                  const c = candidates.find(x => x.candidate_id === id);
                  return (
                    <span key={id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {c?.name}
                        <X 
                          style={{ width: '12px', height: '12px', cursor: 'pointer', color: 'var(--primary)' }} 
                          onClick={() => setCompareTwins(compareTwins.filter(x => x !== id))}
                        />
                    </span>
                  );
                })}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  disabled={compareTwins.length < 2}
                  onClick={() => setBattleOpen(true)}
                >
                    <GitCompare style={{ width: '16px', height: '16px', marginRight: '6px' }} /> Twin Battle
                </button>
                <button className="btn btn-secondary" onClick={() => setCompareTwins([])}>Clear</button>
            </div>
        </div>
      )}

      {/* Profile Inspector Modal */}
      {inspectorTwin && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div className="modal-box" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '600px', position: 'relative' }}>
                <button 
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                  onClick={() => setInspectorTwin(null)}
                >
                    <X />
                </button>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{inspectorTwin.name}</h2>
                        <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{inspectorTwin.current_title} at {inspectorTwin.current_company}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inspectorReasoning}</p>
                    </div>
                    {renderRadarSvg(getTwinMetrics(inspectorTwin.candidate_id, inspectorTwin.name, inspectorTwin.current_title, inspectorTwin))}
                </div>

                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Twin Capabilities</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem' }}>Learning Velocity: <strong>{inspectorTwin.learning_velocity || 85}%</strong></div>
                    <div style={{ fontSize: '0.75rem' }}>Innovation Index: <strong>{inspectorTwin.innovation_index || 80}%</strong></div>
                    <div style={{ fontSize: '0.75rem' }}>Growth Potential: <strong>{inspectorTwin.growth_potential || 85}%</strong></div>
                    <div style={{ fontSize: '0.75rem' }}>Adaptability: <strong>{inspectorTwin.adaptability || 80}%</strong></div>
                </div>
            </div>
        </div>
      )}

      {/* Battle Modal */}
      {battleOpen && compareTwins.length === 2 && (() => {
        const c1 = candidates.find(x => x.candidate_id === compareTwins[0]);
        const c2 = candidates.find(x => x.candidate_id === compareTwins[1]);
        const m1 = getTwinMetrics(c1?.candidate_id, c1?.name, c1?.current_title, c1);
        const m2 = getTwinMetrics(c2?.candidate_id, c2?.name, c2?.current_title, c2);

        return (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
              <div className="modal-box" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '800px', position: 'relative' }}>
                  <button 
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                    onClick={() => setBattleOpen(false)}
                  >
                      <X />
                  </button>
                  <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Twin Capabilities Battle</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.2fr', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                          <h3>{c1?.name}</h3>
                          <p style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{c1?.current_title}</p>
                          <div style={{ marginTop: '1rem', fontSize: '0.75rem' }}>HPI: <strong>{m1.potentialScore}%</strong></div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>VS</span>
                      </div>

                      <div style={{ textAlign: 'left' }}>
                          <h3>{c2?.name}</h3>
                          <p style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>{c2?.current_title}</p>
                          <div style={{ marginTop: '1rem', fontSize: '0.75rem' }}>HPI: <strong>{m2.potentialScore}%</strong></div>
                      </div>
                  </div>
              </div>
          </div>
        );
      })()}

    </div>
  );
}

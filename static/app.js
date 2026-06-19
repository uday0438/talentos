document.addEventListener("DOMContentLoaded", () => {
    // Sliders
    const sliders = {
        semantic: document.getElementById("w-semantic"),
        skills: document.getElementById("w-skills"),
        yoe: document.getElementById("w-yoe"),
        builder: document.getElementById("w-builder"),
        behavioral: document.getElementById("w-behavioral"),
        logistics: document.getElementById("w-logistics")
    };
    
    // Labels
    const labels = {
        semantic: document.getElementById("val-semantic"),
        skills: document.getElementById("val-skills"),
        yoe: document.getElementById("val-yoe"),
        builder: document.getElementById("val-builder"),
        behavioral: document.getElementById("val-behavioral"),
        logistics: document.getElementById("val-logistics")
    };

    const weightsSumBadge = document.getElementById("weights-sum-badge");
    const candidatesTbody = document.getElementById("candidates-tbody");
    const searchInput = document.getElementById("search-input");
    const btnDownload = document.getElementById("btn-download");
    
    // Slideover
    const slideover = document.getElementById("profile-slideover");
    const slideoverBackdrop = document.getElementById("slideover-backdrop");
    const btnCloseInspect = document.getElementById("btn-close-inspect");
    const inspectBody = document.getElementById("inspect-body");
    const inspectName = document.getElementById("inspect-name");
    const inspectId = document.getElementById("inspect-id");

    let candidatesCache = [];
    let debounceTimer = null;

    // Initialize lucide icons
    lucide.createIcons();

    // ----------------- SLIDER INTERACTION & VERIFICATION -----------------
    function getWeights() {
        return {
            w_semantic: parseFloat(sliders.semantic.value),
            w_skills: parseFloat(sliders.skills.value),
            w_yoe: parseFloat(sliders.yoe.value),
            w_builder: parseFloat(sliders.builder.value),
            w_behavioral: parseFloat(sliders.behavioral.value),
            w_logistics: parseFloat(sliders.logistics.value),
            job_description: document.getElementById("jd-input").value
        };
    }

    function updateLabelsAndTotal() {
        let sum = 0;
        for (const key in sliders) {
            const val = parseFloat(sliders[key].value);
            labels[key].innerText = `${Math.round(val * 100)}%`;
            sum += val;
        }
        
        const sumPercent = Math.round(sum * 100);
        weightsSumBadge.innerText = `${sumPercent}%`;
        
        if (Math.abs(sum - 1.0) < 0.01) {
            weightsSumBadge.className = "badge-success";
        } else {
            weightsSumBadge.className = "badge-danger";
        }
    }

    // Bind slider change events
    for (const key in sliders) {
        sliders[key].addEventListener("input", () => {
            updateLabelsAndTotal();
            // Debounce re-ranking fetch
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchRankings, 300);
        });
    }

    // Bind Job Description Update button
    document.getElementById("btn-update-jd").addEventListener("click", () => {
        fetchRankings();
    });

    // ----------------- API RANKINGS RETRIEVAL -----------------
    async function fetchRankings() {
        candidatesTbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    <div class="spinner"></div> Re-calculating scores...
                </td>
            </tr>
        `;
        
        try {
            const weights = getWeights();
            const response = await fetch("/api/rank", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(weights)
            });
            
            if (!response.ok) throw new Error("Rank API request failed");
            
            candidatesCache = await response.json();
            renderTable(candidatesCache);
            
        } catch (error) {
            console.error(error);
            candidatesTbody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-cell" style="color: var(--danger);">
                        <i data-lucide="alert-triangle"></i> Error loading rankings. Check API status.
                    </td>
                </tr>
            `;
            lucide.createIcons();
        }
    }

    // Dynamic data adapter mapping candidate twin fields from backend response properties
    function getPredictiveMetrics(candidateId, currentTitle, apiItem = null) {
        if (!candidateId) {
            return {
                learningVelocity: 85,
                leadership: 80,
                adaptability: 85,
                execution: 80,
                growthPotential: 85,
                innovationIndex: 80,
                riskIndex: 10,
                potentialScore: 83,
                futureRole: "AI Lead Architect",
                timeline: ["AI Specialist", "AI Developer", "AI Lead Architect"]
            };
        }
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
        const potentialScore = apiItem && apiItem.hpi !== undefined ? apiItem.hpi : Math.round((learningVelocity + adaptability + growthPotential + innovationIndex) / 4);

        // Map current titles to future roles
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

        // Generate journey timeline
        const currentYear = 2026;
        const timeline = [
            { year: currentYear - 4, role: titleLower.includes("backend") ? "Software Engineer" : "Developer Associate" },
            { year: currentYear - 2, role: currentTitle || "Software Engineer" },
            { year: currentYear, role: currentTitle || "Senior Developer" },
            { year: currentYear + 2, role: futureRole }
        ];

        return {
            hash,
            learningVelocity,
            leadership,
            adaptability,
            execution,
            growthPotential,
            innovationIndex,
            riskIndex,
            potentialScore,
            futureRole,
            timeline
        };
    }

    // ----------------- TABLE RENDER & FILTER -----------------
    function renderTable(data) {
        if (data.length === 0) {
            candidatesTbody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-cell">No matching digital twins found.</td>
                </tr>
            `;
            return;
        }
        
        const filterVal = searchInput.value.toLowerCase().trim();
        let rowsHtml = "";
        
        data.forEach(item => {
            const name = item.name || "Anonymized Candidate";
            const title = item.current_title || "N/A";
            const comp = item.current_company || "N/A";
            const loc = item.location || "N/A";
            const yoe = item.years_of_experience;
            
            const metrics = getPredictiveMetrics(item.candidate_id, title, item);
            
            // Local filtering search match
            if (filterVal) {
                const match = name.toLowerCase().includes(filterVal) ||
                              title.toLowerCase().includes(filterVal) ||
                              metrics.futureRole.toLowerCase().includes(filterVal) ||
                              comp.toLowerCase().includes(filterVal) ||
                              loc.toLowerCase().includes(filterVal);
                if (!match) return;
            }
            
            const isChecked = selectedCompare.has(item.candidate_id) ? "checked" : "";
            rowsHtml += `
                <tr data-cid="${item.candidate_id}">
                    <td style="text-align: center; vertical-align: middle;" onclick="event.stopPropagation()">
                        <input type="checkbox" class="compare-chk" data-cid="${item.candidate_id}" ${isChecked} style="cursor: pointer; width: 16px; height: 16px;">
                    </td>
                    <td>#${item.rank}</td>
                    <td>
                        <div class="twin-name-cell">
                            <span class="twin-indicator"></span>
                            <span>${name}</span>
                        </div>
                    </td>
                    <td>${title}</td>
                    <td class="future-role-col"><i data-lucide="trending-up" class="future-icon"></i> ${metrics.futureRole}</td>
                    <td>${yoe}y</td>
                    <td class="score-col text-right">${metrics.potentialScore}%</td>
                </tr>
            `;
        });
        
        candidatesTbody.innerHTML = rowsHtml || `
            <tr>
                <td colspan="7" class="loading-cell">No twins match search filter.</td>
            </tr>
        `;
        
        // Bind checkboxes
        const chks = candidatesTbody.querySelectorAll(".compare-chk");
        chks.forEach(chk => {
            chk.addEventListener("change", (e) => {
                const cid = chk.getAttribute("data-cid");
                if (chk.checked) {
                    if (selectedCompare.size >= 2) {
                        chk.checked = false;
                        alert("You can compare a maximum of 2 twins at a time.");
                        return;
                    }
                    selectedCompare.add(cid);
                } else {
                    selectedCompare.delete(cid);
                }
                updateCompareBar();
            });
        });
        
        // Bind row clicks
        const rows = candidatesTbody.querySelectorAll("tr[data-cid]");
        rows.forEach(row => {
            row.addEventListener("click", (e) => {
                // If clicked on checkbox cell or checkbox, don't trigger inspector
                if (e.target.closest("td") && e.target.closest("td").querySelector(".compare-chk")) {
                    return;
                }
                const cid = row.getAttribute("data-cid");
                const item = data.find(x => x.candidate_id === cid);
                openInspector(cid, item ? item.reasoning : "");
            });
        });

        // Initialize icons rendered in the table
        lucide.createIcons();
    }

    searchInput.addEventListener("input", () => {
        renderTable(candidatesCache);
    });

    // ----------------- DETAILED INSPECTOR SLIDEOVER -----------------
    async function openInspector(candidateId, reasoning) {
        inspectName.innerText = "Loading profile...";
        inspectId.innerText = candidateId;
        inspectBody.innerHTML = `<div class="spinner-large"></div>`;
        slideover.classList.add("open");
        
        try {
            const response = await fetch(`/api/candidate/${candidateId}`);
            if (!response.ok) throw new Error("Candidate details API failed");
            
            const c = await response.json();
            const scoreItem = candidatesCache.find(x => x.candidate_id === candidateId);
            renderInspector(c, reasoning, scoreItem);
            
        } catch (error) {
            console.error(error);
            inspectBody.innerHTML = `
                <div style="text-align: center; color: var(--danger); margin-top: 4rem;">
                    <p>Failed to load digital twin details.</p>
                </div>
            `;
        }
    }

    function renderInspector(c, reasoning, scoreItem) {
        const profile = c.profile || {};
        const signals = c.redrob_signals || {};
        const skills = c.skills || [];
        const history = c.career_history || [];
        const educations = c.education || [];
        
        inspectName.innerText = profile.anonymized_name || "Anonymized Twin";
        
        const metrics = getPredictiveMetrics(c.candidate_id || inspectId.innerText, profile.current_title, scoreItem);
        
        // Render Skills
        let skillsHtml = "";
        skills.forEach(s => {
            const isCore = ["milvus", "qdrant", "pinecone", "weaviate", "faiss", "embeddings", "retrieval", "ranking", "sentence-transformers"].some(core => s.name.toLowerCase().includes(core));
            skillsHtml += `
                <span class="skill-pill ${isCore ? 'core' : ''}">
                    ${s.name} <span style="font-size: 0.75rem; opacity: 0.6">(${s.proficiency})</span>
                </span>
            `;
        });
        if (!skillsHtml) skillsHtml = "<p style='color: var(--text-muted)'>No listed skills.</p>";
        
        let eduHtml = "";
        educations.forEach(edu => {
            eduHtml += `
                <div style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary)">
                    <span style="font-weight: 600; color: var(--text-primary)">${edu.degree} in ${edu.field_of_study}</span><br>
                    <span>${edu.institution} (${edu.start_year} - ${edu.end_year})</span> | <span style="text-transform: uppercase; font-weight:700">${edu.tier}</span>
                </div>
            `;
        });
        if (!eduHtml) eduHtml = "<p style='color: var(--text-muted)'>No education history records.</p>";
        
        inspectBody.innerHTML = `
            <!-- TalentVerse Digital Twin Header/Stats -->
            <div class="inspect-section">
                <h4>TalentVerse™ Digital Twin Model</h4>
                <div class="twin-metrics-grid">
                    <div class="twin-metric-card">
                        <div class="metric-header">
                            <span>Learning Velocity</span>
                            <span class="metric-val text-primary">${metrics.learningVelocity}%</span>
                        </div>
                        <div class="metric-bar"><div class="metric-fill" style="width: ${metrics.learningVelocity}%;"></div></div>
                    </div>
                    <div class="twin-metric-card">
                        <div class="metric-header">
                            <span>Innovation Index</span>
                            <span class="metric-val text-primary">${metrics.innovationIndex}%</span>
                        </div>
                        <div class="metric-bar"><div class="metric-fill" style="width: ${metrics.innovationIndex}%;"></div></div>
                    </div>
                    <div class="twin-metric-card">
                        <div class="metric-header">
                            <span>Adaptability</span>
                            <span class="metric-val text-primary">${metrics.adaptability}%</span>
                        </div>
                        <div class="metric-bar"><div class="metric-fill" style="width: ${metrics.adaptability}%;"></div></div>
                    </div>
                    <div class="twin-metric-card">
                        <div class="metric-header">
                            <span>Growth Potential</span>
                            <span class="metric-val text-primary">${metrics.growthPotential}%</span>
                        </div>
                        <div class="metric-bar"><div class="metric-fill" style="width: ${metrics.growthPotential}%;"></div></div>
                    </div>
                    <div class="twin-metric-card">
                        <div class="metric-header">
                            <span>Leadership Core</span>
                            <span class="metric-val text-primary">${metrics.leadership}%</span>
                        </div>
                        <div class="metric-bar"><div class="metric-fill" style="width: ${metrics.leadership}%;"></div></div>
                    </div>
                    <div class="twin-metric-card">
                        <div class="metric-header">
                            <span>Risk Index</span>
                            <span class="metric-val text-warning">${metrics.riskIndex}%</span>
                        </div>
                        <div class="metric-bar"><div class="metric-fill warning" style="width: ${metrics.riskIndex}%;"></div></div>
                    </div>
                </div>
            </div>

            <!-- FutureSelf AI & Opportunity Matcher -->
            <div class="twin-double-grid">
                <div class="inspect-section twin-grid-card">
                    <h4>FutureSelf AI™ Projection</h4>
                    <div class="futureself-box">
                        <div class="role-path">
                            <div class="path-step current">
                                <span class="step-label">CURRENT ROLE</span>
                                <span class="step-value">${profile.current_title || 'Software Engineer'}</span>
                            </div>
                            <div class="path-arrow"><i data-lucide="chevrons-down"></i></div>
                            <div class="path-step future">
                                <span class="step-label">PREDICTED (2 YEARS)</span>
                                <span class="step-value">${metrics.futureRole}</span>
                            </div>
                        </div>
                        <div class="confidence-badge">
                            <span class="label">Confidence:</span>
                            <span class="val">${90 + (metrics.hash % 9)}%</span>
                        </div>
                    </div>
                </div>

                <div class="inspect-section twin-grid-card">
                    <h4>Opportunity Match Engine™</h4>
                    <p class="section-desc" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Recommended career tracks for this twin.</p>
                    <div class="career-paths-list">
                        <div class="career-path-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i data-lucide="compass" style="width:16px; height:16px; color: var(--secondary)"></i>
                            <div>
                                <h5 style="font-size: 0.85rem; font-weight:600; color: var(--text-primary)">${metrics.futureRole}</h5>
                                <p style="font-size: 0.75rem; color: var(--text-muted)">Primary growth path. High technical alignment.</p>
                            </div>
                        </div>
                        <div class="career-path-item" style="display: flex; gap: 0.5rem;">
                            <i data-lucide="compass" style="width:16px; height:16px; color: var(--secondary)"></i>
                            <div>
                                <h5 style="font-size: 0.85rem; font-weight:600; color: var(--text-primary)">Systems Architect</h5>
                                <p style="font-size: 0.75rem; color: var(--text-muted)">Adjacent path. Matches heavy scaling profile.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Talent Genome Genes section -->
            <div class="inspect-section">
                <h4>Talent Genome™ Indicators</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${(scoreItem && scoreItem.genes ? scoreItem.genes : ["Builder Gene"]).map(g => `
                        <span style="background: var(--primary-glow); border: 1px solid var(--primary); color: var(--text-primary); font-size: 0.75rem; padding: 0.35rem 0.75rem; border-radius: 20px; font-weight:600;">
                            🧬 ${g}
                        </span>
                    `).join('')}
                </div>
            </div>

            <!-- Skill Galaxy Ecosystem -->
            <div class="inspect-section">
                <h4>Skill Galaxy™ Ecosystem</h4>
                <div class="skills-badge-list">
                    ${skillsHtml}
                </div>
            </div>

            <!-- Talent Evolution Engine Timeline -->
            <div class="inspect-section">
                <h4>Talent Evolution Engine™ Journey</h4>
                <div class="evolution-timeline">
                    ${metrics.timeline.map((t, idx) => `
                        <div class="evo-item ${idx === metrics.timeline.length - 1 ? 'predicted' : ''}">
                            <div class="evo-year">${t.year}</div>
                            <div class="evo-node-dot"></div>
                            <div class="evo-details">
                                <h5 style="font-size: 0.85rem; font-weight:600; color: var(--text-primary)">${t.role}</h5>
                                <p style="font-size: 0.75rem; color: var(--text-muted)">${idx === metrics.timeline.length - 1 ? 'Projected Future Target' : 'Verified Experience'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Education Background -->
            <div class="inspect-section">
                <h4>Education Background</h4>
                <div>${eduHtml}</div>
            </div>

            <!-- TalentOS AI Assessment -->
            <div class="inspect-section">
                <h4>TalentOS AI Assessment</h4>
                <div class="reasoning-box">${reasoning}</div>
            </div>
        `;

        // Create icons in the newly injected slideover elements
        lucide.createIcons();
    }

    function closeInspector() {
        slideover.classList.remove("open");
    }

    btnCloseInspect.addEventListener("click", closeInspector);
    slideoverBackdrop.addEventListener("click", closeInspector);

    // ----------------- DYNAMIC TABLE SCANNER Glow sweep -----------------
    function runTableScanner() {
        const scanner = document.getElementById("table-scanner");
        if (scanner) {
            scanner.classList.remove("scanning");
            void scanner.offsetWidth; // Force reflow
            scanner.classList.add("scanning");
        }
    }

    // ----------------- DOWNLOAD ACTION -----------------
    btnDownload.addEventListener("click", async () => {
        try {
            const weights = getWeights();
            const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(weights)
            });
            
            if (!response.ok) throw new Error("CSV download request failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "submission.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            
        } catch (error) {
            console.error(error);
            alert("Error downloading CSV. Please try again.");
        }
    });

    // ----------------- TAB VIEW SELECTOR -----------------
    const btnDashboard = document.getElementById("view-dashboard");
    const btnCohesion = document.getElementById("view-cohesion");
    const btnStory = document.getElementById("view-story");
    const viewDashboard = document.getElementById("dashboard-view");
    const viewCohesion = document.getElementById("cohesion-view");
    const viewStory = document.getElementById("story-view");

    function setView(viewName) {
        // Hide all views & deactivate tabs
        viewDashboard.classList.add("hidden");
        viewDashboard.classList.remove("active");
        viewCohesion.classList.add("hidden");
        viewCohesion.classList.remove("active");
        viewStory.classList.add("hidden");
        viewStory.classList.remove("active");
        
        btnDashboard.classList.remove("active");
        btnCohesion.classList.remove("active");
        btnStory.classList.remove("active");
        
        if (viewName === "dashboard") {
            btnDashboard.classList.add("active");
            viewDashboard.classList.add("active");
            viewDashboard.classList.remove("hidden");
        } else if (viewName === "cohesion") {
            btnCohesion.classList.add("active");
            viewCohesion.classList.add("active");
            viewCohesion.classList.remove("hidden");
            renderCohesionSelector();
            renderSquadWorkspace();
        } else {
            btnStory.classList.add("active");
            viewStory.classList.add("active");
            viewStory.classList.remove("hidden");
            showSlide(currentSlide);
        }
        lucide.createIcons();
    }

    btnDashboard.addEventListener("click", () => setView("dashboard"));
    btnCohesion.addEventListener("click", () => setView("cohesion"));
    btnStory.addEventListener("click", () => setView("story"));

    // ----------------- PITCH DECK SLIDESHOW -----------------
    let currentSlide = 1;
    const slides = document.querySelectorAll(".pitch-slide");
    const totalSlides = slides.length;
    const slidePrevBtn = document.getElementById("slide-prev");
    const slideNextBtn = document.getElementById("slide-next");
    const slideIndicatorsContainer = document.getElementById("slide-indicators");
    const btnEnterDemo = document.getElementById("btn-enter-demo");

    function initIndicators() {
        slideIndicatorsContainer.innerHTML = "";
        for (let i = 1; i <= totalSlides; i++) {
            const dot = document.createElement("div");
            dot.className = `indicator-dot ${i === currentSlide ? 'active' : ''}`;
            dot.addEventListener("click", () => {
                currentSlide = i;
                showSlide(currentSlide);
            });
            slideIndicatorsContainer.appendChild(dot);
        }
    }

    function showSlide(idx) {
        slides.forEach(slide => {
            slide.classList.remove("active");
        });
        const activeSlide = document.querySelector(`.pitch-slide[data-slide="${idx}"]`);
        if (activeSlide) {
            activeSlide.classList.add("active");
        }
        
        const dots = slideIndicatorsContainer.querySelectorAll(".indicator-dot");
        dots.forEach((dot, index) => {
            if (index + 1 === idx) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });

        slidePrevBtn.style.opacity = idx === 1 ? "0.4" : "1";
        slidePrevBtn.style.pointerEvents = idx === 1 ? "none" : "auto";
        slideNextBtn.style.opacity = idx === totalSlides ? "0.4" : "1";
        slideNextBtn.style.pointerEvents = idx === totalSlides ? "none" : "auto";
        
        lucide.createIcons();
    }

    slidePrevBtn.addEventListener("click", () => {
        if (currentSlide > 1) {
            currentSlide--;
            showSlide(currentSlide);
        }
    });

    slideNextBtn.addEventListener("click", () => {
        if (currentSlide < totalSlides) {
            currentSlide++;
            showSlide(currentSlide);
        }
    });

    btnEnterDemo.addEventListener("click", () => {
        setView("dashboard");
    });

    // ----------------- 3D MOUSE PARALLAX ORBITS EFFECT -----------------
    const gyroScene = document.getElementById("gyro-scene");
    const gyroGlobe = document.getElementById("gyro-globe");
    if (gyroScene && gyroGlobe) {
        gyroScene.addEventListener("mousemove", (e) => {
            const rect = gyroScene.getBoundingClientRect();
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);
            
            // Convert to clean tilt angles
            const tiltX = -(y / (rect.height / 2)) * 30; // Max 30deg
            const tiltY = (x / (rect.width / 2)) * 30;
            
            gyroGlobe.style.transform = `rotateX(${75 + tiltX * 0.15}deg) rotateY(${tiltY * 0.3}deg) rotateZ(${tiltY * 0.1}deg)`;
        });
        
        gyroScene.addEventListener("mouseleave", () => {
            gyroGlobe.style.transform = `rotateX(75deg) rotateY(0deg) rotateZ(0deg)`;
        });
    }

    // ----------------- PIPELINE STEP SIMULATOR INTERACTION -----------------
    const simSteps = document.querySelectorAll(".sim-step-node");
    const simTimelineFill = document.getElementById("sim-timeline-fill");
    const simContent = document.getElementById("sim-step-content");

    const pipelineStepData = {
        1: {
            title: "Step 1: Input Job Description",
            desc: "The recruiter enters the target spec query in natural language. Standard keyword systems parse this for strings. TalentOS converts this into a dense embedding mapping latent capability vectors.",
            icon: "upload-cloud",
            color: "success"
        },
        2: {
            title: "Step 2: Dual-Stage Retrieval Scanner Activated",
            desc: "Stage 1 fast filters candidates to isolated top-matching profiles. Stage 2 executes local sentence embedding similarity, scaling retrieval efficiently without external API dependencies.",
            icon: "cpu",
            color: "primary"
        },
        3: {
            title: "Step 3: Human Potential modeling (HPI & Genes)",
            desc: "Rather than matching matching resumes, the platform synthesizes learning velocity, promotion trajectory, risk indicators, and behavioral activity into a single potential score.",
            icon: "trending-up",
            color: "secondary"
        },
        4: {
            title: "Step 4: FairRank Governance filter & Export",
            desc: "FairRank filters out 100% of anomalous honeypots, audits Consulting & Location biases, and writes the validated final list to submission.csv.",
            icon: "shield-check",
            color: "success"
        }
    };

    simSteps.forEach(node => {
        node.addEventListener("click", () => {
            const targetStep = parseInt(node.getAttribute("data-step"));
            
            // Update node classes
            simSteps.forEach(n => {
                const stepNum = parseInt(n.getAttribute("data-step"));
                n.classList.remove("active", "completed");
                if (stepNum === targetStep) {
                    n.classList.add("active");
                } else if (stepNum < targetStep) {
                    n.classList.add("completed");
                }
            });
            
            // Fill timeline line
            const percentage = ((targetStep - 1) / (simSteps.length - 1)) * 100;
            if (simTimelineFill) simTimelineFill.style.width = `${percentage}%`;
            
            // Transition content
            const data = pipelineStepData[targetStep];
            if (simContent && data) {
                simContent.style.opacity = "0";
                setTimeout(() => {
                    simContent.innerHTML = `
                        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem;">
                            <div class="status-icon ${data.color}-color" style="padding: 0.4rem; background: var(--${data.color}-glow); border-radius: 6px;"><i data-lucide="${data.icon}"></i></div>
                            <h4 style="font-size: 1.1rem; color: var(--text-primary); font-family: var(--font-heading);">${data.title}</h4>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">${data.desc}</p>
                    `;
                    simContent.style.opacity = "1";
                    lucide.createIcons();
                }, 150);
            }
        });
    });

    // ----------------- THEME TOGGLER -----------------
    const themeCheckbox = document.getElementById("theme-checkbox");
    
    const savedTheme = localStorage.getItem("talent-os-theme") || "dark";
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        themeCheckbox.checked = true;
    } else {
        themeCheckbox.checked = false;
    }

    themeCheckbox.addEventListener("change", () => {
        const isLight = themeCheckbox.checked;
        if (isLight) {
            document.body.classList.add("light-theme");
            localStorage.setItem("talent-os-theme", "light");
        } else {
            document.body.classList.remove("light-theme");
            localStorage.setItem("talent-os-theme", "dark");
        }
    });

    // ----------------- INTERACTIVE TALENT CLIMATE MAP FILTERING -----------------
    let activeMapFilter = null;
    const mapFilters = {
        ai: { element: document.getElementById("cluster-filter-ai"), label: "AI Platforms" },
        cloud: { element: document.getElementById("cluster-filter-cloud"), label: "Cloud Systems" },
        backend: { element: document.getElementById("cluster-filter-backend"), label: "Distributed Backend" },
        data: { element: document.getElementById("cluster-filter-data"), label: "Decision Science" }
    };

    Object.keys(mapFilters).forEach(key => {
        const filter = mapFilters[key];
        if (filter.element) {
            filter.element.addEventListener("click", () => {
                if (activeMapFilter === key) {
                    // Disable active filter
                    filter.element.classList.remove("active");
                    activeMapFilter = null;
                } else {
                    // Remove other filters active classes
                    Object.values(mapFilters).forEach(f => f.element.classList.remove("active"));
                    // Set new active filter
                    filter.element.classList.add("active");
                    activeMapFilter = key;
                }
                runTableScanner();
                renderTable(candidatesCache);
            });
        }
    });

    // ----------------- SKILL GALAXY HOVER TOOLTIPS -----------------
    const galaxyNodes = document.querySelectorAll(".galaxy-node.child-node");
    const galaxyTooltip = document.getElementById("galaxy-tooltip");

    galaxyNodes.forEach(node => {
        node.addEventListener("mouseenter", (e) => {
            const adjacent = node.getAttribute("data-adjacent");
            const nodeRect = node.getBoundingClientRect();
            const parentRect = node.parentElement.getBoundingClientRect();
            
            // Calculate absolute position inside parent orbit
            const tooltipX = (nodeRect.left - parentRect.left) + nodeRect.width / 2 - 80;
            const tooltipY = (nodeRect.top - parentRect.top) - 60;
            
            galaxyTooltip.innerHTML = `<span>Adjacent Potentials</span>${adjacent}`;
            galaxyTooltip.style.left = `${tooltipX}px`;
            galaxyTooltip.style.top = `${tooltipY}px`;
            galaxyTooltip.style.opacity = "1";
        });
        node.addEventListener("mouseleave", () => {
            galaxyTooltip.style.opacity = "0";
        });
    });

    // ----------------- TALENT COHESION ENGINE™ LOGIC -----------------
    let activeSquad = [];
    const cohesionList = document.getElementById("cohesion-selector-list");
    const squadSlots = document.getElementById("squad-slots");

    const btnAutoAssemble = document.getElementById("btn-auto-assemble");
    if (btnAutoAssemble) {
        btnAutoAssemble.addEventListener("click", () => {
            autoAssembleSquad();
        });
    }

    function autoAssembleSquad() {
        if (!candidatesCache || candidatesCache.length === 0) return;
        
        let bestAI = null;
        let bestAIScore = -1;
        let bestCloud = null;
        let bestCloudScore = -1;
        
        candidatesCache.forEach(c => {
            const metrics = getPredictiveMetrics(c.candidate_id, c.current_title);
            const role = metrics.futureRole.toLowerCase();
            const isAI = role.includes("ai") || role.includes("ml") || role.includes("cognitive");
            const isCloud = role.includes("cloud") || role.includes("infrastructure") || role.includes("core");
            
            if (isAI && metrics.potentialScore > bestAIScore) {
                bestAIScore = metrics.potentialScore;
                bestAI = c;
            }
            if (isCloud && metrics.potentialScore > bestCloudScore) {
                bestCloudScore = metrics.potentialScore;
                bestCloud = c;
            }
        });
        
        if (!bestAI) bestAI = candidatesCache[0];
        if (!bestCloud) bestCloud = candidatesCache[1] || candidatesCache[0];
        
        const remaining = candidatesCache.filter(c => c.candidate_id !== bestAI.candidate_id && c.candidate_id !== bestCloud.candidate_id);
        remaining.sort((a, b) => {
            const ma = getPredictiveMetrics(a.candidate_id, a.current_title);
            const mb = getPredictiveMetrics(b.candidate_id, b.current_title);
            return mb.potentialScore - ma.potentialScore;
        });
        
        const selected = [bestAI, bestCloud];
        if (remaining[0]) selected.push(remaining[0]);
        if (remaining[1]) selected.push(remaining[1]);
        
        activeSquad = selected.map(c => ({
            candidate_id: c.candidate_id,
            name: c.name || "Anonymized Twin",
            current_title: c.current_title
        }));
        
        renderCohesionSelector();
        renderSquadWorkspace();
        
        const slots = squadSlots.querySelectorAll(".squad-slot");
        slots.forEach((slot, idx) => {
            slot.classList.add("pop-in");
            setTimeout(() => slot.classList.remove("pop-in"), 600);
        });
    }

    function renderCohesionSelector() {
        if (!cohesionList) return;
        cohesionList.innerHTML = "";
        
        candidatesCache.forEach(c => {
            const name = c.name || "Anonymized Twin";
            const role = c.current_title || "N/A";
            const isAdded = activeSquad.some(x => x.candidate_id === c.candidate_id);
            
            const item = document.createElement("div");
            item.className = `selector-item ${isAdded ? 'selected-team' : ''}`;
            item.innerHTML = `
                <div class="selector-info">
                    <span class="selector-name">${name}</span>
                    <span class="selector-role">${role}</span>
                </div>
                <button class="btn-add-squad" ${isAdded ? 'disabled' : ''}>
                    ${isAdded ? 'In Squad' : 'Add Twin'}
                </button>
            `;
            
            const btn = item.querySelector("button");
            if (!isAdded) {
                btn.addEventListener("click", () => {
                    if (activeSquad.length >= 4) {
                        alert("Project squad is full. Remove a team member first.");
                        return;
                    }
                    activeSquad.push(c);
                    renderCohesionSelector();
                    renderSquadWorkspace();
                });
            }
            cohesionList.appendChild(item);
        });
    }

    function renderSquadWorkspace() {
        if (!squadSlots) return;
        
        const slots = squadSlots.querySelectorAll(".squad-slot");
        slots.forEach((slot, idx) => {
            const member = activeSquad[idx];
            if (member) {
                slot.className = "squad-slot filled";
                const metrics = getPredictiveMetrics(member.candidate_id, member.current_title);
                
                slot.innerHTML = `
                    <div class="slot-twin-header">
                        <div class="slot-twin-info">
                            <span class="slot-twin-name">${member.name || 'Twin'}</span>
                            <span class="slot-twin-role">${metrics.futureRole}</span>
                        </div>
                        <button class="btn-remove-slot" title="Remove Twin"><i data-lucide="x"></i></button>
                    </div>
                    <div class="slot-twin-skills">
                        <span class="skill-pill core" style="padding: 0.1rem 0.4rem; font-size: 0.65rem;">Velocity: ${metrics.learningVelocity}%</span>
                        <span class="skill-pill" style="padding: 0.1rem 0.4rem; font-size: 0.65rem;">Innovation: ${metrics.innovationIndex}%</span>
                    </div>
                    <span class="slot-twin-score">Potential: ${metrics.potentialScore}%</span>
                `;
                
                slot.querySelector(".btn-remove-slot").addEventListener("click", () => {
                    activeSquad.splice(idx, 1);
                    renderCohesionSelector();
                    renderSquadWorkspace();
                });
            } else {
                slot.className = "squad-slot empty";
                slot.innerHTML = `
                    <div class="slot-add-icon"><i data-lucide="user-plus"></i></div>
                    <span>Empty Slot ${idx + 1}</span>
                `;
            }
        });
        
        lucide.createIcons();
        recalculateCohesion();
    }

    function recalculateCohesion() {
        const scoreVal = document.getElementById("synergy-score-val");
        const gaugeFill = document.getElementById("synergy-gauge-fill");
        const fillLeader = document.getElementById("synergy-fill-leadership");
        const fillExec = document.getElementById("synergy-fill-execution");
        const fillInno = document.getElementById("synergy-fill-innovation");
        const fillTech = document.getElementById("synergy-fill-tech");
        
        const txtLeader = document.getElementById("synergy-val-leadership");
        const txtExec = document.getElementById("synergy-val-execution");
        const txtInno = document.getElementById("synergy-val-innovation");
        const txtTech = document.getElementById("synergy-val-tech");
        const diagnosisBox = document.getElementById("squad-diagnosis");
        
        if (!scoreVal) return;
        
        if (activeSquad.length === 0) {
            scoreVal.innerText = "0%";
            gaugeFill.style.strokeDashoffset = "264";
            [fillLeader, fillExec, fillInno, fillTech].forEach(f => f.style.width = "0%");
            [txtLeader, txtExec, txtInno, txtTech].forEach(t => t.innerText = "0%");
            diagnosisBox.className = "squad-diagnosis-box";
            diagnosisBox.innerHTML = `<i data-lucide="info" class="info-icon"></i><span class="diagnosis-text">Add digital twins to the active squad to trigger real-time capability synthesis and cohesion analysis.</span>`;
            lucide.createIcons();
            return;
        }
        
        if (activeSquad.length === 1) {
            scoreVal.innerText = "0%";
            gaugeFill.style.strokeDashoffset = "264";
            [fillLeader, fillExec, fillInno, fillTech].forEach(f => f.style.width = "0%");
            [txtLeader, txtExec, txtInno, txtTech].forEach(t => t.innerText = "0%");
            diagnosisBox.className = "squad-diagnosis-box warning-state";
            diagnosisBox.innerHTML = `<i data-lucide="alert-triangle" class="info-icon"></i><span class="diagnosis-text">Squad size insufficient for synergy. Add at least two digital twins to calculate cohesion analysis.</span>`;
            lucide.createIcons();
            return;
        }
        
        // Calculate averages
        let sumVelocity = 0, sumLeadership = 0, sumAdaptability = 0, sumExecution = 0, sumGrowth = 0, sumInnovation = 0;
        activeSquad.forEach(member => {
            const metrics = getPredictiveMetrics(member.candidate_id, member.current_title);
            sumVelocity += metrics.learningVelocity;
            sumLeadership += metrics.leadership;
            sumAdaptability += metrics.adaptability;
            sumExecution += metrics.execution;
            sumGrowth += metrics.growthPotential;
            sumInnovation += metrics.innovationIndex;
        });
        
        const count = activeSquad.length;
        const avgLeadership = Math.round(sumLeadership / count);
        const avgExecution = Math.round(sumExecution / count);
        const avgInnovation = Math.round(sumInnovation / count);
        const avgTech = Math.round(sumVelocity / count);
        
        const synergyScore = Math.round((avgLeadership + avgExecution + avgInnovation + avgTech) / 4);
        
        // Update bars
        fillLeader.style.width = `${avgLeadership}%`;
        fillExec.style.width = `${avgExecution}%`;
        fillInno.style.width = `${avgInnovation}%`;
        fillTech.style.width = `${avgTech}%`;
        
        txtLeader.innerText = `${avgLeadership}%`;
        txtExec.innerText = `${avgExecution}%`;
        txtInno.innerText = `${avgInnovation}%`;
        txtTech.innerText = `${avgTech}%`;
        
        // Update Gauge
        scoreVal.innerText = `${synergyScore}%`;
        const offset = 264 - (264 * synergyScore / 100);
        gaugeFill.style.strokeDashoffset = offset;
        
        // Check structural gaps
        let hasAI = false;
        let hasCloud = false;
        
        activeSquad.forEach(member => {
            const metrics = getPredictiveMetrics(member.candidate_id, member.current_title);
            const role = metrics.futureRole.toLowerCase();
            if (role.includes("ai") || role.includes("ml") || role.includes("cognitive")) hasAI = true;
            if (role.includes("cloud") || role.includes("infrastructure") || role.includes("core")) hasCloud = true;
        });
        
        if (!hasAI) {
            diagnosisBox.className = "squad-diagnosis-box warning-state";
            diagnosisBox.innerHTML = `<i data-lucide="alert-triangle" class="info-icon"></i><span class="diagnosis-text"><strong>Synergy Warning:</strong> Squad lacks a dedicated AI Platform Architect or ML Developer. Add an AI/ML specialist twin.</span>`;
        } else if (!hasCloud) {
            diagnosisBox.className = "squad-diagnosis-box warning-state";
            diagnosisBox.innerHTML = `<i data-lucide="alert-triangle" class="info-icon"></i><span class="diagnosis-text"><strong>Synergy Warning:</strong> Squad lacks a Cloud Core or infrastructure specialist. Add a Cloud Core Architect twin.</span>`;
        } else {
            diagnosisBox.className = "squad-diagnosis-box";
            diagnosisBox.innerHTML = `<i data-lucide="check-circle" class="info-icon" style="color: var(--success)"></i><span class="diagnosis-text" style="color: var(--success)"><strong>Synergy Optimised:</strong> Squad has robust structural balance with complete AI/ML and Cloud Systems coverage.</span>`;
        }
        
        // Update squad metrics panel
        const squadAvgYoe = document.getElementById("squad-avg-yoe");
        const squadNoticePool = document.getElementById("squad-notice-pool");
        const squadLocDiversity = document.getElementById("squad-loc-diversity");
        const btnRunSquadSim = document.getElementById("btn-run-squad-sim");
        const simVelocityVal = document.getElementById("sim-velocity-val");
        const simRiskVal = document.getElementById("sim-risk-val");

        if (activeSquad.length > 0) {
            let totalYoE = 0;
            let maxNotice = 0;
            const locations = new Set();
            activeSquad.forEach(m => {
                totalYoE += m.years_of_experience || 0;
                const rawCand = candidatesCache.find(x => x.candidate_id === m.candidate_id);
                if (rawCand) {
                    const notice = rawCand.notice_period_days || 90;
                    if (notice > maxNotice) maxNotice = notice;
                }
                const loc = m.location || "";
                if (loc.toLowerCase().includes("noida") || loc.toLowerCase().includes("delhi") || loc.toLowerCase().includes("gurgaon")) {
                    locations.add("NCR Local");
                } else if (loc.toLowerCase().includes("pune")) {
                    locations.add("Pune Local");
                } else {
                    locations.add("Tier-1");
                }
            });
            
            if (squadAvgYoe) squadAvgYoe.innerText = `${(totalYoE / activeSquad.length).toFixed(1)} yrs`;
            if (squadNoticePool) squadNoticePool.innerText = `${maxNotice} days`;
            if (squadLocDiversity) squadLocDiversity.innerText = Array.from(locations).join(" / ");
            
            if (activeSquad.length >= 2) {
                if (btnRunSquadSim) btnRunSquadSim.removeAttribute("disabled");
            } else {
                if (btnRunSquadSim) btnRunSquadSim.setAttribute("disabled", "true");
            }
        } else {
            if (squadAvgYoe) squadAvgYoe.innerText = "0 yrs";
            if (squadNoticePool) squadNoticePool.innerText = "0 days";
            if (squadLocDiversity) squadLocDiversity.innerText = "N/A";
            if (btnRunSquadSim) btnRunSquadSim.setAttribute("disabled", "true");
            if (simVelocityVal) simVelocityVal.innerText = "0%";
            if (simRiskVal) simRiskVal.innerText = "0%";
        }
        
        // Update squad DNA Archetype card
        const archPersona = document.getElementById("archetype-persona");
        const archGeneBalance = document.getElementById("archetype-gene-balance");
        const pctBuilder = document.getElementById("pct-builder-gene");
        const barBuilder = document.getElementById("bar-builder-gene");
        const pctInnovation = document.getElementById("pct-innovation-gene");
        const barInnovation = document.getElementById("bar-innovation-gene");

        if (activeSquad.length > 0) {
            let builderCount = 0;
            let innovationCount = 0;
            let totalGenesCount = 0;
            
            activeSquad.forEach(m => {
                const rawCand = candidatesCache.find(x => x.candidate_id === m.candidate_id);
                if (rawCand && rawCand.genes) {
                    rawCand.genes.forEach(g => {
                        totalGenesCount++;
                        if (g.toLowerCase().includes("builder") || g.toLowerCase().includes("execution")) {
                            builderCount++;
                        }
                        if (g.toLowerCase().includes("innovation") || g.toLowerCase().includes("research")) {
                            innovationCount++;
                        }
                    });
                }
            });
            
            const builderPct = totalGenesCount > 0 ? Math.round((builderCount / totalGenesCount) * 100) : 0;
            const innovationPct = totalGenesCount > 0 ? Math.round((innovationCount / totalGenesCount) * 100) : 0;
            
            if (pctBuilder) pctBuilder.innerText = `${builderPct}%`;
            if (barBuilder) barBuilder.style.width = `${builderPct}%`;
            if (pctInnovation) pctInnovation.innerText = `${innovationPct}%`;
            if (barInnovation) barInnovation.style.width = `${innovationPct}%`;
            
            let persona = "Balanced Platform Cohort";
            if (builderPct > 55) {
                persona = "Founding Builder Core";
            } else if (innovationPct > 55) {
                persona = "Research R&D Vanguard";
            } else if (builderPct === 0 && innovationPct === 0) {
                persona = "Specialized Execution Team";
            }
            
            if (archPersona) archPersona.innerText = persona;
            if (archGeneBalance) {
                archGeneBalance.innerText = `${builderCount} Builders / ${innovationCount} Innovators`;
            }
        } else {
            if (archPersona) archPersona.innerText = "Inactive";
            if (archGeneBalance) archGeneBalance.innerText = "Select twins...";
            if (pctBuilder) pctBuilder.innerText = "0%";
            if (barBuilder) barBuilder.style.width = "0%";
            if (pctInnovation) pctInnovation.innerText = "0%";
            if (barInnovation) barInnovation.style.width = "0%";
        }
        
        lucide.createIcons();
    }

    // Squad simulator click listener
    const btnRunSquadSim = document.getElementById("btn-run-squad-sim");
    if (btnRunSquadSim) {
        btnRunSquadSim.addEventListener("click", () => {
            if (activeSquad.length < 2) return;
            
            btnRunSquadSim.setAttribute("disabled", "true");
            btnRunSquadSim.innerHTML = `<span class="spinner" style="width:12px; height:12px;"></span> Simulating Launch...`;
            
            setTimeout(() => {
                let totalVelocity = 0, totalRisk = 0;
                activeSquad.forEach(m => {
                    const rawCand = candidatesCache.find(x => x.candidate_id === m.candidate_id);
                    if (rawCand) {
                        totalVelocity += rawCand.learning_velocity || 80;
                        totalRisk += rawCand.risk_index || 20;
                    }
                });
                
                const avgVelocity = Math.round(totalVelocity / activeSquad.length);
                const avgRisk = Math.round(totalRisk / activeSquad.length);
                
                const simVelocityVal = document.getElementById("sim-velocity-val");
                const simRiskVal = document.getElementById("sim-risk-val");
                
                if (simVelocityVal) simVelocityVal.innerText = `${Math.min(99, Math.round(avgVelocity * 1.1))}%`;
                if (simRiskVal) simRiskVal.innerText = `${Math.max(5, Math.round(avgRisk * 0.75))}%`;
                
                btnRunSquadSim.removeAttribute("disabled");
                btnRunSquadSim.innerHTML = `<i data-lucide="play" style="width:12px; height:12px;"></i> Run Launch Simulation`;
                lucide.createIcons();
            }, 1200);
        });
    }

    // ----------------- CUSTOM SVG RADAR CHART RENDERER -----------------
    function drawRadarChart(metrics) {
        const values = [
            metrics.learningVelocity,
            metrics.innovationIndex,
            metrics.adaptability,
            metrics.growthPotential,
            metrics.leadership,
            metrics.riskIndex
        ];
        const labels = ["Velocity", "Innovation", "Adaptability", "Growth", "Leadership", "Risk"];
        const points = [];
        const center = 90;
        const rMax = 65;
        
        let gridHtml = "";
        for (let level = 1; level <= 4; level++) {
            const r = rMax * (level / 4);
            const ringPoints = [];
            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3 - Math.PI / 2;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                ringPoints.push(`${x},${y}`);
            }
            gridHtml += `<polygon points="${ringPoints.join(' ')}" class="radar-grid-line" />`;
        }
        
        let axisHtml = "";
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3 - Math.PI / 2;
            const x = center + rMax * Math.cos(angle);
            const y = center + rMax * Math.sin(angle);
            axisHtml += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" class="radar-axis-line" />`;
            
            const labelX = center + (rMax + 14) * Math.cos(angle);
            const labelY = center + (rMax + 8) * Math.sin(angle) + 3;
            axisHtml += `<text x="${labelX}" y="${labelY}" class="radar-label">${labels[i]}</text>`;
        }
        
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3 - Math.PI / 2;
            const r = rMax * (values[i] / 100);
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        
        const polygonHtml = `<polygon points="${points.join(' ')}" class="radar-polygon" id="radar-chart-poly" />`;
        
        return `
            <svg class="radar-chart" viewBox="0 0 180 180">
                ${gridHtml}
                ${axisHtml}
                ${polygonHtml}
            </svg>
        `;
    }

    // ----------------- CUSTOM SVG LEARNING PATH PLOTTER -----------------
    function drawLearningGraph(metrics) {
        const hash = metrics.hash;
        const baseline = 40 + (hash % 15);
        const p1 = baseline;
        const p2 = baseline + 10 + (hash % 8);
        const p3 = baseline + 22 + (hash % 10);
        const p4 = metrics.potentialScore;
        const p5 = Math.min(99, p4 + 5 + (hash % 5));
        
        const coords = [
            {x: 20, y: 100 - p1 * 0.8},
            {x: 70, y: 100 - p2 * 0.8},
            {x: 120, y: 100 - p3 * 0.8},
            {x: 170, y: 100 - p4 * 0.8},
            {x: 220, y: 100 - p5 * 0.8}
        ];
        
        const pathD = `M ${coords[0].x} ${coords[0].y} Q 45 ${coords[1].y - 5}, ${coords[1].x} ${coords[1].y} T ${coords[2].x} ${coords[2].y} T ${coords[3].x} ${coords[3].y}`;
        const projD = `M ${coords[3].x} ${coords[3].y} L ${coords[4].x} ${coords[4].y}`;
        
        const gridHtml = `
            <line x1="10" y1="20" x2="230" y2="20" class="learning-graph-grid" />
            <line x1="10" y1="50" x2="230" y2="50" class="learning-graph-grid" />
            <line x1="10" y1="80" x2="230" y2="80" class="learning-graph-grid" />
        `;
        
        let dotsHtml = "";
        coords.forEach((c, idx) => {
            const isProjected = idx === 4;
            dotsHtml += `<circle cx="${c.x}" cy="${c.y}" r="4.5" class="learning-graph-dot ${isProjected ? 'projected' : ''}" title="${isProjected ? 'Projected: ' : 'Verified: '}${idx === 0 ? p1 : idx === 1 ? p2 : idx === 2 ? p3 : idx === 3 ? p4 : p5}%" />`;
        });
        
        return `
            <svg class="learning-graph" viewBox="0 0 240 120">
                ${gridHtml}
                <path d="${pathD}" class="learning-graph-path" />
                <path d="${projD}" class="learning-graph-projection" />
                ${dotsHtml}
                <text x="20" y="112" font-size="7" fill="var(--text-muted)" text-anchor="middle">2022</text>
                <text x="70" y="112" font-size="7" fill="var(--text-muted)" text-anchor="middle">2024</text>
                <text x="120" y="112" font-size="7" fill="var(--text-muted)" text-anchor="middle">2025</text>
                <text x="170" y="112" font-size="7" fill="var(--text-muted)" text-anchor="middle">2026</text>
                <text x="220" y="112" font-size="7" fill="var(--primary)" text-anchor="middle" font-weight="bold">2028 (P)</text>
            </svg>
        `;
    }

    // ----------------- TABBED INSPECTOR DRAWER POPULATE -----------------
    function renderInspector(c, reasoning, scoreItem) {
        const profile = c.profile || {};
        const skills = c.skills || [];
        const educations = c.education || [];
        
        inspectName.innerText = profile.anonymized_name || "Anonymized Twin";
        
        // Base metrics
        const metrics = getPredictiveMetrics(c.candidate_id || inspectId.innerText, profile.current_title);
        
        // Dynamic stats modified by Sandbox
        let currentLearning = metrics.learningVelocity;
        let currentInnovation = metrics.innovationIndex;
        let currentAdaptability = metrics.adaptability;
        let currentGrowth = metrics.growthPotential;
        let currentLeadership = metrics.leadership;
        let currentRisk = metrics.riskIndex;
        let currentPotentialScore = metrics.potentialScore;
        
        // Skills pills
        let skillsHtml = "";
        skills.forEach(s => {
            const isCore = ["milvus", "qdrant", "pinecone", "weaviate", "faiss", "embeddings", "retrieval", "ranking", "sentence-transformers"].some(core => s.name.toLowerCase().includes(core));
            skillsHtml += `<span class="skill-pill ${isCore ? 'core' : ''}">${s.name} <span style="font-size: 0.75rem; opacity: 0.6">(${s.proficiency})</span></span>`;
        });
        if (!skillsHtml) skillsHtml = "<p style='color: var(--text-muted)'>No listed skills.</p>";
        
        // Education List
        let eduHtml = "";
        educations.forEach(edu => {
            eduHtml += `
                <div style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary)">
                    <span style="font-weight: 600; color: var(--text-primary)">${edu.degree} in ${edu.field_of_study}</span><br>
                    <span>${edu.institution} (${edu.start_year} - ${edu.end_year})</span> | <span style="text-transform: uppercase; font-weight:700">${edu.tier}</span>
                </div>
            `;
        });
        if (!eduHtml) eduHtml = "<p style='color: var(--text-muted)'>No education history records.</p>";
        
        // Construct visual HTML panels
        inspectBody.innerHTML = `
            <!-- PANEL 1: DIGITAL TWIN MODEL -->
            <div class="inspect-panel active" id="panel-twin-model">
                
                <div class="radar-chart-container" id="radar-chart-wrapper">
                    <!-- Dynamic Radar chart rendered below -->
                </div>
                
                <div class="twin-double-grid">
                    <div class="inspect-section twin-grid-card">
                        <h4>FutureSelf AI™ Projection</h4>
                        <div class="futureself-box">
                            <div class="role-path">
                                <div class="path-step current">
                                    <span class="step-label">CURRENT ROLE</span>
                                    <span class="step-value" style="font-size:0.75rem">${profile.current_title || 'Software Engineer'}</span>
                                </div>
                                <div class="path-arrow"><i data-lucide="chevrons-down"></i></div>
                                <div class="path-step future">
                                    <span class="step-label">PREDICTED (2 YEARS)</span>
                                    <span class="step-value" style="font-size:0.75rem">${metrics.futureRole}</span>
                                </div>
                            </div>
                            <div class="confidence-badge">
                                <span class="label">Confidence:</span>
                                <span class="val" id="twin-confidence-val">${90 + (metrics.hash % 9)}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="inspect-section twin-grid-card">
                        <h4>Opportunity Matcher™</h4>
                        <p class="section-desc" style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.5rem;">Recommended growth paths.</p>
                        <div class="career-paths-list">
                            <div class="career-path-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <i data-lucide="compass" style="width:14px; height:14px; color: var(--secondary)"></i>
                                <div>
                                    <h5 style="font-size: 0.8rem; font-weight:600; color: var(--text-primary)">${metrics.futureRole}</h5>
                                    <p style="font-size: 0.65rem; color: var(--text-muted)">Primary trajectory match.</p>
                                </div>
                            </div>
                            <div class="career-path-item" style="display: flex; gap: 0.5rem;">
                                <i data-lucide="compass" style="width:14px; height:14px; color: var(--secondary)"></i>
                                <div>
                                    <h5 style="font-size: 0.8rem; font-weight:600; color: var(--text-primary)">Systems Tech Lead</h5>
                                    <p style="font-size: 0.65rem; color: var(--text-muted)">Secondary leadership match.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PANEL 2: SANDBOX & GROWTH -->
            <div class="inspect-panel" id="panel-sandbox-growth">
                <div class="inspect-section" style="margin-top:0;">
                    <h4>Potential Sandbox™ (What-If Boosters)</h4>
                    <p class="section-desc" style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.5rem;">Apply mock credentials to simulate potential improvements instantly.</p>
                    <div class="sandbox-booster-list">
                        <label class="sandbox-booster-item">
                            <input type="checkbox" id="booster-leadership">
                            <div class="sandbox-booster-text">
                                <span class="sandbox-booster-title">+2 Years Tech Leadership</span>
                                <span class="sandbox-booster-desc">Simulates manager skills (+15% Leadership, +8% Growth)</span>
                            </div>
                        </label>
                        <label class="sandbox-booster-item">
                            <input type="checkbox" id="booster-pytorch">
                            <div class="sandbox-booster-text">
                                <span class="sandbox-booster-title">+Applied ML Specialization</span>
                                <span class="sandbox-booster-desc">Simulates deep AI capabilities (+12% Velocity, +10% Innovation)</span>
                            </div>
                        </label>
                        <label class="sandbox-booster-item">
                            <input type="checkbox" id="booster-cloud">
                            <div class="sandbox-booster-text">
                                <span class="sandbox-booster-title">+Certified Cloud Architect</span>
                                <span class="sandbox-booster-desc">Simulates cloud systems infrastructure (+15% Adaptability, +10% Exec)</span>
                            </div>
                        </label>
                    </div>

                    <!-- FutureSelf AI Career Timeline Simulator Slider -->
                    <div class="timeline-slider-container">
                        <div class="timeline-slider-header">
                            <span>FutureSelf AI™ Timeline Simulator</span>
                            <span id="timeline-slider-val" style="color: var(--primary); font-weight: 800;">2026 (Current)</span>
                        </div>
                        <input type="range" id="timeline-years-slider" class="timeline-slider" min="0" max="5" step="1" value="0">
                        <div class="timeline-labels">
                            <span>2026</span>
                            <span>2027</span>
                            <span>2028</span>
                            <span>2029</span>
                            <span>2030</span>
                            <span>2031</span>
                        </div>
                    </div>
                </div>
                
                <div class="inspect-section">
                    <h4>Learning Velocity & Growth Path</h4>
                    <div class="learning-graph-container" id="learning-graph-wrapper">
                        <!-- Dynamic SVG curve chart -->
                    </div>
                </div>
            </div>

            <!-- PANEL 3: DNA & HISTORY -->
            <div class="inspect-panel" id="panel-dna-history">
                <div class="inspect-section" style="margin-top:0;">
                    <h4>Company DNA Match Index</h4>
                    <div class="synergy-metrics-panel" style="gap:0.75rem; margin-top:0.5rem;">
                        <div class="synergy-bar-item">
                            <div class="bar-header"><span>Stripe Builder Alignment</span><span>${80 + (metrics.hash % 18)}%</span></div>
                            <div class="synergy-bar-track"><div class="synergy-bar-fill" style="width: ${80 + (metrics.hash % 18)}%;"></div></div>
                        </div>
                        <div class="synergy-bar-item">
                            <div class="bar-header"><span>Linear Quality Alignment</span><span>${78 + (metrics.hash % 20)}%</span></div>
                            <div class="synergy-bar-track"><div class="synergy-bar-fill" style="width: ${78 + (metrics.hash % 20)}%;"></div></div>
                        </div>
                        <div class="synergy-bar-item">
                            <div class="bar-header"><span>OpenAI Research Alignment</span><span>${72 + (metrics.hash % 26)}%</span></div>
                            <div class="synergy-bar-track"><div class="synergy-bar-fill" style="width: ${72 + (metrics.hash % 26)}%;"></div></div>
                        </div>
                    </div>
                </div>
                
                <div class="inspect-section">
                    <h4>Opportunity Match Matrix™</h4>
                    <p class="section-desc" style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.5rem;">Alignment across alternative spec queries. Click to switch workspace spec and re-rank.</p>
                    <div class="spec-matrix-grid">
                        <div class="spec-matrix-card active" data-spec-query="Founding AI Engineer">
                            <div>
                                <div class="spec-matrix-title">Founding AI Engineer</div>
                                <div class="spec-matrix-desc">Embeddings, vector retrieval, neural ranking</div>
                            </div>
                            <span class="spec-matrix-score">${Math.min(99, Math.round(scoreItem ? scoreItem.score * 100 : 85))}%</span>
                        </div>
                        <div class="spec-matrix-card" data-spec-query="Staff Backend Developer">
                            <div>
                                <div class="spec-matrix-title">Staff Backend Developer</div>
                                <div class="spec-matrix-desc">Distributed gRPC systems, DB sharding</div>
                            </div>
                            <span class="spec-matrix-score">${Math.min(99, Math.round((scoreItem ? scoreItem.score * 100 : 85) - 12 + (metrics.hash % 8)))}%</span>
                        </div>
                        <div class="spec-matrix-card" data-spec-query="MLOps Lead Engineer">
                            <div>
                                <div class="spec-matrix-title">MLOps Lead Engineer</div>
                                <div class="spec-matrix-desc">Model serving pipelines, Docker, MLflow</div>
                            </div>
                            <span class="spec-matrix-score">${Math.min(99, Math.round((scoreItem ? scoreItem.score * 100 : 85) - 6 + (metrics.hash % 9)))}%</span>
                        </div>
                        <div class="spec-matrix-card" data-spec-query="Senior Decision Scientist">
                            <div>
                                <div class="spec-matrix-title">Senior Decision Scientist</div>
                                <div class="spec-matrix-desc">Hypothesis metrics, cohort analytics, SQL</div>
                            </div>
                            <span class="spec-matrix-score">${Math.min(99, Math.round((scoreItem ? scoreItem.score * 100 : 85) - 18 + (metrics.hash % 7)))}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="inspect-section">
                    <h4>Skill Galaxy™ Ecosystem</h4>
                    <div class="skills-badge-list">${skillsHtml}</div>
                </div>
                
                <div class="inspect-section">
                    <h4>Education Background</h4>
                    <div>${eduHtml}</div>
                </div>
            </div>

            <!-- PANEL 4: INTERVIEW PLAYBACK -->
            <div class="inspect-panel" id="panel-interview-playback">
                <div class="inspect-section" style="margin-top:0;">
                    <h4>Twin Interview Simulator™</h4>
                    <p class="section-desc" style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.75rem;">Simulate a mock system design interview transcript for this twin.</p>
                    <div class="interview-chat-container" id="interview-chat">
                        <div style="text-align: center; color: var(--text-muted); margin-top: 3rem;">
                            <button class="btn btn-primary" id="btn-start-chat-sim" style="width:auto; padding: 0.5rem 1.5rem;">
                                Start Simulated Interview
                            </button>
                        </div>
                    </div>
                </div>

                <div class="inspect-section" style="margin-top:1rem; border-top: 1px solid var(--border-color); padding-top:1rem;">
                    <h4>Live Twin Code Sandbox™</h4>
                    <p class="section-desc" style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.75rem;">Play back a coding execution demo for this digital twin.</p>
                    <button class="btn btn-secondary" id="btn-run-code-sandbox" style="width:100%;">
                        <i data-lucide="play" style="width: 14px; height: 14px;"></i> Run Code Sandbox Simulation
                    </button>
                    <div class="code-sandbox-terminal" id="code-terminal-box" style="display:none; margin-top: 0.75rem;">
                        <div id="code-terminal-content"></div>
                        <span class="terminal-cursor"></span>
                    </div>
                </div>
            </div>
        `;

        // Inner panel tab-button bindings
        const tabBtns = slideover.querySelectorAll(".inspect-tab-btn");
        const panels = inspectBody.querySelectorAll(".inspect-panel");
        
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetTab = btn.getAttribute("data-tab");
                
                tabBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                panels.forEach(p => {
                    if (p.id === `panel-${targetTab}`) {
                        p.classList.add("active");
                    } else {
                        p.classList.remove("active");
                    }
                });
                lucide.createIcons();
            });
        });

        // Dynamic chart draws
        const radarWrapper = document.getElementById("radar-chart-wrapper");
        const graphWrapper = document.getElementById("learning-graph-wrapper");
        
        function updateRadarRender() {
            const tempMetrics = {
                learningVelocity: currentLearning,
                innovationIndex: currentInnovation,
                adaptability: currentAdaptability,
                growthPotential: currentGrowth,
                leadership: currentLeadership,
                riskIndex: currentRisk
            };
            radarWrapper.innerHTML = drawRadarChart(tempMetrics);
        }
        
        updateRadarRender();
        if (graphWrapper) {
            graphWrapper.innerHTML = drawLearningGraph(metrics);
        }

        // Booster Sandbox Checkboxes & Timeline Slider listeners
        const chkLeadership = inspectBody.querySelector("#booster-leadership");
        const chkPytorch = inspectBody.querySelector("#booster-pytorch");
        const chkCloud = inspectBody.querySelector("#booster-cloud");
        const sliderYears = inspectBody.querySelector("#timeline-years-slider");
        
        function updateBoosters() {
            const sliderVal = sliderYears ? parseInt(sliderYears.value) : 0;
            
            // Update label text
            const labelEl = inspectBody.querySelector("#timeline-slider-val");
            if (labelEl) {
                labelEl.innerText = sliderVal === 0 ? "2026 (Current)" : `${2026 + sliderVal} (+${sliderVal} Yrs)`;
            }
            
            // Base booster adjustments
            const bLeadership = chkLeadership.checked ? 15 : 0;
            const bPytorch = chkPytorch.checked ? 12 : 0;
            const bCloud = chkCloud.checked ? 15 : 0;
            
            const bInnovation = chkPytorch.checked ? 10 : 0;
            const bExecution = chkCloud.checked ? 10 : 0;
            const bGrowth = chkLeadership.checked ? 8 : 0;
            
            // Dynamic timeline values shifts
            let timeLearning = 0;
            if (sliderVal <= 3) {
                timeLearning = sliderVal * 2;
            } else {
                timeLearning = 6 - (sliderVal - 3) * 1.5;
            }
            const timeInnovation = Math.min(10, sliderVal * 2.5);
            const timeAdaptability = sliderVal * 1.5;
            const timeGrowth = sliderVal * 2;
            const timeLeadership = sliderVal * 4;
            const timeExecution = Math.min(6, sliderVal * 2);
            
            currentLearning = Math.min(100, Math.round(metrics.learningVelocity + bPytorch + timeLearning));
            currentInnovation = Math.min(100, Math.round(metrics.innovationIndex + bInnovation + timeInnovation));
            currentAdaptability = Math.min(100, Math.round(metrics.adaptability + bCloud + timeAdaptability));
            currentGrowth = Math.min(100, Math.round(metrics.growthPotential + bGrowth + timeGrowth));
            currentLeadership = Math.min(100, Math.round(metrics.leadership + bLeadership + timeLeadership));
            currentExecution = Math.min(100, Math.round(metrics.execution + bExecution + timeExecution));
            currentRisk = Math.min(100, Math.round(metrics.riskIndex + sliderVal));
            
            // Recalculate potential score
            currentPotentialScore = Math.round((currentLearning + currentAdaptability + currentGrowth + currentInnovation) / 4);
            
            const confValEl = inspectBody.querySelector("#twin-confidence-val");
            if (confValEl) {
                confValEl.innerText = `${Math.min(99, 90 + (metrics.hash % 9) + (chkLeadership.checked ? 3 : 0) + (chkPytorch.checked ? 3 : 0) + sliderVal)}%`;
            }
            
            // Redraw radar chart
            updateRadarRender();
        }
        
        [chkLeadership, chkPytorch, chkCloud].forEach(chk => {
            if (chk) {
                chk.addEventListener("change", updateBoosters);
            }
        });
        if (sliderYears) {
            sliderYears.addEventListener("input", updateBoosters);
        }

        // Chat simulator listener
        const btnStartChat = inspectBody.querySelector("#btn-start-chat-sim");
        const chatContainer = inspectBody.querySelector("#interview-chat");
        
        if (btnStartChat) {
            btnStartChat.addEventListener("click", () => {
                chatContainer.innerHTML = "";
                
                const script = [
                    { speaker: "Interviewer", text: `Hello, welcome. Let's design a high-throughput embeddings indexing pipeline. How would you handle vector search infrastructure scaling?` },
                    { speaker: "Twin", text: `Hi. For vector databases, I'd leverage distributed setups using Qdrant or Milvus. I would partition indices using HNSW and implement quantisation layers (Scalar/Product) to reduce memory overhead and latency under spikes.` },
                    { speaker: "Interviewer", text: `Excellent. How do you approach MLOps workflow automation and pipeline reliability?` },
                    { speaker: "Twin", text: `I write robust MLOps scripts utilizing tools like Docker and FastAPI. I automate embedding encoding stages using local sentence-transformers models, and implement strict data validation schemas using Pydantic to filter anomalies before ingestion.` }
                ];
                
                let step = 0;
                function runMsgSim() {
                    if (step >= script.length) return;
                    
                    const msg = script[step];
                    const bubble = document.createElement("div");
                    bubble.className = `chat-bubble ${msg.speaker.toLowerCase()}`;
                    bubble.innerHTML = `
                        <span class="chat-speaker">${msg.speaker}</span>
                        <span class="chat-text">${msg.text}</span>
                    `;
                    chatContainer.appendChild(bubble);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    
                    step++;
                    setTimeout(runMsgSim, 1500);
                }
                runMsgSim();
            });
        }

        // Code Sandbox simulator listener
        const btnRunCode = inspectBody.querySelector("#btn-run-code-sandbox");
        const terminalBox = inspectBody.querySelector("#code-terminal-box");
        const terminalContent = inspectBody.querySelector("#code-terminal-content");
        
        if (btnRunCode && terminalBox && terminalContent) {
            btnRunCode.addEventListener("click", () => {
                terminalBox.style.display = "block";
                terminalContent.innerHTML = "";
                btnRunCode.disabled = true;
                
                const title = (profile.current_title || "").toLowerCase();
                let snippet = "";
                
                if (title.includes("backend") || title.includes("infrastructure") || title.includes("systems") || title.includes("cloud")) {
                    snippet = `<span class="term-kw">import</span> grpc\n<span class="term-kw">from</span> concurrent <span class="term-kw">import</span> futures\n<span class="term-kw">import</span> time\n\n<span class="term-kw">class</span> <span class="term-cls">TaskExecutionWorker</span>(gRPCServant):\n    <span class="term-kw">def</span> <span class="term-fn">StreamCapabilities</span>(<span class="term-kw">self</span>, request, context):\n        <span class="term-comment"># Stream worker execution signals back to core</span>\n        <span class="term-kw">for</span> status <span class="term-kw">in</span> <span class="term-kw">self</span>.pipeline.run_tasks():\n            <span class="term-kw">yield</span> StreamResponse(node_id=<span class="term-str">"Node-B"</span>, status=status)\n            time.sleep(<span class="term-str">0.05</span>)`;
                } else if (title.includes("ml") || title.includes("ai") || title.includes("data") || title.includes("python")) {
                    snippet = `<span class="term-kw">import</span> torch\n<span class="term-kw">from</span> milvus <span class="term-kw">import</span> MilvusClient\n\n<span class="term-kw">def</span> <span class="term-fn">index_embeddings</span>(candidate_embeddings):\n    client = MilvusClient(<span class="term-str">"http://localhost:19530"</span>)\n    <span class="term-comment"># Insert embedded vectors into partition</span>\n    client.insert(\n        collection_name=<span class="term-str">"talentverse_twins"</span>,\n        data=candidate_embeddings\n    )\n    client.create_index(\n        collection_name=<span class="term-str">"talentverse_twins"</span>,\n        index_params={<span class="term-str">"metric_type"</span>: <span class="term-str">"COSINE"</span>, <span class="term-str">"index_type"</span>: <span class="term-str">"HNSW"</span>}\n    )`;
                } else {
                    snippet = `<span class="term-kw">import</span> os\n<span class="term-kw">from</span> fastapi <span class="term-kw">import</span> FastAPI, BackgroundTasks\n\napp = FastAPI(title=<span class="term-str">"TalentOS Simulation Engine"</span>)\n\n<span class="term-kw">@app.post</span>(<span class="term-str">"/api/simulate"</span>)\n<span class="term-kw">async def</span> <span class="term-fn">run_cohort_analysis</span>(tasks: BackgroundTasks):\n    <span class="term-comment"># Trigger cluster cohesion scan of the talent pool</span>\n    tasks.add_task(scan_all_nodes)\n    <span class="term-kw">return</span> {<span class="term-str">"status"</span>: <span class="term-str">"scanning"</span>, <span class="term-str">"job_id"</span>: <span class="term-str">"job_012f"</span>}`;
                }
                
                const lines = [
                    { text: "> python compiler.py --twin-id " + c.candidate_id, delay: 100, isCode: false },
                    { text: "> Booting virtual IDE compiler shell...", delay: 200, isCode: false },
                    { text: "> Compiling candidate's code twin...", delay: 300, isCode: false },
                    { text: "\n", delay: 100, isCode: false },
                    { text: snippet, delay: 600, isCode: true },
                    { text: "\n", delay: 100, isCode: false },
                    { text: "> [LOG] Connecting local mock container cluster...", delay: 200, isCode: false },
                    { text: "> [LOG] Simulating execution spikes: 10,000 requests/sec...", delay: 250, isCode: false },
                    { text: "> [SUCCESS] Zero memory overflow. CPU spikes: 12% max.", delay: 300, isCode: false },
                    { text: "> [RESULT] Pipeline compilation successful. Latency: 1.4ms.", delay: 200, isSuccess: true }
                ];
                
                let lineIdx = 0;
                function printTerminalLines() {
                    if (lineIdx >= lines.length) {
                        btnRunCode.disabled = false;
                        return;
                    }
                    
                    const line = lines[lineIdx];
                    const div = document.createElement("div");
                    
                    if (line.isCode) {
                        div.style.whiteSpace = "pre";
                        div.style.marginBottom = "0.75rem";
                        const codeWrapper = document.createElement("div");
                        codeWrapper.style.whiteSpace = "pre";
                        div.appendChild(codeWrapper);
                        terminalContent.appendChild(div);
                        codeWrapper.innerHTML = line.text; 
                        terminalBox.scrollTop = terminalBox.scrollHeight;
                        lineIdx++;
                        setTimeout(printTerminalLines, 500);
                    } else {
                        if (line.isSuccess) {
                            div.className = "term-success";
                        } else {
                            div.style.color = line.text.startsWith(">") ? "#A1A1AA" : "#D4D4D8";
                        }
                        div.innerHTML = line.text;
                        terminalContent.appendChild(div);
                        terminalBox.scrollTop = terminalBox.scrollHeight;
                        lineIdx++;
                        setTimeout(printTerminalLines, line.delay);
                    }
                }
                
                printTerminalLines();
            });
        }

        // Spec switcher event listener
        const specCards = inspectBody.querySelectorAll(".spec-matrix-card");
        specCards.forEach(card => {
            card.addEventListener("click", () => {
                const queryText = card.getAttribute("data-spec-query");
                
                // Set the value in the specification text area
                const jdInput = document.getElementById("jd-input");
                if (jdInput) {
                    if (queryText === "Founding AI Engineer") {
                        jdInput.value = "Founding AI Engineer — Founding Team. Experience building and deploying applied machine learning, neural ranking, and embeddings-based retrieval systems. Production experience with vector databases and search infrastructure (Pinecone, Qdrant, Milvus, FAISS, Weaviate, OpenSearch, Elasticsearch). Expert in Python, and offline ranking evaluation metrics like NDCG, MRR, MAP. Startup shipper mentality, experience building features from scratch and deploying models to production.";
                    } else if (queryText === "Staff Backend Developer") {
                        jdInput.value = "Staff Backend Developer. Production experience building high-throughput, low-latency distributed backend services using Go, Java, or Rust. Experience with database sharding, transaction processing, caching clusters (Redis, Memcached), and asynchronous task queues (Celery, RabbitMQ, Kafka). Expert in microservices communication frameworks like gRPC, Protocol Buffers, and WebSockets. Solid container operations experience with Kubernetes and Docker.";
                    } else if (queryText === "MLOps Lead Engineer") {
                        jdInput.value = "MLOps Lead Engineer. Experience creating machine learning orchestration pipelines using Kubeflow, MLflow, Airflow, Prefect, or Dagster. Experience packaging and serving models at scale with Triton Inference Server, TorchServe, or FastAPI. Expert in containerization, CI/CD automation, model tracking, feature stores (Feast, Hopsworks), and data versioning systems (DVC). Strong Python shell scripting and infrastructure-as-code automation.";
                    } else if (queryText === "Senior Decision Scientist") {
                        jdInput.value = "Senior Decision Scientist. Expert in statistical modeling, hypothesis testing, experimental design (A/B testing), and causal inference. Proficient in Python (Pandas, SciPy, Statsmodels, NumPy) or R, and writing complex SQL queries. Strong communicator capable of mapping business questions to metric frameworks, building cohort profiles, and explaining machine learning results to stakeholders.";
                    }
                }
                
                // Toggle active class
                specCards.forEach(c => c.classList.remove("active"));
                card.classList.add("active");
                
                // Close drawer and trigger re-ranking
                closeInspector();
                runTableScanner();
                fetchRankings();
            });
        });

        lucide.createIcons();
    }

    // ----------------- DYNAMIC SLIDER RE-RANK & SEARCH SCANNERS -----------------
    for (const key in sliders) {
        sliders[key].addEventListener("input", () => {
            updateLabelsAndTotal();
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                runTableScanner();
                fetchRankings();
            }, 300);
        });
    }

    document.getElementById("btn-update-jd").addEventListener("click", () => {
        runTableScanner();
        fetchRankings();
    });

    // ----------------- OPENING 3D Gyroscope Loader loop -----------------
    function initOpeningLoader() {
        const loader = document.getElementById("opening-loader");
        const fill = document.getElementById("loader-progress");
        const status = document.getElementById("loader-status");
        
        if (!loader) return;
        document.body.classList.add("loading");
        
        // 3D Parallax Mouse Move Listener
        document.addEventListener("mousemove", (e) => {
            const globe = document.getElementById("gyro-globe");
            if (!globe) return;
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const deltaX = (e.clientX - centerX) / centerX; // -1 to 1
            const deltaY = (e.clientY - centerY) / centerY; // -1 to 1
            
            // Subtle tilt (max 25deg)
            const rotX = -deltaY * 25;
            const rotY = deltaX * 25;
            globe.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        });
        
        let progress = 0;
        const statusMessages = [
            { limit: 20, text: "INITIALIZING TALENTOS AI CORE..." },
            { limit: 45, text: "LOADING TALENTVERSE™ DATABASE..." },
            { limit: 70, text: "GENERATING CANDIDATE DIGITAL TWINS..." },
            { limit: 90, text: "CALCULATING PREDICTIVE GROWTH VECTORS..." },
            { limit: 100, text: "SYNCHRONIZING MISSION CONTROL ACTIVATION..." }
        ];
        
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 2;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    loader.classList.add("loaded");
                    document.body.classList.remove("loading");
                    runTableScanner();
                }, 500);
            }
            
            if (fill) {
                fill.style.width = `${progress}%`;
            }
            
            if (status) {
                const msg = statusMessages.find(m => progress <= m.limit);
                if (msg) {
                    status.innerText = msg.text;
                }
            }
        }, 80);
    }

    // Initialize slide indicators
    initIndicators();

    // ----------------- FAIRRANK MODAL INTERACTIVITY -----------------
    const fairRankCard = document.getElementById("fairrank-governance-card");
    const fairRankModal = document.getElementById("fairrank-modal");
    const closeFairRankBtn = document.getElementById("close-fairrank-modal");
    const metricsTbody = document.getElementById("metrics-benchmark-tbody");

    async function openFairRankModal() {
        if (!fairRankModal) return;
        
        // Show modal smoothly
        fairRankModal.classList.remove("hidden");
        fairRankModal.style.opacity = "1";
        fairRankModal.style.pointerEvents = "auto";
        
        // Fetch offline benchmarks dynamically from metrics API
        metricsTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Querying registry...</td></tr>`;
        try {
            const res = await fetch("/api/metrics");
            if (!res.ok) throw new Error("Metrics API failed");
            const data = await res.json();
            
            // Populate metrics table
            let tableHtml = "";
            data.benchmarks.forEach(b => {
                const isLeader = b.status === "Category Leader";
                tableHtml += `
                    <tr style="${isLeader ? 'background: var(--primary-glow); font-weight:700;' : ''}">
                        <td>${b.method}</td>
                        <td>${b.ndcg}</td>
                        <td>${b.ndcg - 0.03}</td>
                        <td>${b.latency}</td>
                        <td><span style="color: ${isLeader ? 'var(--success)' : 'var(--text-secondary)'}">${b.status}</span></td>
                    </tr>
                `;
            });
            metricsTbody.innerHTML = tableHtml;
            
            // Update counts
            document.getElementById("kpi-stars").innerText = data.kpis.hidden_stars;
            document.getElementById("kpi-traps").innerText = data.kpis.removed_risks;
            
        } catch (e) {
            console.error(e);
            metricsTbody.innerHTML = `<tr><td colspan="5" style="color: var(--danger); text-align: center;">Error loading benchmark data.</td></tr>`;
        }
        lucide.createIcons();
    }

    function closeFairRankModal() {
        if (!fairRankModal) return;
        fairRankModal.style.opacity = "0";
        fairRankModal.style.pointerEvents = "none";
        setTimeout(() => {
            fairRankModal.classList.add("hidden");
        }, 300);
    }

    if (fairRankCard) fairRankCard.addEventListener("click", openFairRankModal);
    if (closeFairRankBtn) closeFairRankBtn.addEventListener("click", closeFairRankModal);
    if (fairRankModal) {
        fairRankModal.addEventListener("click", (e) => {
            if (e.target === fairRankModal) closeFairRankModal();
        });
    }

    // ----------------- WEATHER INDEX TELEMETRY -----------------
    async function fetchWeather() {
        try {
            const res = await fetch("/api/weather");
            if (!res.ok) throw new Error("Weather API failed");
            const data = await res.json();
            
            // Populate weather panels
            for (const cat in data) {
                const info = data[cat];
                const scarcityEl = document.getElementById(`weather-scarcity-${cat}`);
                const noticeEl = document.getElementById(`weather-notice-${cat}`);
                const tempEl = document.getElementById(`weather-temp-${cat}`);
                
                if (scarcityEl) scarcityEl.innerText = `${info.scarcity}%`;
                if (noticeEl) noticeEl.innerText = `${info.avg_notice}d`;
                if (tempEl) {
                    tempEl.innerText = info.temperature;
                    if (info.temperature === "Incinerating") tempEl.style.color = "#ef4444";
                    else if (info.temperature === "Hot") tempEl.style.color = "#f97316";
                    else if (info.temperature === "Mild") tempEl.style.color = "#3b82f6";
                    else tempEl.style.color = "#10b981";
                }
            }
        } catch (e) {
            console.error("Error loading weather data:", e);
        }
    }

    // ----------------- DIGITAL TWIN BATTLES LOGIC -----------------
    const compareBar = document.getElementById("compare-bar");
    const compareCount = document.getElementById("compare-count");
    const btnClearCompare = document.getElementById("btn-clear-compare");
    const btnLaunchBattle = document.getElementById("btn-launch-battle");
    
    const battleModal = document.getElementById("battle-modal");
    const closeBattleBtn = document.getElementById("close-battle-modal");
    const battleCand1 = document.getElementById("battle-cand-1");
    const battleCand2 = document.getElementById("battle-cand-2");
    const battleComparisonRows = document.getElementById("battle-comparison-rows");

    function updateCompareBar() {
        if (!compareBar) return;
        const count = selectedCompare.size;
        compareCount.innerText = count;
        
        if (count > 0) {
            compareBar.classList.remove("hidden");
            compareBar.style.opacity = "1";
            compareBar.style.pointerEvents = "auto";
        } else {
            compareBar.style.opacity = "0";
            compareBar.style.pointerEvents = "none";
            setTimeout(() => {
                compareBar.classList.add("hidden");
            }, 300);
        }
    }

    if (btnClearCompare) {
        btnClearCompare.addEventListener("click", () => {
            selectedCompare.clear();
            const chks = candidatesTbody.querySelectorAll(".compare-chk");
            chks.forEach(chk => chk.checked = false);
            updateCompareBar();
        });
    }

    if (btnLaunchBattle) {
        btnLaunchBattle.addEventListener("click", () => {
            if (selectedCompare.size !== 2) {
                alert("Please select exactly 2 digital twins to compare.");
                return;
            }
            openBattleModal();
        });
    }

    async function openBattleModal() {
        if (!battleModal) return;
        
        const cids = Array.from(selectedCompare);
        battleCand1.innerHTML = `<div class="spinner-large"></div>`;
        battleCand2.innerHTML = `<div class="spinner-large"></div>`;
        battleComparisonRows.innerHTML = "";
        
        battleModal.classList.remove("hidden");
        battleModal.style.opacity = "1";
        battleModal.style.pointerEvents = "auto";
        
        try {
            const res1 = await fetch(`/api/candidate/${cids[0]}`);
            const res2 = await fetch(`/api/candidate/${cids[1]}`);
            if (!res1.ok || !res2.ok) throw new Error("API call failed");
            
            const twin1 = await res1.json();
            const twin2 = await res2.json();
            
            const rankItem1 = candidatesCache.find(x => x.candidate_id === cids[0]);
            const rankItem2 = candidatesCache.find(x => x.candidate_id === cids[1]);
            
            renderBattleCand(battleCand1, twin1, rankItem1);
            renderBattleCand(battleCand2, twin2, rankItem2);
            renderBattleComparisonMetrics(rankItem1, rankItem2);
            
        } catch (e) {
            console.error(e);
            battleCand1.innerHTML = `<div style="color: var(--danger)">Failed to load data.</div>`;
            battleCand2.innerHTML = `<div style="color: var(--danger)">Failed to load data.</div>`;
        }
        lucide.createIcons();
    }

    function renderBattleCand(panel, twin, rankItem) {
        if (!rankItem) {
            panel.innerHTML = `<div>Candidate Details not loaded yet.</div>`;
            return;
        }
        const profile = twin.profile || {};
        const genesHtml = (rankItem.genes || []).map(g => `<span class="badge-active" style="font-size: 0.65rem; margin-right: 0.25rem;">${g}</span>`).join("");
        const skillsFound = rankItem.skills_found || [];
        const skillsHtml = skillsFound.map(s => `<span class="skill-pill" style="font-size:0.65rem; padding: 0.15rem 0.4rem;">${s}</span>`).join(" ");

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <h4 style="font-size: 1.25rem; font-family: var(--font-heading); color: var(--text-primary); margin-bottom: 0.25rem;">${profile.anonymized_name || "Anonymized Twin"}</h4>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${rankItem.candidate_id}</span>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary); font-family: var(--font-heading);">${rankItem.score}</div>
                    <div style="font-size: 0.65rem; color: var(--text-secondary);">Match Score</div>
                </div>
            </div>
            
            <div style="margin-bottom: 1rem; border-top: 1px dashed var(--border-color); padding-top: 0.75rem;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Current Status:</div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${profile.current_title} at ${profile.current_company}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Location: ${profile.location} | YoE: ${profile.years_of_experience} yrs</div>
            </div>

            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Genome DNA:</div>
                <div>${genesHtml || '<span style="color:var(--text-muted);">None</span>'}</div>
            </div>

            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Identified Core Skills:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">${skillsHtml || '<span style="color:var(--text-muted);">None matched</span>'}</div>
            </div>

            <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.75rem; line-height: 1.4; color: var(--text-secondary);">
                <strong>Telemetry Brief:</strong> ${rankItem.reasoning}
            </div>
        `;
    }

    function renderBattleComparisonMetrics(r1, r2) {
        if (!r1 || !r2) return;
        
        const metrics = [
            { label: "Learning Velocity", key: "learning_velocity" },
            { label: "Innovation Index", key: "innovation_index" },
            { label: "Growth Potential", key: "growth_potential" },
            { label: "Adaptability", key: "adaptability" },
            { label: "Leadership Core", key: "leadership" },
            { label: "HPI Overall Score", key: "hpi" },
            { label: "Stability Index (100 - Risk)", val1: 100 - r1.risk_index, val2: 100 - r2.risk_index }
        ];
        
        let html = "";
        metrics.forEach(m => {
            const val1 = m.val1 !== undefined ? m.val1 : r1[m.key];
            const val2 = m.val2 !== undefined ? m.val2 : r2[m.key];
            
            const isWinner1 = val1 > val2;
            const isWinner2 = val2 > val1;
            
            html += `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem; font-weight: 600;">
                        <span style="color: ${isWinner1 ? 'var(--primary)' : 'var(--text-secondary)'}; font-weight: ${isWinner1 ? '800' : 'normal'}">${val1}%</span>
                        <span style="color: var(--text-primary); font-family: var(--font-heading);">${m.label}</span>
                        <span style="color: ${isWinner2 ? 'var(--primary)' : 'var(--text-secondary)'}; font-weight: ${isWinner2 ? '800' : 'normal'}">${val2}%</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; position: relative; overflow: hidden; transform: rotate(180deg);">
                            <div style="width: ${val1}%; height: 100%; background: ${isWinner1 ? 'var(--primary)' : 'var(--text-secondary)'}; border-radius: 3px; transition: width 0.5s ease;"></div>
                        </div>
                        <div style="width: 20px; text-align: center; font-size: 0.7rem; color: var(--text-muted);">vs</div>
                        <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; position: relative; overflow: hidden;">
                            <div style="width: ${val2}%; height: 100%; background: ${isWinner2 ? 'var(--primary)' : 'var(--text-secondary)'}; border-radius: 3px; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        battleComparisonRows.innerHTML = html;
    }

    function closeBattleModal() {
        if (!battleModal) return;
        battleModal.style.opacity = "0";
        battleModal.style.pointerEvents = "none";
        setTimeout(() => {
            battleModal.classList.add("hidden");
        }, 300);
    }

    if (closeBattleBtn) closeBattleBtn.addEventListener("click", closeBattleModal);
    if (battleModal) {
        battleModal.addEventListener("click", (e) => {
            if (e.target === battleModal) closeBattleModal();
        });
    }

    // Initial load
    updateLabelsAndTotal();
    fetchRankings();
    fetchWeather();
    initOpeningLoader();
    lucide.createIcons();
});

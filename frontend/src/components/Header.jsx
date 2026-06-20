import React from 'react';

export default function Header({ isLight, onToggleTheme }) {
  return (
    <header className="app-header">
        <div className="header-left">
            <div className="logo-box">
                <img src="/logo.png" alt="TalentOS AI Logo" className="logo-img" style={{ width: '32px', height: '32px' }} />
                <h1>TalentOS <span className="logo-ai">AI</span></h1>
            </div>
            <div className="divider"></div>
            <p className="tagline">The Digital Twin of Human Potential</p>
        </div>
        <div className="header-right">
            <label className="stretchy-toggle" title="Toggle Light/Dark Theme" aria-label="Toggle Theme">
                <input 
                  type="checkbox" 
                  checked={isLight} 
                  onChange={onToggleTheme} 
                  aria-label="Theme toggle switch" 
                />
                <span className="toggle-track" aria-hidden="true">
                    <span className="toggle-knob"></span>
                </span>
            </label>
            <div className="divider"></div>
            <div className="status-chip">
                <span className="pulse-dot"></span>
                <span>TALENT MISSION CONTROL ACTIVE</span>
            </div>
        </div>
    </header>
  );
}

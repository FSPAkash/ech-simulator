import React from 'react';
import './ScenarioDescription.css';

const ScenarioDescription = ({ scenario }) => {
    if (!scenario) {
        return (
            <div className="scenario-description empty">
                <p>Select a scenario to view details</p>
            </div>
        );
    }

    const formatRegion = (r) => {
        const map = { 
            us: 'Americas', 
            eu: 'Europe', 
            asia: 'Asia Pacific', 
            china: 'China', 
            all: 'All Regions' 
        };
        return map[r] || r.toUpperCase();
    };

    return (
        <div className="scenario-description">
            <div className="desc-header">
                <div className="desc-title">
                    <h2>{scenario.name}</h2>
                    <span className={`category-tag cat-${scenario.category}`}>
                        {scenario.category}
                    </span>
                </div>
                <span className="scenario-num">#{scenario.id}</span>
            </div>

            <p className="desc-text">{scenario.description}</p>

            <div className="info-block">
                <h4>Affected Regions</h4>
                <div className="region-list">
                    {(scenario.affected_regions || ['all']).map(r => (
                        <span key={r} className="region-chip">{formatRegion(r)}</span>
                    ))}
                </div>
            </div>

            <div className="info-block">
                <h4>Adjustable Parameters</h4>
                <p className="param-hint">Use the controls to adjust scenario intensity</p>
            </div>
        </div>
    );
};

export default ScenarioDescription;
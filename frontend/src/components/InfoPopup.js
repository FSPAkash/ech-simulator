import React, { useState } from 'react';
import './InfoPopup.css';

const InfoPopup = ({ info }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!info) return null;

    return (
        <div className="info-popup-container">
            <button 
                className="info-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="View calculation details"
            >
                i
            </button>
            
            {isOpen && (
                <>
                    <div className="info-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="info-popup">
                        <div className="info-header">
                            <h4>{info.title}</h4>
                            <button className="info-close" onClick={() => setIsOpen(false)}>
                                &times;
                            </button>
                        </div>
                        
                        <div className="info-content">
                            <div className="info-section">
                                <h5>Formula</h5>
                                <code className="formula">{info.formula}</code>
                            </div>

                            <div className="info-section">
                                <h5>Parameters</h5>
                                <div className="params-grid">
                                    {Object.entries(info.parameters_explained || {}).map(([key, param]) => (
                                        <div key={key} className="param-explain">
                                            <div className="param-name">{key.replace(/_/g, ' ')}</div>
                                            <div className="param-details">
                                                <span className="param-desc">{param.description}</span>
                                                <span className="param-default">Default: {param.default}</span>
                                                <span className="param-range">Range: {param.range}</span>
                                                <span className="param-effect">{param.effect}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="info-section">
                                <h5>Regional Weights</h5>
                                <div className="weights-grid">
                                    {Object.entries(info.regional_weights || {}).map(([region, weight]) => (
                                        <div key={region} className="weight-item">
                                            <span className="weight-region">
                                                {region.replace('_ech', '').toUpperCase()}
                                            </span>
                                            <span className="weight-value">{weight}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {info.example && (
                                <div className="info-section">
                                    <h5>Example</h5>
                                    <div className="example-box">{info.example}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default InfoPopup;
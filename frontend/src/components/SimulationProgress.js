import React from 'react';
import './SimulationProgress.css';

const SimulationProgress = ({ isVisible, currentStep }) => {
    if (!isVisible) return null;

    const steps = [
        { id: 1, label: 'Running Simulation', description: 'Applying scenario parameters' },
        { id: 2, label: 'Updating Forecasts', description: 'Generating predictions' }
    ];

    return (
        <div className="simulation-progress-overlay">
            <div className="simulation-progress-modal">
                <div className="progress-header">
                    <div className="progress-spinner"></div>
                    <h3>Processing</h3>
                </div>
                
                <div className="progress-steps">
                    {steps.map((step) => {
                        let stepClass = 'progress-step';
                        if (currentStep > step.id) {
                            stepClass += ' completed';
                        } else if (currentStep === step.id) {
                            stepClass += ' active';
                        }
                        
                        return (
                            <div key={step.id} className={stepClass}>
                                <div className="step-indicator">
                                    {currentStep > step.id ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    ) : (
                                        <span>{step.id}</span>
                                    )}
                                </div>
                                <div className="step-content">
                                    <span className="step-label">{step.label}</span>
                                    <span className="step-description">{step.description}</span>
                                </div>
                                {currentStep === step.id && (
                                    <div className="step-loader"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div className="progress-footer">
                    <span>Please wait...</span>
                </div>
            </div>
        </div>
    );
};

export default SimulationProgress;
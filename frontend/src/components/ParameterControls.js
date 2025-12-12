import React, { useState, useEffect, useRef } from 'react';
import './ParameterControls.css';

const ParameterControls = ({ 
  scenario, 
  onParamsChange,
  onRunSimulation,
  isSimulating
}) => {
  const [localParams, setLocalParams] = useState({});
  const [originalParams, setOriginalParams] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const scenarioIdRef = useRef(null);

  // Get parameter info from scenario
  const getParamInfo = (paramName) => {
    const mathInfo = scenario?.math_info?.parameters_explained?.[paramName];
    if (mathInfo) return mathInfo;
    return null;
  };

  // Parameter configs (ranges)
  const paramRanges = {
    demand_growth_rate: { min: 0, max: 0.10, step: 0.005, format: 'percent' },
    duration_months: { min: 6, max: 48, step: 6, format: 'number' },
    price_elasticity: { min: 0.2, max: 1.2, step: 0.1, format: 'decimal' },
    apac_growth_premium: { min: 0, max: 0.05, step: 0.005, format: 'percent' },
    global_spillover: { min: 0, max: 0.6, step: 0.05, format: 'percent' },
    bio_adoption_rate: { min: 0, max: 0.08, step: 0.01, format: 'percent' },
    glycerine_cost_factor: { min: 0.5, max: 2.0, step: 0.1, format: 'multiplier' },
    epoxy_demand_growth: { min: 0, max: 0.15, step: 0.01, format: 'percent' },
    infrastructure_boost: { min: 0, max: 0.10, step: 0.01, format: 'percent' },
    glycerine_share_change: { min: -0.2, max: 0.3, step: 0.05, format: 'percent' },
    propylene_price_change: { min: -0.2, max: 0.3, step: 0.05, format: 'percent' },
    glycerine_price_change: { min: -0.2, max: 0.3, step: 0.05, format: 'percent' },
    supply_reduction: { min: 0, max: 0.30, step: 0.02, format: 'percent' },
    compliance_cost: { min: 0, max: 0.25, step: 0.02, format: 'percent' },
    glycerine_cost_advantage: { min: 0, max: 0.30, step: 0.02, format: 'percent' },
    competitive_intensity: { min: 0.2, max: 1.0, step: 0.1, format: 'percent' },
    capacity_offline: { min: 0.02, max: 0.25, step: 0.02, format: 'percent' },
    disruption_severity: { min: 0.05, max: 0.40, step: 0.05, format: 'percent' },
    recovery_months: { min: 1, max: 12, step: 1, format: 'number' },
    capacity_addition: { min: 0.05, max: 0.30, step: 0.05, format: 'percent' },
    ramp_up_months: { min: 3, max: 12, step: 1, format: 'number' },
    isolation_factor: { min: 0.3, max: 0.9, step: 0.1, format: 'percent' },
    competitive_pressure: { min: 0, max: 0.20, step: 0.02, format: 'percent' },
    capacity_reduction: { min: 0, max: 0.25, step: 0.02, format: 'percent' },
    import_dependency: { min: 0, max: 0.40, step: 0.05, format: 'percent' },
    feedstock_pressure: { min: 0, max: 0.20, step: 0.02, format: 'percent' },
    shutdown_impact: { min: 0, max: 0.15, step: 0.01, format: 'percent' },
    price_discount: { min: 0.02, max: 0.20, step: 0.02, format: 'percent' },
    market_share_target: { min: 0, max: 0.15, step: 0.01, format: 'percent' },
    supply_constraint: { min: 0.05, max: 0.30, step: 0.02, format: 'percent' },
    pricing_power: { min: 0.3, max: 1.0, step: 0.1, format: 'percent' },
    output_stability: { min: 0.7, max: 1.0, step: 0.05, format: 'percent' },
    price_volatility_reduction: { min: 0, max: 0.5, step: 0.05, format: 'percent' },
  };

  useEffect(() => {
    if (scenario && scenario.id !== scenarioIdRef.current) {
      scenarioIdRef.current = scenario.id;
      const numericParams = {};
      Object.entries(scenario.parameters || {}).forEach(([key, value]) => {
        if (typeof value === 'number') {
          numericParams[key] = value;
        }
      });
      setLocalParams(numericParams);
      setOriginalParams(numericParams);
      setHasChanges(false);
    }
  }, [scenario?.id]);

  const handleChange = (name, value) => {
    const numValue = parseFloat(value);
    setLocalParams(prev => {
      const updated = { ...prev, [name]: numValue };
      setHasChanges(Object.keys(updated).some(k => Math.abs(updated[k] - originalParams[k]) > 0.0001));
      return updated;
    });
  };

  const handleRun = () => {
    onParamsChange(localParams);
    setTimeout(() => onRunSimulation(), 10);
  };

  const handleReset = () => {
    setLocalParams({ ...originalParams });
    setHasChanges(false);
  };

  const formatValue = (val, format) => {
    if (val === undefined) return '-';
    switch (format) {
      case 'percent': return `${(val * 100).toFixed(0)}%`;
      case 'number': return `${Math.round(val)}`;
      case 'multiplier': return `${val.toFixed(1)}x`;
      default: return val.toFixed(2);
    }
  };

  const getRange = (name) => paramRanges[name] || { min: 0, max: 1, step: 0.1, format: 'decimal' };

  if (!scenario) {
    return <div className="param-controls empty"><p>Select a scenario</p></div>;
  }

  return (
    <div className="param-controls">
      <div className="param-header">
        <span>Adjust Parameters</span>
        <div className="param-buttons">
          <button className="btn-reset" onClick={handleReset} disabled={!hasChanges || isSimulating}>
            Reset
          </button>
          <button 
            className={`btn-run ${hasChanges ? 'changed' : ''}`} 
            onClick={handleRun} 
            disabled={isSimulating}
          >
            {isSimulating ? '...' : '▶ Run'}
          </button>
        </div>
      </div>

      {hasChanges && <div className="param-notice">Parameters Adjusted, Reset for Default Values</div>}

      <div className="param-list">
        {Object.entries(localParams).map(([name, value]) => {
          const range = getRange(name);
          const info = getParamInfo(name);
          const isChanged = Math.abs(value - originalParams[name]) > 0.0001;
          
          return (
            <div key={name} className={`param-item ${isChanged ? 'changed' : ''}`}>
              <div className="param-row">
                <label>
                  {name.replace(/_/g, ' ')}
                  {info && (
                    <span className="param-hint" title={info.effect}>ⓘ</span>
                  )}
                </label>
                <span className="param-val">{formatValue(value, range.format)}</span>
              </div>
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(e) => handleChange(name, e.target.value)}
                disabled={isSimulating}
              />
              {info && <div className="param-effect">{info.effect}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParameterControls;
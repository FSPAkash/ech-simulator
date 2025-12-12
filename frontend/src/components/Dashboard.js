import React, { useState, useEffect, useCallback, useRef } from 'react';
import ScenarioSelector from './ScenarioSelector';
import ParameterControls from './ParameterControls';
import PriceChart from './PriceChart';
import RegionalComparison from './RegionalComparison';
import DataTable from './DataTable';
import ForecastTable from './ForecastTable';
import InfoPopup from './InfoPopup';
import { getScenarios, getBaselineData, runSimulation, getCategories } from '../services/api';
import './Dashboard.css';
import SimulationProgress from './SimulationProgress';

const Dashboard = ({user, onLogout}) => {
    const [scenarios, setScenarios] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [baselineData, setBaselineData] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [activeView, setActiveView] = useState('chart');
    const [error, setError] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [justSimulated, setJustSimulated] = useState(false);
    const [simulationStep, setSimulationStep] = useState(0);
    const [showProgress, setShowProgress] = useState(false);
    
    const paramsRef = useRef({});

    // Load initial data
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [scenariosRes, baselineRes, categoriesRes] = await Promise.all([
                    getScenarios(),
                    getBaselineData(),
                    getCategories()
                ]);
                setScenarios(scenariosRes.data.scenarios);
                setBaselineData(baselineRes.data);
                setCategories(categoriesRes.data.categories);
            } catch (err) {
                setError('Failed to connect to server on port 5000');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Run simulation
    const runSim = async (scenarioId, params, isManualRun = false) => {
        try {
            setSimulating(true);
            setError(null);
            
            // Show progress popup only for manual runs
            if (isManualRun) {
                setShowProgress(true);
                setSimulationStep(1);
            }
            
            const response = await runSimulation(scenarioId, params);
            
            // Step 2: Updating Forecasts
            if (isManualRun) {
                setSimulationStep(2);
                // Small delay to show the second step
                await new Promise(resolve => setTimeout(resolve, 600));
            }
            
            setResult(response.data);
            
            // Close progress popup
            if (isManualRun) {
                await new Promise(resolve => setTimeout(resolve, 400));
                setShowProgress(false);
                setSimulationStep(0);
                
                setJustSimulated(true);
                setTimeout(() => {
                    setJustSimulated(false);
                }, 5000);
            }
        } catch (err) {
            setError('Simulation failed');
            setShowProgress(false);
            setSimulationStep(0);
        } finally {
            setSimulating(false);
        }
    };

    // Handle scenario selection
    const handleScenarioSelect = useCallback((scenario) => {
        setSelectedScenario(scenario);
        setResult(null);
        paramsRef.current = {};
        setSidebarCollapsed(true);
        setJustSimulated(false);
        runSim(scenario.id, null, false);
    }, []);

    // Handle parameter changes
    const handleParamsChange = useCallback((params) => {
        paramsRef.current = params;
    }, []);

    // Handle run simulation
    const handleRunSimulation = useCallback(() => {
        if (!selectedScenario) return;
        const params = Object.keys(paramsRef.current).length > 0 ? paramsRef.current : null;
        runSim(selectedScenario.id, params, true);
    }, [selectedScenario]);

    // Toggle sidebar
    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // Get region display names
    const getRegionName = (r) => ({ 
        us_ech: 'AMER', 
        eu_ech: 'EUR', 
        asia_ech: 'ASIA', 
        china_ech: 'CHN' 
    }[r] || r);

    // Get year range from baseline data
    const getYearRange = () => {
        const dates = baselineData?.dates;
        if (!dates || dates.length === 0) return '';
        const years = [...new Set(dates.map(d => new Date(d).getFullYear()))].sort();
        if (years.length === 1) {
            return `Avg ${years[0]}`;
        }
        return `Avg ${years[0]} - ${years[years.length - 1]}`;
    };


    // Check if region is affected
    const isRegionAffected = (region) => {
        const affectedRegions = selectedScenario?.affected_regions || [];
        if (affectedRegions.includes('all')) return true;
        
        const regionMap = {
            'us_ech': ['us', 'amer', 'americas'],
            'eu_ech': ['eu', 'europe', 'eur'],
            'asia_ech': ['asia', 'apac'],
            'china_ech': ['china', 'chn']
        };
        
        const regionAliases = regionMap[region] || [];
        return affectedRegions.some(r => 
            regionAliases.includes(r.toLowerCase()) || 
            region.toLowerCase().includes(r.toLowerCase())
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Error state
    if (error && !baselineData) {
        return (
            <div className="error-screen">
                <h2>Connection Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="header">
                {/* Seamless particle flow */}
                <div className="particle-flow"></div>
                
                <div className="header-left">
                    <h1>Price Scenario Simulator</h1>
                    <p>Epichlorohydrin Market Analysis and Forecasting</p>
                </div>
                <div className="header-right">
                    <div className="header-stat">
                        <span className="stat-value">{scenarios.length}</span>
                        <span className="stat-label">Scenarios</span>
                    </div>
                    <div className="header-stat">
                        <span className="stat-value">{baselineData?.dates?.length || 0}</span>
                        <span className="stat-label">Months</span>
                    </div>
                    <div className="header-stat">
                        <span className="stat-value">4</span>
                        <span className="stat-label">Regions</span>
                    </div>
                    
                    {/* User Section */}
                    <div className="header-user">
                        <div className="user-info">
                            <div className="user-avatar">
                                {user?.initials || 'U'}
                            </div>

                        </div>
                        <button className="logout-button" onClick={onLogout} title="Sign out">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className={`main-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-inner">
                        <ScenarioSelector
                            scenarios={scenarios}
                            selectedScenario={selectedScenario}
                            onScenarioSelect={handleScenarioSelect}
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            isCollapsed={sidebarCollapsed}
                            onToggleCollapse={handleToggleSidebar}
                        />
                    </div>
                </aside>

            {/*Simulation Progress Popup */}
                        <SimulationProgress 
                            isVisible={showProgress} 
                            currentStep={simulationStep} 
                        />

                {/* Main Content */}
                <main className="main-content">
                    {/* Empty State */}
                    {!selectedScenario && (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <rect x="8" y="16" width="48" height="32" rx="4" stroke="#d1d1d6" strokeWidth="2"/>
                                    <path d="M8 28H56" stroke="#d1d1d6" strokeWidth="2"/>
                                    <circle cx="16" cy="22" r="2" fill="#d1d1d6"/>
                                    <circle cx="24" cy="22" r="2" fill="#d1d1d6"/>
                                    <path d="M16 36L24 40L32 34L40 42L48 36" stroke="#d1d1d6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2>Select a Scenario</h2>
                            <p>Choose a scenario from the list to begin price simulation</p>
                        </div>
                    )}

                    {/* Active Simulation */}
                    {selectedScenario && (
                        <>
                            {/* Scenario Banner */}
                            <div className="scenario-banner">
                                <div className="banner-info">
                                    <div className="banner-title">
                                        <span className="banner-number">#{selectedScenario.id}</span>
                                        <h2>{selectedScenario.name}</h2>
                                        <InfoPopup info={selectedScenario.math_info} />
                                    </div>
                                    <p className="banner-description">{selectedScenario.description}</p>
                                </div>
                                <div className={`banner-category cat-${selectedScenario.category}`}>
                                    {selectedScenario.category}
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="content-grid">
                                {/* Left: Parameters */}
                                <div className="params-panel">
                                    <div className="params-panel-inner">
                                        <ParameterControls
                                            scenario={selectedScenario}
                                            onParamsChange={handleParamsChange}
                                            onRunSimulation={handleRunSimulation}
                                            isSimulating={simulating}
                                        />
                                    </div>
                                </div>

                                {/* Right: Results */}
                                <div className="results-panel">
                                    {/* Results Section */}
                                    {result ? (
                                        <div className="results-section">
                                            <div className="results-header">
                                                <h4>
                                                    Simulation Results
                                                    <span className="results-year-tag">{getYearRange()}</span>
                                                </h4>
                                                {justSimulated && (
                                                    <div className="results-legend">
                                                        <span className="legend-item affected-legend">
                                                            <span className="legend-dot pulsing"></span>
                                                            Affected Regions
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="results-cards">
                                                {['us_ech', 'eu_ech', 'asia_ech', 'china_ech'].map(region => {
                                                    const m = result.metrics?.[region];
                                                    if (!m) return null;
                                                    
                                                    const isAffected = isRegionAffected(region);
                                                    const isSignificant = Math.abs(m.change_percent) > 2;
                                                    const isPositive = m.change_percent >= 0;
                                                    
                                                    let cardClass = 'result-card';
                                                    if (isAffected) cardClass += ' affected';
                                                    if (isPositive) cardClass += ' positive';
                                                    else cardClass += ' negative';
                                                    if (isSignificant && justSimulated) cardClass += ' significant';
                                                    if (justSimulated) cardClass += ' just-simulated';
                                                    
                                                    return (
                                                        <div key={region} className={cardClass}>
                                                            <div className="card-region">{getRegionName(region)}</div>
                                                            <div className={`card-change ${isPositive ? 'up' : 'down'}`}>
                                                                {isPositive ? '↑ ' : '↓ '}{Math.abs(m.change_percent).toFixed(1)}%
                                                            </div>
                                                            <div className="card-prices">
                                                                <span>${m.baseline_avg.toFixed(2)}</span>
                                                                <span className="arrow">-</span>
                                                                <span>${m.simulated_avg.toFixed(2)}</span>
                                                            </div>
                                                            {isAffected && justSimulated && (
                                                                <div className="affected-indicator"></div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="results-loading">
                                            <div className="spinner"></div>
                                        </div>
                                    )}

                                    {/* View Tabs */}
                                    <div className="view-tabs">
                                        <button 
                                            className={activeView === 'chart' ? 'active' : ''}
                                            onClick={() => setActiveView('chart')}
                                        >
                                            Chart
                                        </button>
                                        <button 
                                            className={activeView === 'analysis' ? 'active' : ''}
                                            onClick={() => setActiveView('analysis')}
                                        >
                                            Analysis
                                        </button>
                                        <button 
                                            className={activeView === 'data' ? 'active' : ''}
                                            onClick={() => setActiveView('data')}
                                        >
                                            Simulation Data
                                        </button>
                                        <button 
                                            className={activeView === 'forecast' ? 'active' : ''}
                                            onClick={() => setActiveView('forecast')}
                                        >
                                            Forecast
                                        </button>
                                    </div>

                                    {/* View Panel */}
                                    <div className="view-panel">
                                        {simulating && (
                                            <div className="view-loading">
                                                <div className="spinner"></div>
                                            </div>
                                        )}

                                        {!simulating && activeView === 'chart' && baselineData && (
                                            <PriceChart
                                                dates={baselineData.dates}
                                                baselinePrices={baselineData.prices}
                                                simulatedPrices={result?.simulated_prices}
                                                forecast={result?.forecast}
                                                showForecast={!!result}
                                            />
                                        )}

                                        {!simulating && activeView === 'analysis' && result && (
                                            <RegionalComparison 
                                                metrics={result.metrics} 
                                                dates={baselineData?.dates}
                                            />
                                        )}

                                        {!simulating && activeView === 'data' && baselineData && (
                                            <DataTable
                                                dates={baselineData.dates}
                                                baselinePrices={baselineData.prices}
                                                simulatedPrices={result?.simulated_prices}
                                                metrics={result?.metrics}
                                            />
                                        )}

                                        {!simulating && activeView === 'forecast' && (
                                            <ForecastTable
                                                forecast={result?.forecast}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;

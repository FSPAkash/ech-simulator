import React, { useState } from 'react';
import './ScenarioSelector.css';

const ScenarioSelector = ({ 
    scenarios, 
    selectedScenario, 
    onScenarioSelect,
    categories,
    selectedCategory,
    onCategoryChange,
    isCollapsed,
    onToggleCollapse
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredScenarios = scenarios.filter(s => {
        const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
        const matchesSearch = searchTerm === '' || 
            s.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSelect = (scenario) => {
        onScenarioSelect(scenario);
    };

    // Collapsed view
    if (isCollapsed && selectedScenario) {
        return (
            <div className="scenario-selector collapsed">
                {/* Selected scenario indicator */}
                <div 
                    className="collapsed-header"
                    onClick={onToggleCollapse}
                    title="Expand scenario list"
                >
                    <div className="collapsed-selected">
                        <span className="collapsed-number">#{selectedScenario.id}</span>

                    </div>
                    <svg className="expand-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                {/* Mini list */}
                <div className="collapsed-list">
                    {scenarios.map(scenario => (
                        <div
                            key={scenario.id}
                            className={`collapsed-item ${selectedScenario?.id === scenario.id ? 'active' : ''}`}
                            onClick={() => handleSelect(scenario)}
                            title={scenario.name}
                        >
                            {scenario.id}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Expanded view
    return (
        <div className="scenario-selector expanded">
            <div className="selector-header">
                <h3>Scenarios</h3>
                {selectedScenario && (
                    <button 
                        className="collapse-btn"
                        onClick={onToggleCollapse}
                        title="Collapse panel"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="selector-search">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button 
                        className="search-clear"
                        onClick={() => setSearchTerm('')}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Category Pills */}
            <div className="selector-categories">
                <button 
                    className={selectedCategory === 'all' ? 'active' : ''}
                    onClick={() => onCategoryChange('all')}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={selectedCategory === cat ? 'active' : ''}
                        onClick={() => onCategoryChange(cat)}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Scenario List */}
            <div className="selector-list">
                {filteredScenarios.length === 0 ? (
                    <div className="list-empty">No scenarios found</div>
                ) : (
                    filteredScenarios.map(scenario => (
                        <div
                            key={scenario.id}
                            className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
                            onClick={() => handleSelect(scenario)}
                        >
                            <div className="card-header">
                                <span className="card-number">#{scenario.id}</span>
                                <span className={`card-category cat-${scenario.category}`}>
                                    {scenario.category}
                                </span>
                            </div>
                            <div className="card-name">{scenario.name}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ScenarioSelector;





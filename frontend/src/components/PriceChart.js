import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    ComposedChart
} from 'recharts';
import './PriceChart.css';

const PriceChart = ({ 
    dates, 
    baselinePrices, 
    simulatedPrices, 
    forecast,
    showForecast = true,
    selectedYear
}) => {
    const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true);
    const [selectionMode, setSelectionMode] = useState('all'); // 'all' or 'custom'
    const [selectedRegions, setSelectedRegions] = useState({
        us_ech: false,
        eu_ech: false,
        asia_ech: false,
        china_ech: false
    });
    
    const regionColors = {
        us_ech: '#003263',
        eu_ech: '#4a7c99',
        asia_ech: '#982937',
        china_ech: '#c45a6a'
    };

    const regionLabels = {
        us_ech: 'AMER',
        eu_ech: 'EUR',
        asia_ech: 'ASIA',
        china_ech: 'CHN'
    };

    const allRegions = ['us_ech', 'eu_ech', 'asia_ech', 'china_ech'];

    // Get currently visible regions based on selection mode
    const visibleRegions = useMemo(() => {
        if (selectionMode === 'all') {
            return allRegions;
        }
        const selected = allRegions.filter(region => selectedRegions[region]);
        // If nothing selected in custom mode, show all
        return selected.length > 0 ? selected : allRegions;
    }, [selectionMode, selectedRegions]);

    // Handle "All Regions" button click
    const handleAllRegionsClick = () => {
        setSelectionMode('all');
        setSelectedRegions({
            us_ech: false,
            eu_ech: false,
            asia_ech: false,
            china_ech: false
        });
    };

    // Handle individual region button click
    const handleRegionClick = (region) => {
        if (selectionMode === 'all') {
            // Switch to custom mode, select only this region
            setSelectionMode('custom');
            setSelectedRegions({
                us_ech: region === 'us_ech',
                eu_ech: region === 'eu_ech',
                asia_ech: region === 'asia_ech',
                china_ech: region === 'china_ech'
            });
        } else {
            // Toggle this region
            const newSelection = {
                ...selectedRegions,
                [region]: !selectedRegions[region]
            };
            
            // Check if all are now unselected
            const anySelected = Object.values(newSelection).some(v => v);
            
            if (!anySelected) {
                // If nothing selected, go back to "all" mode
                setSelectionMode('all');
                setSelectedRegions({
                    us_ech: false,
                    eu_ech: false,
                    asia_ech: false,
                    china_ech: false
                });
            } else {
                setSelectedRegions(newSelection);
            }
        }
    };

    // Helper to extract forecast data
    const getForecastValue = (region, index, type = 'point') => {
        if (!forecast || !forecast[region]) return null;
        
        const regionForecast = forecast[region];
        
        if (typeof regionForecast === 'object' && regionForecast.point) {
            switch (type) {
                case 'point':
                    return regionForecast.point[index];
                case 'lower':
                    return regionForecast.lower_95?.[index];
                case 'upper':
                    return regionForecast.upper_95?.[index];
                default:
                    return regionForecast.point[index];
            }
        }
        
        if (Array.isArray(regionForecast)) {
            return type === 'point' ? regionForecast[index] : null;
        }
        
        return null;
    };

    // Check if confidence intervals are available
    const hasConfidenceIntervals = useMemo(() => {
        if (!forecast) return false;
        
        for (const region of allRegions) {
            const regionForecast = forecast[region];
            if (regionForecast?.lower_95 && regionForecast?.upper_95) {
                return true;
            }
        }
        return false;
    }, [forecast]);

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!dates || !baselinePrices) return [];
        
        const data = [];
        
        // Historical data
        dates.forEach((date, index) => {
            const point = { 
                date: date.substring(0, 7),
                isForecast: false
            };
            
            allRegions.forEach(region => {
                if (baselinePrices[region]) {
                    point[`${region}_baseline`] = baselinePrices[region][index];
                }
                if (simulatedPrices && simulatedPrices[region]) {
                    point[`${region}_simulated`] = simulatedPrices[region][index];
                }
            });
            
            data.push(point);
        });

        // Forecast data
        if (showForecast && forecast && forecast.dates) {
            forecast.dates.forEach((date, index) => {
                const point = { 
                    date: date.substring(0, 7), 
                    isForecast: true 
                };
                
                allRegions.forEach(region => {
                    const pointValue = getForecastValue(region, index, 'point');
                    if (pointValue !== null) {
                        point[`${region}_forecast`] = pointValue;
                    }
                    
                    const lowerValue = getForecastValue(region, index, 'lower');
                    const upperValue = getForecastValue(region, index, 'upper');
                    
                    if (lowerValue !== null && upperValue !== null) {
                        point[`${region}_ci_lower`] = lowerValue;
                        point[`${region}_ci_upper`] = upperValue;
                        point[`${region}_ci`] = [lowerValue, upperValue];
                    }
                });
                
                data.push(point);
            });
        }

        return data;
    }, [dates, baselinePrices, simulatedPrices, forecast, showForecast]);

    const lastHistoricalIndex = dates ? dates.length - 1 : 0;
    const lastHistoricalDate = chartData[lastHistoricalIndex]?.date;

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const filteredPayload = payload.filter(entry => 
                !entry.dataKey?.includes('_ci_lower') && 
                !entry.dataKey?.includes('_ci_upper') &&
                !entry.dataKey?.includes('_ci') &&
                entry.value !== undefined
            );
            
            const isForecastPoint = payload[0]?.payload?.isForecast;
            
            const regionData = {};
            filteredPayload.forEach(entry => {
                const parts = entry.dataKey?.split('_');
                if (parts.length >= 2) {
                    const region = parts[0] + '_' + parts[1];
                    
                    if (!visibleRegions.includes(region)) return;
                    
                    if (!regionData[region]) {
                        regionData[region] = { color: regionColors[region] };
                    }
                    
                    if (entry.dataKey?.includes('baseline')) {
                        regionData[region].baseline = entry.value;
                    } else if (entry.dataKey?.includes('simulated')) {
                        regionData[region].simulated = entry.value;
                    } else if (entry.dataKey?.includes('forecast')) {
                        regionData[region].forecast = entry.value;
                        const ciData = entry.payload?.[`${region}_ci`];
                        if (ciData) {
                            regionData[region].ci = ciData;
                        }
                    }
                }
            });
            
            if (Object.keys(regionData).length === 0) return null;
            
            return (
                <div className="chart-tooltip">
                    <div className="tooltip-header">
                        <span className="tooltip-date">{label}</span>
                        {isForecastPoint && (
                            <span className="tooltip-forecast-badge">Forecast</span>
                        )}
                    </div>
                    <div className="tooltip-content">
                        {Object.entries(regionData).map(([region, data]) => (
                            <div key={region} className="tooltip-region">
                                <div 
                                    className="tooltip-region-header"
                                    style={{ borderLeftColor: data.color }}
                                >
                                    {regionLabels[region]}
                                </div>
                                <div className="tooltip-values">
                                    {data.baseline !== undefined && (
                                        <div className="tooltip-row">
                                            <span className="tooltip-label">Baseline</span>
                                            <span className="tooltip-value">${data.baseline?.toFixed(3)}</span>
                                        </div>
                                    )}
                                    {data.simulated !== undefined && (
                                        <div className="tooltip-row">
                                            <span className="tooltip-label">Simulated</span>
                                            <span className="tooltip-value">${data.simulated?.toFixed(3)}</span>
                                        </div>
                                    )}
                                    {data.forecast !== undefined && (
                                        <div className="tooltip-row">
                                            <span className="tooltip-label">Forecast</span>
                                            <span className="tooltip-value">${data.forecast?.toFixed(3)}</span>
                                        </div>
                                    )}
                                    {data.ci && showConfidenceIntervals && (
                                        <div className="tooltip-row tooltip-ci-row">
                                            <span className="tooltip-label">95% CI</span>
                                            <span className="tooltip-value">
                                                ${data.ci[0]?.toFixed(3)} - ${data.ci[1]?.toFixed(3)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!chartData || chartData.length === 0) {
        return (
            <div className="price-chart">
                <div className="chart-empty">
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="price-chart">
            <div className="chart-header">
                <div className="chart-title-section">
                    <h3>Price Simulation and Forecast</h3>

                </div>
                <div className="chart-controls">
                    {hasConfidenceIntervals && (
                        <label className="ci-toggle">
                            <input
                                type="checkbox"
                                checked={showConfidenceIntervals}
                                onChange={(e) => setShowConfidenceIntervals(e.target.checked)}
                            />
                            <span className="ci-toggle-slider"></span>
                            <span className="ci-toggle-label">95% CI</span>
                        </label>
                    )}
                    <div className="chart-legend">
                        <span className="legend-item">
                            <span className="legend-line solid"></span>
                            Baseline
                        </span>
                        <span className="legend-item">
                            <span className="legend-line dashed"></span>
                            Simulated
                        </span>
                        {showForecast && forecast && (
                            <span className="legend-item">
                                <span className="legend-line dotted"></span>
                                Forecast
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="chart-body">
                <ResponsiveContainer width="100%" height={420}>
                    <ComposedChart 
                        data={chartData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <defs>
                            {allRegions.map(region => (
                                <linearGradient 
                                    key={`gradient_${region}`}
                                    id={`ci_gradient_${region}`} 
                                    x1="0" y1="0" x2="0" y2="1"
                                >
                                    <stop 
                                        offset="0%" 
                                        stopColor={regionColors[region]} 
                                        stopOpacity={0.3}
                                    />
                                    <stop 
                                        offset="100%" 
                                        stopColor={regionColors[region]} 
                                        stopOpacity={0.08}
                                    />
                                </linearGradient>
                            ))}
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ed" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#86868b' }}
                            tickLine={{ stroke: '#e8e8ed' }}
                            axisLine={{ stroke: '#e8e8ed' }}
                            interval="preserveStartEnd"
                        />
                        <YAxis 
                            tick={{ fontSize: 11, fill: '#86868b' }}
                            tickLine={{ stroke: '#e8e8ed' }}
                            axisLine={{ stroke: '#e8e8ed' }}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                            domain={['auto', 'auto']}
                            width={70}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {showForecast && lastHistoricalDate && (
                            <ReferenceLine 
                                x={lastHistoricalDate} 
                                stroke="#86868b" 
                                strokeDasharray="5 5"
                                label={{ 
                                    value: 'Forecast', 
                                    position: 'insideTopRight',
                                    fill: '#86868b',
                                    fontSize: 10,
                                    offset: 10
                                }}
                            />
                        )}

                        {/* Confidence interval bands */}
                        {showForecast && showConfidenceIntervals && hasConfidenceIntervals && 
                            visibleRegions.map(region => (
                                <Area
                                    key={`${region}_ci_upper`}
                                    type="monotone"
                                    dataKey={`${region}_ci_upper`}
                                    stroke="none"
                                    fill={`url(#ci_gradient_${region})`}
                                    fillOpacity={1}
                                    connectNulls={false}
                                    isAnimationActive={true}
                                    animationDuration={600}
                                    dot={false}
                                    activeDot={false}
                                    legendType="none"
                                />
                            ))
                        }
                        
                        {showForecast && showConfidenceIntervals && hasConfidenceIntervals && 
                            visibleRegions.map(region => (
                                <Area
                                    key={`${region}_ci_lower`}
                                    type="monotone"
                                    dataKey={`${region}_ci_lower`}
                                    stroke="none"
                                    fill="#ffffff"
                                    fillOpacity={1}
                                    connectNulls={false}
                                    isAnimationActive={true}
                                    animationDuration={600}
                                    dot={false}
                                    activeDot={false}
                                    legendType="none"
                                />
                            ))
                        }

                        {/* Baseline lines */}
                        {visibleRegions.map(region => (
                            <Line
                                key={`${region}_baseline`}
                                type="monotone"
                                dataKey={`${region}_baseline`}
                                name={`${regionLabels[region]} Baseline`}
                                stroke={regionColors[region]}
                                strokeWidth={1.5}
                                dot={false}
                                opacity={0.35}
                                connectNulls={false}
                            />
                        ))}

                        {/* Simulated lines */}
                        {simulatedPrices && visibleRegions.map(region => (
                            <Line
                                key={`${region}_simulated`}
                                type="monotone"
                                dataKey={`${region}_simulated`}
                                name={`${regionLabels[region]} Simulated`}
                                stroke={regionColors[region]}
                                strokeWidth={2.5}
                                strokeDasharray="8 4"
                                dot={false}
                                connectNulls={false}
                            />
                        ))}

                        {/* Forecast lines */}
                        {showForecast && forecast && visibleRegions.map(region => (
                            <Line
                                key={`${region}_forecast`}
                                type="monotone"
                                dataKey={`${region}_forecast`}
                                name={`${regionLabels[region]} Forecast`}
                                stroke={regionColors[region]}
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                dot={false}
                                opacity={0.9}
                                connectNulls={false}
                            />
                        ))}

                        {/* CI boundary lines */}
                        {showForecast && showConfidenceIntervals && hasConfidenceIntervals && 
                            visibleRegions.map(region => (
                                <React.Fragment key={`${region}_ci_lines`}>
                                    <Line
                                        type="monotone"
                                        dataKey={`${region}_ci_upper`}
                                        stroke={regionColors[region]}
                                        strokeWidth={1}
                                        strokeDasharray="2 3"
                                        dot={false}
                                        opacity={0.4}
                                        connectNulls={false}
                                        legendType="none"
                                        name=""
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={`${region}_ci_lower`}
                                        stroke={regionColors[region]}
                                        strokeWidth={1}
                                        strokeDasharray="2 3"
                                        dot={false}
                                        opacity={0.4}
                                        connectNulls={false}
                                        legendType="none"
                                        name=""
                                    />
                                </React.Fragment>
                            ))
                        }
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Apple-style Region Selector */}
            <div className="chart-footer">
                <div className="region-selector-apple">
                    <button 
                        className={`region-btn-apple ${selectionMode === 'all' ? 'active' : ''}`}
                        onClick={handleAllRegionsClick}
                    >
                        All Regions
                    </button>
                    <div className="region-divider"></div>
                    {allRegions.map(region => {
                        const isSelected = selectionMode === 'custom' && selectedRegions[region];
                        return (
                            <button
                                key={region}
                                className={`region-btn-apple ${isSelected ? 'active' : ''}`}
                                onClick={() => handleRegionClick(region)}
                            >
                                <span 
                                    className="region-btn-indicator"
                                    style={{ 
                                        backgroundColor: isSelected ? regionColors[region] : 'transparent',
                                        borderColor: regionColors[region]
                                    }}
                                ></span>
                                {regionLabels[region]}
                            </button>
                        );
                    })}
                </div>
                {forecast && (
                    <div className="forecast-info">

                        {forecast.confidence_interval && showConfidenceIntervals && (
                            <span className="forecast-ci-info">
                                {forecast.confidence_interval} CI
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceChart;


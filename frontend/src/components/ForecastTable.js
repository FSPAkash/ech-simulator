import React, { useState } from 'react';
import './DataTable.css';

const ForecastTable = ({ forecast }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 12;

    const regions = ['us_ech', 'eu_ech', 'asia_ech', 'china_ech'];
    const regionLabels = {
        us_ech: 'AMER',
        eu_ech: 'EUR',
        asia_ech: 'ASIA',
        china_ech: 'CHN'
    };

    const regionColors = {
        us_ech: '#003263',
        eu_ech: '#4a7c99',
        asia_ech: '#982937',
        china_ech: '#c45a6a'
    };

    // Check if forecast data is available
    if (!forecast || !forecast.dates) {
        return (
            <div className="data-table-container">
                <div className="table-empty">
                    <p>No forecast data available</p>
                    <span className="table-empty-hint">Run a simulation to generate forecasts</span>
                </div>
            </div>
        );
    }

    // Helper to get forecast values (handles both old and new format)
    const getForecastValue = (region, index, type = 'point') => {
        if (!forecast[region]) return null;
        
        const regionForecast = forecast[region];
        
        // New format: { point: [], lower_95: [], upper_95: [] }
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
        
        // Old format: array of values
        if (Array.isArray(regionForecast)) {
            return type === 'point' ? regionForecast[index] : null;
        }
        
        return null;
    };

    // Check if confidence intervals are available
    const hasConfidenceIntervals = regions.some(region => {
        const regionForecast = forecast[region];
        return regionForecast?.lower_95 && regionForecast?.upper_95;
    });

    // Build table data
    const tableData = forecast.dates.map((date, index) => {
        const row = { date, index };
        
        regions.forEach(region => {
            row[`${region}_point`] = getForecastValue(region, index, 'point') || 0;
            row[`${region}_lower`] = getForecastValue(region, index, 'lower');
            row[`${region}_upper`] = getForecastValue(region, index, 'upper');
        });
        
        return row;
    });

    // Sorting
    const sortedData = [...tableData].sort((a, b) => {
        if (sortConfig.key === 'date') {
            return sortConfig.direction === 'asc' 
                ? a.index - b.index 
                : b.index - a.index;
        }
        
        const aVal = a[sortConfig.key] || 0;
        const bVal = b[sortConfig.key] || 0;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Pagination
    const totalPages = Math.ceil(sortedData.length / rowsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Date'];
        regions.forEach(region => {
            headers.push(`${regionLabels[region]} Forecast`);
            if (hasConfidenceIntervals) {
                headers.push(`${regionLabels[region]} Lower 95%`);
                headers.push(`${regionLabels[region]} Upper 95%`);
            }
        });

        const csvRows = [headers.join(',')];
        
        tableData.forEach(row => {
            const values = [row.date];
            regions.forEach(region => {
                values.push(row[`${region}_point`].toFixed(4));
                if (hasConfidenceIntervals) {
                    values.push(row[`${region}_lower`]?.toFixed(4) || 'N/A');
                    values.push(row[`${region}_upper`]?.toFixed(4) || 'N/A');
                }
            });
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ech_forecast_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate summary stats for each region
    const summaryStats = regions.map(region => {
        const points = tableData.map(row => row[`${region}_point`]).filter(v => v !== null);
        if (points.length === 0) return null;
        
        const avg = points.reduce((a, b) => a + b, 0) / points.length;
        const min = Math.min(...points);
        const max = Math.max(...points);
        const first = points[0];
        const last = points[points.length - 1];
        const trend = ((last - first) / first) * 100;
        
        return {
            region,
            avg,
            min,
            max,
            trend
        };
    }).filter(Boolean);

    return (
        <div className="data-table-container forecast-table">
            <div className="table-header">
                <div className="table-title-section">
                    <h3>Forecast Data</h3>
                    {forecast.model && (
                        <span className={`model-badge ${forecast.model}`}>
                            {forecast.model === 'prophet' ? 'Prophet Model' : 'Trend Model'}
                        </span>
                    )}
                </div>
                <div className="table-actions">
                    {forecast.confidence_interval && (
                        <span className="ci-badge">{forecast.confidence_interval} CI</span>
                    )}
                    <button className="export-button" onClick={exportToCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="forecast-summary-cards">
                {summaryStats.map(stat => (
                    <div key={stat.region} className="forecast-summary-card">
                        <div className="forecast-card-header">
                            <span 
                                className="forecast-region-indicator"
                                style={{ backgroundColor: regionColors[stat.region] }}
                            ></span>
                            <span className="forecast-region-label">{regionLabels[stat.region]}</span>
                        </div>
                        <div className="forecast-card-body">
                            <div className="forecast-stat">
                                <span className="forecast-stat-label">Avg</span>
                                <span className="forecast-stat-value">${stat.avg.toFixed(3)}</span>
                            </div>
                            <div className="forecast-stat">
                                <span className="forecast-stat-label">Range</span>
                                <span className="forecast-stat-value">
                                    ${stat.min.toFixed(3)} - ${stat.max.toFixed(3)}
                                </span>
                            </div>
                            <div className="forecast-stat">
                                <span className="forecast-stat-label">Trend</span>
                                <span className={`forecast-stat-value trend ${stat.trend >= 0 ? 'up' : 'down'}`}>
                                    {stat.trend >= 0 ? '+' : ''}{stat.trend.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Data Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('date')} className="sortable sticky">
                                Date{getSortIndicator('date')}
                            </th>
                            {regions.map(region => (
                                <React.Fragment key={region}>
                                    <th 
                                        onClick={() => handleSort(`${region}_point`)} 
                                        className="sortable"
                                        style={{ borderBottom: `3px solid ${regionColors[region]}` }}
                                    >
                                        {regionLabels[region]}{getSortIndicator(`${region}_point`)}
                                    </th>
                                    {hasConfidenceIntervals && (
                                        <th className="ci-header">
                                            95% CI
                                        </th>
                                    )}
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, idx) => (
                            <tr key={idx}>
                                <td className="date-cell">{row.date.substring(0, 7)}</td>
                                {regions.map(region => (
                                    <React.Fragment key={region}>
                                        <td className="forecast-value">
                                            ${row[`${region}_point`].toFixed(3)}
                                        </td>
                                        {hasConfidenceIntervals && (
                                            <td className="ci-cell">
                                                {row[`${region}_lower`] !== null && row[`${region}_upper`] !== null ? (
                                                    <span className="ci-range">
                                                        ${row[`${region}_lower`].toFixed(3)} - ${row[`${region}_upper`].toFixed(3)}
                                                    </span>
                                                ) : (
                                                    <span className="ci-na">N/A</span>
                                                )}
                                            </td>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Footer Info */}
            <div className="table-footer-info">
                <span className="data-points">
                    {tableData.length} forecast points
                </span>
                <span className="forecast-period">
                    {forecast.dates[0]?.substring(0, 7)} to {forecast.dates[forecast.dates.length - 1]?.substring(0, 7)}
                </span>
            </div>
        </div>
    );
};

export default ForecastTable;
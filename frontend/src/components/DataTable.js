import React, { useState } from 'react';
import './DataTable.css';

const DataTable = ({ dates, baselinePrices, simulatedPrices, metrics }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
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

    const getYearRange = () => {
        if (!dates || dates.length === 0) return '';
        const years = [...new Set(dates.map(d => new Date(d).getFullYear()))].sort();
        if (years.length === 1) {
            return years[0].toString();
        }
        return `${years[0]} - ${years[years.length - 1]}`;
    };

    if (!dates || !baselinePrices) {
        return (
            <div className="data-table-container">
                <div className="table-empty">
                    <p>No data available</p>
                    <span className="table-empty-hint">Run a simulation to view data</span>
                </div>
            </div>
        );
    }

    const tableData = dates.map((date, index) => {
        const row = { date, index };
        
        regions.forEach(region => {
            row[`${region}_baseline`] = baselinePrices[region]?.[index] || 0;
            row[`${region}_simulated`] = simulatedPrices?.[region]?.[index] || baselinePrices[region]?.[index] || 0;
            
            const baseline = row[`${region}_baseline`];
            const simulated = row[`${region}_simulated`];
            row[`${region}_change`] = baseline ? ((simulated - baseline) / baseline) * 100 : 0;
        });
        
        return row;
    });

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

    // Calculate date range
    const getDateRange = () => {
        if (!dates || dates.length === 0) return '';
        const first = dates[0].substring(0, 7);
        const last = dates[dates.length - 1].substring(0, 7);
        return `${first} to ${last}`;
    };

    const exportToCSV = () => {
        const headers = ['Date'];
        regions.forEach(region => {
            headers.push(`${regionLabels[region]} Baseline`);
            headers.push(`${regionLabels[region]} Simulated`);
            headers.push(`${regionLabels[region]} Change %`);
        });

        const csvRows = [headers.join(',')];
        
        tableData.forEach(row => {
            const values = [row.date];
            regions.forEach(region => {
                values.push(row[`${region}_baseline`].toFixed(4));
                values.push(row[`${region}_simulated`].toFixed(4));
                values.push(row[`${region}_change`].toFixed(4));
            });
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ech_simulation_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="data-table-container">
            {/* Header */}
            <div className="table-header">
                <div className="table-title-section">
                    <h3>Simulation Data</h3>
                    <span className="data-period-badge">{getYearRange()}</span>  {/* CHANGED */}
                </div>
                <div className="table-actions">
                    <button className="export-button" onClick={exportToCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {metrics && (
                <div className="data-summary-cards">
                    {regions.map(region => {
                        const m = metrics[region];
                        if (!m) return null;
                        const isPositive = m.change_percent >= 0;
                        
                        return (
                            <div key={region} className="data-summary-card">
                                <div className="data-card-header">
                                    <span 
                                        className="data-region-indicator"
                                        style={{ backgroundColor: regionColors[region] }}
                                    ></span>
                                    <span className="data-region-label">{regionLabels[region]}</span>
                                </div>
                                <div className="data-card-body">
                                    <div className="data-stat">
                                        <span className="data-stat-label">Baseline Avg</span>
                                        <span className="data-stat-value">${m.baseline_avg.toFixed(3)}</span>
                                    </div>
                                    <div className="data-stat">
                                        <span className="data-stat-label">Simulated Avg</span>
                                        <span className="data-stat-value">${m.simulated_avg.toFixed(3)}</span>
                                    </div>
                                    <div className="data-stat">
                                        <span className="data-stat-label">Change</span>
                                        <span className={`data-stat-value change ${isPositive ? 'up' : 'down'}`}>
                                            {isPositive ? '+' : ''}{m.change_percent.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="data-stat">
                                        <span className="data-stat-label">Range</span>
                                        <span className="data-stat-value">
                                            ${m.min_price.toFixed(3)} - ${m.max_price.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
                                        onClick={() => handleSort(`${region}_baseline`)} 
                                        className="sortable"
                                        style={{ borderBottom: `3px solid ${regionColors[region]}` }}
                                    >
                                        {regionLabels[region]} Base{getSortIndicator(`${region}_baseline`)}
                                    </th>
                                    <th 
                                        onClick={() => handleSort(`${region}_simulated`)} 
                                        className="sortable"
                                    >
                                        Sim{getSortIndicator(`${region}_simulated`)}
                                    </th>
                                    <th 
                                        onClick={() => handleSort(`${region}_change`)} 
                                        className="sortable"
                                    >
                                        Change{getSortIndicator(`${region}_change`)}
                                    </th>
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
                                        <td className="price-cell">${row[`${region}_baseline`].toFixed(3)}</td>
                                        <td className="price-cell">${row[`${region}_simulated`].toFixed(3)}</td>
                                        <td className={`change-cell ${row[`${region}_change`] >= 0 ? 'positive' : 'negative'}`}>
                                            {row[`${region}_change`] >= 0 ? '+' : ''}{row[`${region}_change`].toFixed(2)}%
                                        </td>
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
                <span className="data-points">{tableData.length} data points</span>
                <span className="data-period">{getDateRange()}</span>
            </div>
        </div>
    );
};

export default DataTable;
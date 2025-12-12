import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import './RegionalComparison.css';

const RegionalComparison = ({ metrics, dates }) => {
    if (!metrics) return <div className="no-data">No data available</div>;

    const regions = ['us_ech', 'eu_ech', 'asia_ech', 'china_ech'];
    
    const colors = { 
        us_ech: '#003263', 
        eu_ech: '#4a7c99', 
        asia_ech: '#982937', 
        china_ech: '#c45a6a' 
    };

    const priceData = regions.map(r => ({
        name: r.replace('_ech', '').toUpperCase(),
        baseline: metrics[r]?.baseline_avg || 0,
        simulated: metrics[r]?.simulated_avg || 0,
        color: colors[r]
    }));

    // Get year range from dates
    const getYearRange = () => {
        if (!dates || dates.length === 0) return '';
        const years = [...new Set(dates.map(d => new Date(d).getFullYear()))].sort();
        if (years.length === 1) {
            return years[0].toString();
        }
        return `Avg ${years[0]} - ${years[years.length - 1]}`;
    };

    const changeData = regions.map(r => ({
        name: r.replace('_ech', '').toUpperCase(),
        change: metrics[r]?.change_percent || 0,
        color: colors[r]
    }));

    return (
        <div className="regional-comparison">
            <div className="comparison-header">
                <div className="header-title">
                    <h3>Regional Analysis</h3>
                    <span className="analysis-year-badge">{getYearRange()}</span>
                </div>
            </div>
            
            
            <div className="comparison-grid">
                <div className="chart-section">
                    <h4>Average Prices (USD/ton)</h4>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priceData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ed" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#86868b' }}
                                    axisLine={{ stroke: '#e8e8ed' }}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11, fill: '#86868b' }}
                                    axisLine={{ stroke: '#e8e8ed' }}
                                    tickLine={false}
                                    tickFormatter={(v) => `$${v}`}
                                />
                                <Tooltip 
                                    formatter={(v) => [`$${v.toFixed(3)}`, '']}
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: '1px solid #e8e8ed',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar dataKey="baseline" name="Baseline" fill="#d1d1d6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="simulated" name="Simulated" radius={[4, 4, 0, 0]}>
                                    {priceData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-section">
                    <h4>Price Change (%)</h4>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={changeData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ed" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#86868b' }}
                                    axisLine={{ stroke: '#e8e8ed' }}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11, fill: '#86868b' }}
                                    axisLine={{ stroke: '#e8e8ed' }}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip 
                                    formatter={(v) => [`${v.toFixed(1)}%`, 'Change']}
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: '1px solid #e8e8ed',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar dataKey="change" name="Change" radius={[4, 4, 0, 0]}>
                                    {changeData.map((entry, i) => (
                                        <Cell 
                                            key={i} 
                                            fill={entry.change >= 0 ? '#006300ff' : '#982937'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegionalComparison;
import React from 'react';
import './Charts.css';

// Simple Chart Components using CSS and SVG
const LineChart = ({ data, title, color = '#667eea' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const width = 300;
  const height = 200;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - ((d.value / maxValue) * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <svg width={width} height={height} className="line-chart">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Chart line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
        />
        
        {/* Data points */}
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
          const y = height - padding - ((d.value / maxValue) * (height - 2 * padding));
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              className="chart-point"
            />
          );
        })}
        
        {/* Labels */}
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
          return (
            <text
              key={i}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const BarChart = ({ data, title, color = '#28a745' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const width = 300;
  const height = 200;
  const padding = 40;
  const barWidth = (width - 2 * padding) / data.length - 10;

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <svg width={width} height={height} className="bar-chart">
        {/* Grid lines */}
        <defs>
          <pattern id="barGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#barGrid)" />
        
        {/* Bars */}
        {data.map((d, i) => {
          const x = padding + i * ((width - 2 * padding) / data.length) + 5;
          const barHeight = (d.value / maxValue) * (height - 2 * padding);
          const y = height - padding - barHeight;
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                className="chart-bar"
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="12"
                fill="#666"
              >
                {d.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
                fontWeight="600"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const PieChart = ({ data, title }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  let currentAngle = 0;
  const colors = ['#667eea', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];

  const slices = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle += angle;
    
    return {
      ...d,
      pathData,
      color: colors[i % colors.length],
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <div className="chart-container">
      <h4 className="chart-title">{title}</h4>
      <div className="pie-chart-wrapper">
        <svg width="200" height="200" className="pie-chart">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.pathData}
              fill={slice.color}
              className="pie-slice"
            />
          ))}
        </svg>
        <div className="pie-legend">
          {slices.map((slice, i) => (
            <div key={i} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: slice.color }}
              ></div>
              <span className="legend-label">
                {slice.label}: {slice.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon, color = '#667eea' }) => {
  const isPositive = change > 0;
  
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="stat-change">
          <span className={`change-indicator ${isPositive ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'}`}></i>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, value, max, color = '#667eea' }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="progress-item">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value}/{max}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color 
          }}
        ></div>
      </div>
      <div className="progress-percentage">{percentage.toFixed(1)}%</div>
    </div>
  );
};

const MetricGrid = ({ metrics }) => {
  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <StatCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          color={metric.color}
        />
      ))}
    </div>
  );
};

export {
  LineChart,
  BarChart,
  PieChart,
  StatCard,
  ProgressBar,
  MetricGrid
};
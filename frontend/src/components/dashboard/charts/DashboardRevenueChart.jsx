import React from 'react';

const DashboardRevenueChart = ({ adminStats }) => {
  const data = adminStats?.graphData || [];
  if (data.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
        No Data Available
      </div>
    );
  }

  const width = 500;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  const maxVal = Math.max(...data.map(d => d.revenue), 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const getX = (index) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  const getY = (value) => height - padding.bottom - ((value - minVal) / range) * (height - padding.top - padding.bottom);

  const points = data.map((d, idx) => ({ x: getX(idx), y: getY(d.revenue) }));
  
  let pathStr = '';
  if (points.length > 0) {
    pathStr = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }

  const fillPathStr = points.length > 0 
    ? `${pathStr} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : '';

  return (
    <div className="w-full relative h-48">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 4 }).map((_, i) => {
          const yVal = minVal + (range / 3) * i;
          const yPos = getY(yVal);
          return (
            <g key={i}>
              <line x1={padding.left} y1={yPos} x2={width - padding.right} y2={yPos} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding.left - 10} y={yPos + 3} fill="#4B5563" fontSize="8" fontWeight="bold" textAnchor="end">
                ₹{Math.round(yVal)}
              </text>
            </g>
          );
        })}

        {/* Fill Area */}
        {fillPathStr && <path d={fillPathStr} fill="url(#revGrad)" />}

        {/* Line */}
        {pathStr && <path d={pathStr} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Interactive Dots */}
        {points.map((p, idx) => (
          <g key={idx} className="group/dot cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#0A0A0A" stroke="#f43f5e" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="8" fill="#f43f5e" fillOpacity="0" className="hover:fill-opacity-20 transition-all" />
          </g>
        ))}

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          const formattedDate = new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          return (
            <text key={idx} x={getX(idx)} y={height - 10} fill="#4B5563" fontSize="8" fontWeight="bold" textAnchor="middle">
              {formattedDate}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default DashboardRevenueChart;

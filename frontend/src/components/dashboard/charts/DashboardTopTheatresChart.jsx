import React from 'react';

const DashboardTopTheatresChart = ({ adminStats }) => {
  const theatres = adminStats?.topTheatres || [];
  if (theatres.length === 0) {
    return (
      <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
        No Data Available
      </div>
    );
  }

  const width = 360;
  const height = 150;
  const padding = { top: 20, right: 10, bottom: 25, left: 40 };

  const maxVal = Math.max(...theatres.map(t => t.revenue), 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const barWidth = Math.max(16, (width - padding.left - padding.right) / (theatres.length * 1.8));
  const getX = (index) => padding.left + (index / theatres.length) * (width - padding.left - padding.right) + barWidth / 2;
  const getY = (value) => height - padding.bottom - ((value - minVal) / range) * (height - padding.top - padding.bottom);

  return (
    <div className="w-full relative h-44">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="theatreBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 3 }).map((_, i) => {
          const yVal = minVal + (range / 2) * i;
          const yPos = getY(yVal);
          return (
            <g key={i}>
              <line x1={padding.left} y1={yPos} x2={width - padding.right} y2={yPos} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding.left - 8} y={yPos + 3} fill="#4B5563" fontSize="7" fontWeight="bold" textAnchor="end">
                ₹{Math.round(yVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {theatres.map((t, idx) => {
          const x = getX(idx);
          const y = getY(t.revenue);
          const barHeight = height - padding.bottom - y;

          return (
            <g key={idx} className="group/tbar cursor-pointer">
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#theatreBarGrad)"
                rx="2"
                className="hover:fill-emerald-400 transition-colors duration-150"
              />
              <text
                x={x}
                y={height - 8}
                fill="#4B5563"
                fontSize="6"
                fontWeight="black"
                textAnchor="middle"
                className="truncate max-w-[45px]"
              >
                {t.name?.length > 10 ? t.name.slice(0, 8) + '..' : t.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DashboardTopTheatresChart;

import React from 'react';

const DashboardBookingsChart = ({ adminStats }) => {
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
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const maxVal = Math.max(...data.map(d => d.bookings), 10);
  const minVal = 0;
  const range = maxVal - minVal;

  const barWidth = Math.max(12, (width - padding.left - padding.right) / (data.length * 1.6));
  const getX = (index) => padding.left + (index / data.length) * (width - padding.left - padding.right) + barWidth / 2;
  const getY = (value) => height - padding.bottom - ((value - minVal) / range) * (height - padding.top - padding.bottom);

  return (
    <div className="w-full relative h-48">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#881337" />
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
                {Math.round(yVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const x = getX(idx);
          const y = getY(d.bookings);
          const barHeight = height - padding.bottom - y;

          return (
            <g key={idx} className="group/bar cursor-pointer">
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGrad)"
                rx="3"
                className="hover:fill-rose-500 transition-colors duration-150"
              />
              <text
                x={x}
                y={y - 5}
                fill="#F3F4F6"
                fontSize="8"
                fontWeight="black"
                textAnchor="middle"
                className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150"
              >
                {d.bookings}
              </text>
            </g>
          );
        })}

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

export default DashboardBookingsChart;

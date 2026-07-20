import React from 'react';

const DashboardTopMoviesChart = ({ adminStats }) => {
  const movies = adminStats?.topMovies || [];
  if (movies.length === 0) {
    return (
      <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
        No Data Available
      </div>
    );
  }

  const maxVal = Math.max(...movies.map(m => m.revenue), 100);

  return (
    <div className="w-full space-y-4 h-44 overflow-y-auto pr-2">
      {movies.map((m, idx) => {
        const pct = (m.revenue / maxVal) * 100;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-neutral-350">
              <span className="truncate max-w-[250px]">{m.title}</span>
              <span className="text-rose-500">₹{m.revenue.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
              <div 
                style={{ width: `${pct}%` }} 
                className="h-full bg-gradient-to-r from-rose-700 to-rose-500 rounded-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardTopMoviesChart;

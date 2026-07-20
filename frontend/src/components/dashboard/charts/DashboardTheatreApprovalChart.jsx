import React from 'react';

const DashboardTheatreApprovalChart = ({ adminStats }) => {
  const approved = adminStats?.totalTheatres || 0;
  const pending = adminStats?.pendingTheatreApprovals || 0;
  const total = approved + pending;

  if (total === 0) {
    return (
      <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
        No Data Available
      </div>
    );
  }

  const circumference = 251.3;
  const approvedPct = (approved / total) * 100;
  const pendingPct = (pending / total) * 100;
  const approvedStroke = (approved / total) * circumference;

  return (
    <div className="w-full flex items-center justify-center gap-12 h-44">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1A1A1A" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="8"
            strokeDasharray={`${circumference}`}
            strokeDashoffset="0"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#10b981"
            strokeWidth="8"
            strokeDasharray={`${approvedStroke} ${circumference}`}
            strokeDashoffset="0"
          />
        </svg>
        <div className="absolute flex flex-col items-center select-none">
          <p className="text-lg font-black text-white">{total}</p>
          <span className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-550">Theatres</span>
        </div>
      </div>

      <div className="space-y-3 font-semibold text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-full" />
          <div>
            <p className="text-neutral-250">Approved</p>
            <p className="text-[10px] text-neutral-500">{approved} ({Math.round(approvedPct)}%)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-amber-500 rounded-full" />
          <div>
            <p className="text-neutral-250">Pending Queue</p>
            <p className="text-[10px] text-neutral-500">{pending} ({Math.round(pendingPct)}%)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTheatreApprovalChart;

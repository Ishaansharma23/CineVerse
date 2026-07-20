import React from 'react';

const DashboardUserDistributionChart = ({ adminStats }) => {
  const users = adminStats?.totalUsers || 0;
  const owners = adminStats?.totalOwners || 0;
  const total = users + owners;

  if (total === 0) {
    return (
      <div className="h-44 w-full flex items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20 text-neutral-600 text-xs font-semibold select-none">
        No Data Available
      </div>
    );
  }

  const circumference = 251.3;
  const userPct = (users / total) * 100;
  const ownerPct = (owners / total) * 100;
  const userStroke = (users / total) * circumference;

  return (
    <div className="w-full flex items-center justify-center gap-12 h-44">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1A1A1A" strokeWidth="12" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#404040"
            strokeWidth="12"
            strokeDasharray={`${circumference}`}
            strokeDashoffset="0"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#f43f5e"
            strokeWidth="12"
            strokeDasharray={`${userStroke} ${circumference}`}
            strokeDashoffset="0"
          />
        </svg>
        <div className="absolute flex flex-col items-center select-none">
          <p className="text-lg font-black text-white">{total}</p>
          <span className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-550">Accounts</span>
        </div>
      </div>

      <div className="space-y-3 font-semibold text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-rose-600 rounded-full" />
          <div>
            <p className="text-neutral-250">Customers</p>
            <p className="text-[10px] text-neutral-500">{users} ({Math.round(userPct)}%)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-neutral-600 rounded-full" />
          <div>
            <p className="text-neutral-250">Theatre Owners</p>
            <p className="text-[10px] text-neutral-500">{owners} ({Math.round(ownerPct)}%)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardUserDistributionChart;

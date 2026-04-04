interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({ title, value, icon, color = "bg-blue-500", subtitle, trend, trendValue }: StatCardProps) {
  const trendColors = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-slate-600 bg-slate-50",
  };

  const trendIcons = {
    up: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ),
    down: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ),
    neutral: null,
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-slate-200">
      {/* Background gradient decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500`} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`${color} text-white p-3 rounded-xl shadow-lg shadow-${color.replace("bg-", "")}/30 transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>

        {trend && trendValue && (
          <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}>
            {trendIcons[trend]}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
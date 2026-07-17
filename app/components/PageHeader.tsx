interface Props {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, count, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            {count !== undefined && (
              <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

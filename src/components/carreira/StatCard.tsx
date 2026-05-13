import { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accentColor?: string;
}

export function StatCard({ label, value, icon, accentColor = '#3b82f6' }: Props) {
  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}30` }}
    >
      {icon && (
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none" style={{ color: accentColor }}>{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

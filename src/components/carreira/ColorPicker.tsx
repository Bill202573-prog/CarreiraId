import { cn } from '@/lib/utils';

const ACCENT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#d97706', // amber
];

interface Props {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label = 'Cor de destaque' }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              'w-8 h-8 rounded-full transition-all border-2',
              value === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-background' : 'border-transparent hover:scale-105'
            )}
            style={{
              backgroundColor: color,
              borderColor: value === color ? color : 'transparent',
              '--tw-ring-color': color,
            } as any}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
}

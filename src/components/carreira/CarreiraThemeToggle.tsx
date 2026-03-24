import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface CarreiraThemeToggleProps {
  isDarkTheme: boolean;
  onCheckedChange: (isDarkTheme: boolean) => void;
  className?: string;
  compact?: boolean;
}

export function CarreiraThemeToggle({
  isDarkTheme,
  onCheckedChange,
  className,
  compact = false,
}: CarreiraThemeToggleProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={isDarkTheme}
        onCheckedChange={onCheckedChange}
        aria-label="Alternar tema da Carreira"
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
      {!compact && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {isDarkTheme ? 'Fundo escuro' : 'Fundo claro'}
        </span>
      )}
    </div>
  );
}

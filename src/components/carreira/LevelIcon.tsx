interface LevelIconProps {
  icone: string;
  size?: number;
  className?: string;
}

/** Renders a level icon — either an image (if URL) or emoji text */
export function LevelIcon({ icone, size = 24, className = '' }: LevelIconProps) {
  const isUrl = icone.startsWith('http') || icone.startsWith('blob:') || icone.startsWith('/');

  if (isUrl) {
    return (
      <img
        src={icone}
        alt="Nível"
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }

  return (
    <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
      {icone}
    </span>
  );
}

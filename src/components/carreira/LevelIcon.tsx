interface LevelIconProps {
  icone: string;
  size?: number;
  className?: string;
  /** When true, image fills entire container with object-cover */
  fill?: boolean;
}

/** Renders a level icon — either an image (if URL) or emoji text */
export function LevelIcon({ icone, size = 24, className = '', fill = false }: LevelIconProps) {
  const isUrl = icone.startsWith('http') || icone.startsWith('blob:') || icone.startsWith('/');

  if (isUrl) {
    return (
      <img
        src={icone}
        alt="Nível"
        className={`${fill ? 'object-cover w-full h-full' : 'object-contain'} ${className}`}
        style={fill ? undefined : { width: size, height: size }}
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

interface VideoEmbedCardProps {
  url: string;
  title?: string | null;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

export function isVideoUrl(url: string): boolean {
  return !!(getYouTubeId(url) || getVimeoId(url));
}

export function VideoEmbedCard({ url, title }: VideoEmbedCardProps) {
  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);

  if (ytId) {
    return (
      <div className="rounded-lg overflow-hidden bg-muted">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title={title || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="rounded-lg overflow-hidden bg-muted">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={title || 'Vimeo video'}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return null;
}

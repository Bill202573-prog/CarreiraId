/**
 * Validates video file against plan limits (duration + size).
 * Reads duration from video metadata in the browser.
 */

export interface VideoValidationResult {
  valid: boolean;
  duration: number; // seconds
  sizeMB: number;
  error?: string;
}

export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Não foi possível ler os metadados do vídeo'));
    };
    video.src = URL.createObjectURL(file);
  });
}

export async function validateVideo(
  file: File,
  maxDurationSec: number,
  maxSizeMB: number,
): Promise<VideoValidationResult> {
  const sizeMB = file.size / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      duration: 0,
      sizeMB,
      error: `O vídeo tem ${sizeMB.toFixed(1)} MB. O máximo permitido é ${maxSizeMB} MB.`,
    };
  }

  try {
    const duration = await getVideoDuration(file);

    if (duration > maxDurationSec) {
      return {
        valid: false,
        duration,
        sizeMB,
        error: `O vídeo tem ${Math.ceil(duration)}s. O máximo permitido é ${maxDurationSec}s.`,
      };
    }

    return { valid: true, duration, sizeMB };
  } catch {
    // If we can't read duration, validate by size only
    return { valid: true, duration: 0, sizeMB };
  }
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|m4v)$/i.test(file.name);
}

/** Accepted video MIME types */
export const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm';

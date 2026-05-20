export function formatDuration(ms: number, forceHours: boolean = false): string {
  if (!ms || ms < 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0 || forceHours) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatLongDuration(ms: number): string {
  if (!ms || ms < 0) return '0 min';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'} ${minutes} min`;
    }
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  return `${minutes} min`;
}

export function formatTrackCount(count: number): string {
  if (count === 1) return '1 canción';
  return `${count} canciones`;
}

export function calculateProgress(current: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function truncateText(text: string, maxLength: number): string {
  if (maxLength <= 3) return text.slice(0, maxLength);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = char + ((hash << 5) - hash);
  }
  return hash;
}

export function hashToGradient(str: string): [string, string] {
  if (!str) return ['hsl(210, 55%, 40%)', 'hsl(210, 55%, 22%)'];
  const hash = hashString(str);
  const hue = Math.abs(hash % 360);
  const sat = 55 + (Math.abs(hash >> 4) % 25);
  const l1 = 40 + (Math.abs(hash >> 8) % 15);
  const l2 = 22 + (Math.abs(hash >> 12) % 13);
  return [`hsl(${hue}, ${sat}%, ${l1}%)`, `hsl(${hue}, ${sat}%, ${l2}%)`];
}

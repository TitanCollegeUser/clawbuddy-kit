export interface YouTubeMeta {
  title: string;
  thumbnail: string;
  videoId: string;
  channelName: string;
  embedUrl: string;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export async function fetchYouTubeMeta(url: string): Promise<YouTubeMeta> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) throw new Error("Could not fetch video info — make sure the video is public");

  const data = await res.json();
  return {
    title: data.title,
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    videoId,
    channelName: data.author_name,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

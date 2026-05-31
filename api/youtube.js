import { cleanApiKey } from './_utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { query } = req.body;
    const apiKey = cleanApiKey(process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY);

    if (!apiKey) {
      res.status(400).json({ error: 'YouTube API Key not configured' });
      return;
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: `${query} educational lecture study class`,
      maxResults: '20',
      type: 'video',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      safeSearch: 'strict',
      key: apiKey,
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || 'YouTube API error' });
      return;
    }

    const items = data.items || [];
    const videos = items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description || '',
    }));

    res.status(200).json({ videos });
  } catch (error) {
    console.error('YouTube proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
}

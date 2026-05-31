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
    const { topic, level } = req.body;
    const apiKey = cleanApiKey(process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY);

    if (!apiKey) {
      res.status(400).json({ error: 'YouTube API Key not configured' });
      return;
    }

    const levelStr = level ? ` ${level} level` : '';

    const fetchLang = async (langQuery) => {
      const params = new URLSearchParams({
        part: 'snippet',
        maxResults: '8',
        q: `${topic}${levelStr} ${langQuery} full lecture explained tutorial`,
        type: 'video',
        key: apiKey,
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        safeSearch: 'strict',
        order: 'relevance',
        videoDuration: 'medium',
        videoCategoryId: '27',
      });

      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      const data = await response.json();
      const items = data.items || [];
      return items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || '',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description || '',
      }));
    };

    const [english, hindi, nepali] = await Promise.allSettled([
      fetchLang('educational lecture study'),
      fetchLang('शिक्षा हिंदी'),
      fetchLang('शिक्षा नेपाली'),
    ]);

    res.status(200).json({
      english: english.status === 'fulfilled' ? english.value : [],
      hindi: hindi.status === 'fulfilled' ? hindi.value : [],
      nepali: nepali.status === 'fulfilled' ? nepali.value : [],
    });
  } catch (error) {
    console.error('YouTube multilingual proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
}

import { cleanApiKey } from './_utils.js';

const DEVANAGARI = /[\u0900-\u097F]/;

const LANG_CONFIG = {
  english: {
    suffix: 'educational lecture explained tutorial science',
    relevanceLanguage: 'en',
    regionCode: 'US',
    filter: () => true,
  },
  hindi: {
    suffix: 'hindi explain शिक्षा व्याख्या हिंदी में',
    relevanceLanguage: 'hi',
    regionCode: 'IN',
    filter: (item) => DEVANAGARI.test(`${item.title} ${item.description}`) || /hindi|हिंदी/i.test(`${item.title} ${item.description}`),
  },
  nepali: {
    suffix: 'nepali explain नेपाली शिक्षा व्याख्या',
    relevanceLanguage: 'ne',
    regionCode: 'NP',
    filter: (item) => DEVANAGARI.test(`${item.title} ${item.description}`) && /nepali|नेपाली|nepal/i.test(`${item.title} ${item.description} ${item.channelTitle}`),
  },
};

function mapItems(items) {
  return items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    description: item.snippet.description || '',
  }));
}

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

    const fetchLang = async (langKey) => {
      const cfg = LANG_CONFIG[langKey];
      const params = new URLSearchParams({
        part: 'snippet',
        maxResults: '20',
        q: `${topic}${levelStr} ${cfg.suffix}`.trim(),
        type: 'video',
        key: apiKey,
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        safeSearch: 'strict',
        order: 'relevance',
        relevanceLanguage: cfg.relevanceLanguage,
        regionCode: cfg.regionCode,
      });

      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      const data = await response.json();
      const items = data.items || [];
      const mapped = mapItems(items).filter(cfg.filter);
      return mapped.length > 0 ? mapped.slice(0, 12) : mapItems(items).slice(0, 8);
    };

    const [english, hindi, nepali] = await Promise.allSettled([
      fetchLang('english'),
      fetchLang('hindi'),
      fetchLang('nepali'),
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

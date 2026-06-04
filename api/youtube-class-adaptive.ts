/**
 * Enhanced YouTube Content API
 * Vercel Serverless Function for class-adaptive video recommendations
 * 
 * Route: /api/youtube-class-adaptive
 * Method: GET
 * Query params: 
 *   - topic: string (required)
 *   - classLevel: ClassLevel (optional, defaults to Grade 10)
 *   - maxResults: number (optional, defaults to 20)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

type ClassLevel = 'Grade 5' | 'Grade 8' | 'Grade 10' | 'Grade 12' | 'Undergraduate';

// Quality channel whitelist by class level
const QUALITY_CHANNELS: Record<ClassLevel, string[]> = {
  'Grade 5': [
    'Khan Academy Kids',
    'Crash Course Kids',
    'National Geographic Kids',
    'TED-Ed',
  ],
  'Grade 8': [
    'Khan Academy',
    'Crash Course',
    'TED-Ed',
    'MinutePhysics',
    'National Geographic',
  ],
  'Grade 10': [
    'Khan Academy',
    'Physics Wallah',
    'BYJU\'S',
    'Vedantu',
    'Crash Course',
  ],
  'Grade 12': [
    'Physics Wallah',
    'Khan Academy',
    'Vedantu',
    'Crash Course',
    'Professor Leonard',
  ],
  'Undergraduate': [
    'MIT OpenCourseWare',
    'Khan Academy',
    'Professor Leonard',
    'Coursera',
    'Stanford Online',
  ],
};

// Quality filters
const QUALITY_FILTERS = {
  exclude: ['#shorts', 'short video', 'trick', 'hack', 'compilation', 'reaction'],
  minViews: {
    'Grade 5': 50000,
    'Grade 8': 100000,
    'Grade 10': 200000,
    'Grade 12': 300000,
    'Undergraduate': 50000,
  },
  minDuration: {
    'Grade 5': 5,
    'Grade 8': 8,
    'Grade 10': 10,
    'Grade 12': 15,
    'Undergraduate': 20,
  },
  maxDuration: {
    'Grade 5': 30,
    'Grade 8': 60,
    'Grade 10': 120,
    'Grade 12': 180,
    'Undergraduate': 300,
  },
};

/**
 * Get class-optimized search query
 */
function getClassOptimizedQuery(topic: string, classLevel: ClassLevel): string {
  const classModifiers: Record<ClassLevel, string> = {
    'Grade 5': ' kids animation tutorial simple',
    'Grade 8': ' middle school explained',
    'Grade 10': ' class 10 board exam',
    'Grade 12': ' NEET JEE advanced',
    'Undergraduate': ' university lecture',
  };

  return `${topic}${classModifiers[classLevel]} -shorts -reaction -meme -challenge`;
}

/**
 * Calculate quality score for a video
 */
function calculateQualityScore(
  video: any,
  classLevel: ClassLevel,
  qualityChannels: string[]
): number {
  let score = 0;

  // Channel authority (40%)
  const isQualityChannel = qualityChannels.some(channel =>
    video.snippet?.channelTitle?.toLowerCase().includes(channel.toLowerCase())
  );
  score += (isQualityChannel ? 1 : 0.5) * 40;

  // View count (20%)
  const viewScore = Math.min(10, Math.log10((video.statistics?.viewCount || 100) + 1)) / 7;
  score += viewScore * 20;

  // Like ratio (20%)
  const likes = parseInt(video.statistics?.likeCount || '0');
  const views = parseInt(video.statistics?.viewCount || '1');
  const likeRatio = views > 0 ? Math.min(1, likes / (views * 0.1)) : 0.7;
  score += likeRatio * 20;

  // Recency (10%)
  const publishDate = new Date(video.snippet?.publishedAt).getTime();
  const ageMonths = (Date.now() - publishDate) / (1000 * 60 * 60 * 24 * 30);
  const recencyScore = Math.max(0, 1 - (ageMonths / 24));
  score += recencyScore * 10;

  // Duration appropriateness (10%)
  const durationMatch = 1; // Assume pre-filtered
  score += durationMatch * 10;

  return Math.min(100, score);
}

/**
 * Parse duration from ISO 8601 format
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 60 + minutes + (seconds > 0 ? 1 : 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { topic, classLevel = 'Grade 10', maxResults = 20 } = req.query;

    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    const cl = classLevel as ClassLevel;
    const query = getClassOptimizedQuery(String(topic), cl);
    const qualityChannels = QUALITY_CHANNELS[cl];

    // Fetch from YouTube Data API
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', Math.min(50, Number(maxResults) * 2).toString());
    searchUrl.searchParams.append('order', 'relevance');
    searchUrl.searchParams.append('videoDuration', 'medium,long'); // Exclude shorts

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) {
      return res.status(200).json({
        videos: [],
        classLevel: cl,
        topic,
        totalHours: 0,
      });
    }

    // Get video details (duration, stats)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('key', apiKey);
    detailsUrl.searchParams.append('id', videoIds.slice(0, 50).join(','));
    detailsUrl.searchParams.append('part', 'contentDetails,statistics,snippet');

    const detailsResponse = await fetch(detailsUrl.toString());
    if (!detailsResponse.ok) {
      throw new Error(`YouTube details fetch failed: ${detailsResponse.statusText}`);
    }

    const detailsData = await detailsResponse.json();

    // Process and filter videos
    let videos = detailsData.items?.map((item: any) => {
      const duration = parseDuration(item.contentDetails?.duration || '');
      const viewCount = parseInt(item.statistics?.viewCount || '0');

      return {
        id: item.id,
        title: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        description: item.snippet?.description,
        duration,
        viewCount,
        publishedAt: item.snippet?.publishedAt,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
        likeCount: parseInt(item.statistics?.likeCount || '0'),
      };
    }) || [];

    // Filter by quality criteria
    const minDuration = QUALITY_FILTERS.minDuration[cl];
    const maxDuration = QUALITY_FILTERS.maxDuration[cl];
    const minViews = QUALITY_FILTERS.minViews[cl];

    videos = videos.filter(video => {
      // Duration check
      if (video.duration < minDuration || video.duration > maxDuration) return false;

      // View count check
      if (video.viewCount < minViews) return false;

      // Quality red flags
      const titleLower = video.title?.toLowerCase() || '';
      for (const pattern of QUALITY_FILTERS.exclude) {
        if (titleLower.includes(pattern)) return false;
      }

      return true;
    });

    // Score and rank videos
    videos = videos
      .map(video => ({
        ...video,
        qualityScore: calculateQualityScore(video, cl, qualityChannels),
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, Number(maxResults));

    // Calculate total hours
    const totalHours = videos.reduce((sum, v) => sum + v.duration, 0) / 60;

    res.status(200).json({
      videos,
      classLevel: cl,
      topic,
      totalHours: parseFloat(totalHours.toFixed(1)),
      count: videos.length,
    });
  } catch (error: any) {
    console.error('YouTube class-adaptive error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch class-adaptive videos',
    });
  }
}

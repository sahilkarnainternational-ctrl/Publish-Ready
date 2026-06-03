/**
 * YouTube Content Configuration Service
 * Manages quality video sources, filtering, and class-adapted recommendations
 */

export type { ClassLevel } from '../context/UserContext';

import type { ClassLevel } from '../context/UserContext';

export type VideoQuality = 'shorts' | 'crash-course' | 'full-length' | 'podcast' | 'documentary';

// Whitelist of premium educational channels by class level
export const PREMIUM_CHANNELS: Partial<Record<ClassLevel, string[]>> = {
  'Grade 5': [
    'Khan Academy Kids',
    'Crash Course Kids',
    'National Geographic Kids',
    'TED-Ed Animations',
    'CrunchLabs',
  ],
  'Grade 8': [
    'Khan Academy',
    'Crash Course Kids',
    'National Geographic',
    'TED-Ed',
    'MinutePhysics',
    'Kurzgesagt',
  ],
  'Grade 10': [
    'Khan Academy',
    'Crash Course',
    'Physics Wallah',
    'BYJU\'S – The Learning App',
    'TED-Ed',
    'MinutePhysics',
    'Kurzgesagt',
    'Veritasium',
    'Professor Dave Explains',
  ],
  'Grade 12': [
    'Khan Academy',
    'Physics Wallah',
    'BYJU\'S – The Learning App',
    'Vedantu',
    'Crash Course',
    'Veritasium',
    'Professor Dave Explains',
    'Professor Leonard',
    'MIT OpenCourseWare',
    'PBS Learning Media',
  ],
  'Undergraduate': [
    'MIT OpenCourseWare',
    'Khan Academy',
    'Professor Leonard',
    'Coursera Official',
    'Stanford Online',
    'Veritasium',
    '3Blue1Brown',
    'Harvard Online Courses',
    'Yale OpenCourses',
    'UC Berkeley Courses',
    'Statquest with Josh Starmer',
    'Andrew Ng',
  ],
};

// Keyword patterns to filter out shorts and low-quality content
export const QUALITY_FILTERS: {
  exclude: string[];
  minDuration: Partial<Record<ClassLevel, number>>;
  maxDuration: Partial<Record<ClassLevel, number>>;
} = {
  exclude: [
    '#shorts',
    'short video',
    'quick tip',
    'trick',
    'hack',
    'asmr',
    'reaction',
    'challenge',
    'compilation',
    'highlights',
    'meme',
    'funny',
  ],
  minDuration: {
    'Grade 5': 5, // minutes
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
    'Undergraduate': 300, // Can be longer for undergrads
  },
};

// Preferred video types and duration by class
export const VIDEO_PREFERENCES: Partial<Record<ClassLevel, VideoQuality[]>> = {
  'Grade 5': ['crash-course', 'full-length', 'documentary'],
  'Grade 8': ['crash-course', 'full-length', 'podcast'],
  'Grade 10': ['crash-course', 'full-length', 'podcast', 'documentary'],
  'Grade 12': ['full-length', 'podcast', 'crash-course', 'documentary'],
  'Undergraduate': ['full-length', 'podcast', 'documentary', 'crash-course'],
};

// Video quality scoring weights
export const QUALITY_WEIGHTS = {
  channelAuthority: 0.4, // Is from premium channel?
  viewCount: 0.15, // Higher view count = more validated
  likeRatio: 0.15, // Like/dislike ratio
  publishRecency: 0.15, // Recent = better maintained
  duration: 0.15, // Appropriate length
};

export interface VideoMetadata {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  duration: number; // in minutes
  viewCount: number;
  publishedAt: string;
  thumbnailUrl: string;
  likeCount?: number;
  dislikeCount?: number;
  qualityScore?: number;
}

export interface ClassAdaptedVideoResult {
  videos: VideoMetadata[];
  totalHours: number;
  classLevel: ClassLevel;
  topic: string;
  suggestedPath?: string;
}

/**
 * Get search query string optimized for class level
 */
export function getClassOptimizedSearchQuery(
  topic: string,
  classLevel: ClassLevel
): string {
  // Add class-specific keywords to improve search results
  const classKeywords: Partial<Record<ClassLevel, string>> = {
    'Grade 5': 'kids tutorial animation',
    'Grade 8': 'middle school explanation',
    'Grade 10': 'class 10 explained board exam',
    'Grade 12': 'class 12 advanced JEE NEET preparation',
    'Undergraduate': 'university lecture course',
  };

  return `${topic} ${classKeywords[classLevel] ?? 'educational tutorial'} -shorts -reaction -challenge -meme`;
}

/**
 * Filter videos by quality criteria
 */
export function filterVideosByQuality(
  videos: VideoMetadata[],
  classLevel: ClassLevel
): VideoMetadata[] {
  const minDuration = QUALITY_FILTERS.minDuration[classLevel] ?? 0;
  const maxDuration = QUALITY_FILTERS.maxDuration[classLevel] ?? Number.MAX_SAFE_INTEGER;

  return videos.filter(video => {
    // Duration check
    if (video.duration < minDuration || video.duration > maxDuration) {
      return false;
    }

    // Exclude low-quality patterns
    const titleLower = video.title.toLowerCase();
    const descLower = (video.description || '').toLowerCase();
    
    for (const pattern of QUALITY_FILTERS.exclude) {
      if (titleLower.includes(pattern) || descLower.includes(pattern)) {
        return false;
      }
    }

    // Minimum view count threshold (increases with class level)
    const minViews: Partial<Record<ClassLevel, number>> = {
      'Grade 5': 50000,
      'Grade 8': 100000,
      'Grade 10': 200000,
      'Grade 12': 300000,
      'Undergraduate': 50000, // More varied for undergrad
    };

    if (video.viewCount < (minViews[classLevel] ?? 50000)) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate quality score for a video
 */
export function calculateVideoQualityScore(
  video: VideoMetadata,
  classLevel: ClassLevel
): number {
  let score = 0;

  // Channel authority
  const premiumChannels = PREMIUM_CHANNELS[classLevel] ?? PREMIUM_CHANNELS['Grade 10'] ?? [];
  const isFromPremiumChannel = premiumChannels.some(
    channel => video.channelTitle.toLowerCase().includes(channel.toLowerCase())
  );
  score += isFromPremiumChannel ? 1 : 0.5 * QUALITY_WEIGHTS.channelAuthority;

  // View count score (logarithmic scale)
  const viewScore = Math.min(1, Math.log10(video.viewCount + 1) / 7); // 10M views = 1.0
  score += viewScore * QUALITY_WEIGHTS.viewCount;

  // Like ratio (if available)
  if (video.likeCount !== undefined && video.dislikeCount !== undefined) {
    const total = video.likeCount + video.dislikeCount;
    const ratio = total > 0 ? video.likeCount / total : 0.5;
    score += ratio * QUALITY_WEIGHTS.likeRatio;
  } else {
    score += 0.7 * QUALITY_WEIGHTS.likeRatio; // Default if not available
  }

  // Publish recency (prefer videos published within last 2 years)
  const publishDate = new Date(video.publishedAt);
  const ageMonths = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const recencyScore = Math.max(0, 1 - (ageMonths / 24)); // Decay over 2 years
  score += recencyScore * QUALITY_WEIGHTS.publishRecency;

  // Duration appropriateness
  const minDuration = QUALITY_FILTERS.minDuration[classLevel] ?? 0;
  const maxDuration = QUALITY_FILTERS.maxDuration[classLevel] ?? 60;
  const optimalDuration = ((minDuration ?? 0) + (maxDuration ?? 60)) / 2 || 30;
  const durationDiff = Math.abs(video.duration - optimalDuration);
  const durationScore = Math.max(0, 1 - (durationDiff / optimalDuration));
  score += durationScore * QUALITY_WEIGHTS.duration;

  video.qualityScore = Math.min(10, score * 10); // Normalize to 0-10
  return video.qualityScore;
}

/**
 * Sort and rank videos by quality
 */
export function rankVideosByQuality(
  videos: VideoMetadata[],
  classLevel: ClassLevel
): VideoMetadata[] {
  // Calculate scores for all videos
  videos.forEach(video => {
    calculateVideoQualityScore(video, classLevel);
  });

  // Sort by quality score descending
  return videos.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
}

/**
 * Group videos into time-based categories
 */
export function groupVideosByDuration(
  videos: VideoMetadata[]
): Record<string, VideoMetadata[]> {
  return {
    short: videos.filter(v => v.duration <= 15),
    medium: videos.filter(v => v.duration > 15 && v.duration <= 45),
    long: videos.filter(v => v.duration > 45 && v.duration <= 120),
    extended: videos.filter(v => v.duration > 120),
  };
}

/**
 * Calculate total video hours for a set
 */
export function calculateTotalHours(videos: VideoMetadata[]): number {
  return videos.reduce((sum, v) => sum + v.duration, 0) / 60;
}

/**
 * Get suggested learning sequence
 */
export function getSuggestedLearningSequence(
  videos: VideoMetadata[],
  classLevel: ClassLevel
): string {
  const totalHours = calculateTotalHours(videos);
  
  // Suggest watching order based on video metadata
  const sequences: Partial<Record<ClassLevel, string>> = {
    'Grade 5': `Watch 2-3 short crash courses (${Math.min(45, videos.filter(v => v.duration <= 15).length * 15)} mins), then explore longer content`,
    'Grade 8': `Start with 1-2 foundation videos (30-45 mins), build up to comprehensive lectures (60-90 mins)`,
    'Grade 10': `Follow the structured path: basics → applications → practice problems. Total time: ~${totalHours.toFixed(1)} hours`,
    'Grade 12': `Complete comprehensive coverage in recommended order: theory → solved examples → board exam level → advanced topics. Total: ~${totalHours.toFixed(1)} hours`,
    'Undergraduate': `Structured curriculum approach: foundations → theory → applications → research papers. Estimated completion: ${totalHours.toFixed(1)} hours`,
  };

  return sequences[classLevel] || sequences['Grade 10'] || `Learn at your own pace. Total time: ~${totalHours.toFixed(1)} hours`;
}

/**
 * Validate if video is appropriate for class level
 */
export function isVideoAppropriateForClass(
  video: VideoMetadata,
  classLevel: ClassLevel
): boolean {
  // Check duration
  const minDuration = QUALITY_FILTERS.minDuration[classLevel] ?? 0;
  const maxDuration = QUALITY_FILTERS.maxDuration[classLevel] ?? Number.MAX_SAFE_INTEGER;
  
  if (video.duration < minDuration || video.duration > maxDuration) {
    return false;
  }

  // Check for quality red flags
  const titleLower = video.title.toLowerCase();
  for (const pattern of QUALITY_FILTERS.exclude) {
    if (titleLower.includes(pattern)) {
      return false;
    }
  }

  // Check minimum views
  const minViews: Partial<Record<ClassLevel, number>> = {
    'Grade 5': 50000,
    'Grade 8': 100000,
    'Grade 10': 200000,
    'Grade 12': 300000,
    'Undergraduate': 50000,
  };

  return video.viewCount >= (minViews[classLevel] ?? 50000);
}

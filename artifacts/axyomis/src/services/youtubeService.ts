import axios from 'axios';
import type { VideoMetadata } from './youtubeQualityService';

export interface YouTubeVideo extends VideoMetadata {
  thumbnail?: string;
}

export interface VideoGroup {
  english: YouTubeVideo[];
  hindi: YouTubeVideo[];
  nepali: YouTubeVideo[];
}

export async function fetchMultilingualVideos(topic: string, level: string = ''): Promise<VideoGroup> {
  try {
    const response = await axios.post('/api/youtube-multilingual', { topic, level });
    const data = response.data;
    // If the proxy returned no videos (likely missing API key), fall back to curated samples so the UI can still play in-app.
    const empty = !(data?.english?.length || data?.hindi?.length || data?.nepali?.length);
    if (empty) {
      const fallback = {
        english: [
          { id: 'M7lc1UVf-VE', title: 'YouTube IFrame API Demo', thumbnail: 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg', channelTitle: 'YouTube Developers', publishedAt: '' },
          { id: 'ysz5S6PUM-U', title: 'Big Buck Bunny (Demo)', thumbnail: 'https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg', channelTitle: 'Blender Foundation', publishedAt: '' },
          { id: 'aqz-KE-bpKQ', title: 'Big Buck Bunny (Original)', thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg', channelTitle: 'peach.blender.org', publishedAt: '' },
        ],
        hindi: [],
        nepali: [],
      };
      return fallback;
    }
    return data;
  } catch (error) {
    console.error('YouTube Proxy Request Error:', error);
    return {
      english: [
        { id: 'M7lc1UVf-VE', title: 'YouTube IFrame API Demo', thumbnail: 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg', channelTitle: 'YouTube Developers', publishedAt: '' },
      ],
      hindi: [],
      nepali: [],
    };
  }
}
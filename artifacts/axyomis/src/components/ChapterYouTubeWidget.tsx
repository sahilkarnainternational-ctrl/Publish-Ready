/**
 * Enhanced YouTube Integration for Chapter Reader
 * Provides class-adapted, quality-filtered video recommendations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Youtube, Clock, Eye, TrendingUp, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { fetchMultilingualVideos, VideoGroup } from '../services/youtubeService';
import type { VideoMetadata } from '../services/youtubeQualityService';
import {
  filterVideosByQuality,
  rankVideosByQuality,
  calculateTotalHours,
  getSuggestedLearningSequence,
  type ClassLevel,
} from '../services/youtubeQualityService';

interface ChapterYouTubeWidgetProps {
  topic: string;
  onClose?: () => void;
}

export const ChapterYouTubeWidget: React.FC<ChapterYouTubeWidgetProps> = ({ topic, onClose }) => {
  const { classLevel } = useUser();
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!topic || !classLevel) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch videos for this topic
        const result = await fetchMultilingualVideos(topic, classLevel);
        const rawVideos = [
          ...result.english,
          ...result.hindi,
          ...result.nepali,
        ];

        if (rawVideos.length > 0) {
          let processedVideos = filterVideosByQuality(rawVideos, classLevel);
          processedVideos = rankVideosByQuality(processedVideos, classLevel);
          processedVideos = processedVideos.slice(0, 20);

          setVideos(processedVideos);
          setTotalHours(calculateTotalHours(processedVideos));
        } else {
          setVideos([]);
          setTotalHours(0);
        }
      } catch (err) {
        console.error('Failed to fetch chapter videos:', err);
        setError('Unable to load videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [topic, classLevel]);

  const suggestedPath = getSuggestedLearningSequence(videos, classLevel as ClassLevel);

  if (!topic) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-16 pt-12 border-t border-white/[0.05]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Video Resources</h3>
            <p className="text-xs text-slate-500 mt-0.5">Curated learning materials for this topic</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats */}
      {videos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
            <p className="text-xs text-slate-500 font-mono">TOTAL VIDEOS</p>
            <p className="text-lg font-bold text-white mt-1">{videos.length}</p>
          </div>
          <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
            <p className="text-xs text-slate-500 font-mono">TOTAL DURATION</p>
            <p className="text-lg font-bold text-white mt-1">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
            <p className="text-xs text-slate-500 font-mono">CLASS LEVEL</p>
            <p className="text-lg font-bold text-white mt-1">{classLevel}</p>
          </div>
        </div>
      )}

      {/* Learning Path Suggestion */}
      {suggestedPath && videos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20"
        >
          <p className="text-xs font-semibold text-blue-300 mb-2">📚 SUGGESTED LEARNING PATH</p>
          <p className="text-xs text-slate-300 leading-relaxed">{suggestedPath}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-slate-400">Finding quality videos...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && !error && (
        <div className="py-12 text-center">
          <p className="text-slate-500">No videos found for this topic.</p>
        </div>
      )}

      {/* Video List */}
      {!loading && videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video, idx) => (
            <motion.button
              key={video.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedVideo(selectedVideo === video.id ? null : video.id)}
              className="w-full group text-left p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-blue-500/30 rounded-xl transition-all"
            >
              {/* Quality Badge */}
              {video.qualityScore && (
                <div className="inline-flex items-center gap-1.5 mb-2 px-2 py-1 bg-blue-500/20 rounded-full">
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300">
                    {video.qualityScore.toFixed(1)}/10 Quality
                  </span>
                </div>
              )}

              {/* Title & Channel */}
              <div className="flex items-start gap-3 mb-2">
                <Play className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                    {video.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{video.channelTitle}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 ml-7 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {video.duration}m
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {(video.viewCount / 1000000).toFixed(1)}M views
                </span>
              </div>

              {/* Expanded Video Player */}
              <AnimatePresence>
                {selectedVideo === video.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/[0.05]"
                  >
                    <div className="aspect-video bg-black/40 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=0&rel=0&modestbranding=1`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Watch on YouTube
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      )}

      {/* Footer Note */}
      {videos.length > 0 && (
        <p className="mt-6 pt-6 border-t border-white/[0.05] text-xs text-slate-600 text-center">
          Videos selected based on your {classLevel} class level and content relevance
        </p>
      )}
    </motion.div>
  );
};

export default ChapterYouTubeWidget;

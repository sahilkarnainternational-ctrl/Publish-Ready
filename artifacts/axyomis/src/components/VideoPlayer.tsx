import React from 'react';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, title = 'Embedded video', className = '' }) => {
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-black ${className}`.trim()}>
      <iframe
        title={title}
        src={src}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

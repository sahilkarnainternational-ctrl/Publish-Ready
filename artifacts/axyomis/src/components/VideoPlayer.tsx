import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, title = 'Embedded video', className = '' }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [embeddable, setEmbeddable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setChecking(true);
      try {
        // Try YouTube oEmbed to infer embeddability
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`);
        if (!mounted) return;
        if (res.ok) setEmbeddable(true);
        else setEmbeddable(false);
      } catch (e) {
        if (!mounted) return;
        // retry once or twice before giving up
        setEmbeddable(false);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    setEmbeddable(null);
    setRetries(0);
    check();
    return () => { mounted = false; };
  }, [videoId]);

  useEffect(() => {
    if (embeddable === false && retries < 2) {
      const t = setTimeout(() => setRetries(r => r + 1), 750 * (retries + 1));
      return () => clearTimeout(t);
    }
  }, [embeddable, retries]);

  const enterFullscreen = async () => {
    try {
      const el = wrapperRef.current || iframeRef.current;
      if (!el) return;
      // @ts-ignore
      if (el.requestFullscreen) await el.requestFullscreen();
      // @ts-ignore
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) {
      // ignore
    }
  };

  if (embeddable === false && retries >= 2) {
    // final fallback: show thumbnail + external link
    const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return (
      <div className={`relative w-full overflow-hidden rounded-3xl bg-black ${className}`.trim()} ref={wrapperRef}>
        <img src={thumb} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')} className="px-5 py-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 text-white font-black">Open on YouTube</button>
            <div className="text-[12px] text-slate-400">Embedding is restricted for this video</div>
          </div>
        </div>
      </div>
    );
  }

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1`;

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-black ${className}`.trim()} ref={wrapperRef}>
      {checking && embeddable === null && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <iframe
        ref={iframeRef}
        title={title}
        src={src}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; autoplay"
        allowFullScreen
        playsInline
        webkit-playsinline="true"
        loading="lazy"
      />

      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button onClick={enterFullscreen} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black">Fullscreen</button>
      </div>
    </div>
  );
};

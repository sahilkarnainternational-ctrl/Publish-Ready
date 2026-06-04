import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

interface GlobeProps {
  className?: string;
}

export const Globe: React.FC<GlobeProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const node = canvasRef.current;
    if (!node || !node.parentElement) return;

    const measure = () => {
      width = node.parentElement!.offsetWidth || 0;
      return width > 0;
    };

    if (!measure()) {
      const ro = new ResizeObserver(() => {
        if (measure()) {
          ro.disconnect();
          initGlobe();
        }
      });
      ro.observe(node.parentElement);
    } else {
      initGlobe();
    }

    function initGlobe() {
      if (!node) return;
      const globe = createGlobe(node, {
        devicePixelRatio: window.devicePixelRatio || 2,
        width: width * 2,
        height: width * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: window.innerWidth < 768 ? 8000 : 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // Scientific hubs
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
        { location: [51.5074, -0.1278], size: 0.05 },
        { location: [35.6895, 139.6917], size: 0.07 },
        { location: [28.6139, 77.209], size: 0.08 },
      ],
      onRender: (state: any) => {
        if (document.visibilityState === 'visible') {
          state.phi = phi;
          phi += 0.01;
        }
        state.width = width * 2;
        state.height = width * 2;
      },
      } as any);

      const onResize = () => {
        if (!node || !node.parentElement) return;
        width = node.parentElement.offsetWidth || width;
      };
      window.addEventListener('resize', onResize);

      // cleanup
      const cleanup = () => {
        try { globe.destroy(); } catch {}
        window.removeEventListener('resize', onResize);
      };
      // store cleanup on node for when effect is torn down
      (node as any).__globeCleanup = cleanup;
    }

    return () => {
      if (node) {
        const c = (node as any).__globeCleanup;
        if (typeof c === 'function') c();
      }
    };
  }, []);

  return (
    <div className={`flex items-center justify-center overflow-hidden w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', aspectRatio: 1 }}
      />
    </div>
  );
};

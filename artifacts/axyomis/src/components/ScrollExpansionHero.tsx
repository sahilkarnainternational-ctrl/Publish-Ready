import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface ScrollExpansionHeroProps {
  mediaUrl?: string;
  title?: string;
  subtitle?: string;
}

export const ScrollExpansionHero: React.FC<ScrollExpansionHeroProps> = ({
  mediaUrl = "https://images.unsplash.com/photo-1532187875605-2fe35177755a?auto=format&fit=crop&q=80&w=2070",
  title = "ASTRA LABS",
  subtitle = "Exploring the scientific universe of tomorrow."
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Scale from a centered card to full screen
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5], ["40px", "0px"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.1, 0.4, 0.5], [1, 1, 0, 0]);

  return (
    <div ref={containerRef} className="h-[200vh] relative">
      <div className="sticky top-0 h-[100dvh] w-full flex items-center justify-center overflow-hidden">
        {/* Hero Text */}
        <motion.div 
          style={{ opacity: textOpacity }}
          className="absolute z-20 text-center pointer-events-none"
        >
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-[0.2em] uppercase mb-4 drop-shadow-2xl">
            {title}
          </h1>
          <p className="text-blue-400 font-mono tracking-[0.4em] uppercase text-xs md:text-sm">
            {subtitle}
          </p>
        </motion.div>

        {/* Expanding Media */}
        <motion.div
          style={{
            scale,
            borderRadius,
            opacity
          }}
          className="relative w-full h-full max-w-[90vw] max-h-[80vh] overflow-hidden shadow-2xl border border-white/10"
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          {/** show a solid fallback if the external image fails to load on some networks */}
          <HeroImage mediaUrl={mediaUrl} />
          
          {/* Decorative Elements inside image */}
          <div className="absolute bottom-12 left-12 z-20 space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-0.5 bg-blue-500" />
              <span className="text-[10px] text-white font-mono uppercase tracking-[0.3em]">System Connected</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-0.5 bg-slate-500" />
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.3em]">System Integrity: 95%</span>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          style={{ opacity: textOpacity }}
          className="absolute bottom-12 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Scroll to Explore</span>
          <div className="w-0.5 h-12 bg-gradient-to-b from-blue-500 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
};

const HeroImage: React.FC<{ mediaUrl: string }> = ({ mediaUrl }) => {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#021021] to-[#051427] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-lg font-bold text-white mb-2">ASTRA LABS</div>
          <div className="text-sm text-slate-400">Exploring the scientific universe of tomorrow.</div>
        </div>
      </div>
    );
  }
  return (
    <img
      src={mediaUrl}
      alt="Scientific Research"
      className="w-full h-full object-cover"
      onError={() => setErrored(true)}
    />
  );
};

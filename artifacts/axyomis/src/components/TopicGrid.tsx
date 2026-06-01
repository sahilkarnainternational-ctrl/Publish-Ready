import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { DATA_SETS, WIKI_MAP } from '../constants';

interface TopicGridProps {
  category: 'study' | 'kids' | 'diseases';
  context?: string;
  onOpenReader: (topic: string, context: string) => void;
}

interface TopicCard {
  title: string;
  imgSrc?: string;
  extract?: string;
  pageId?: string;
  wikiUrl?: string;
}

const getSubjectIcon = (subject: string): string => {
  const icons: Record<string, string> = {
    Physics: 'fa-atom', Chemistry: 'fa-flask', Biology: 'fa-dna',
    Mathematics: 'fa-square-root-alt', Nature: 'fa-leaf',
    Fruits: 'fa-apple-alt', Vegetables: 'fa-carrot', Hygiene: 'fa-hand-sparkles',
    diseases: 'fa-virus-slash'
  };
  return icons[subject] || 'fa-microscope';
};

const fetchWikiCard = async (topic: string, _context = ''): Promise<TopicCard | null> => {
  try {
    const q = WIKI_MAP[topic] || topic;
    let pageId: string | null = null;
    let title: string = q;

    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`);
    const searchData = await searchRes.json();
    if (!searchData.query?.search?.length) return null;
    pageId = searchData.query.search[0].pageid;
    title = searchData.query.search[0].title;

    const detail = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|info&inprop=url&pageids=${pageId}&exintro=1&explaintext=1&pithumbsize=800&origin=*`);
    const detData = await detail.json();
    const pageData = detData.query.pages[pageId as string | number];

    let imgSrc = pageData.thumbnail?.source || null;
    if (!imgSrc) {
      try {
        const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=6&format=json&origin=*`);
        const imgData = await imgRes.json();
        const imgPages = imgData.query.pages;
        const imgPageId = Object.keys(imgPages)[0];
        const images = imgPages[imgPageId].images || [];
        const badWords = ['logo','icon','stub','symbol','flag','map','ambox','wikiquote','padlock','search','edit','speaker','increase','decrease','question','disambig','portal','commons','category','folder'];
        for (const img of images) {
          const lower = img.title.toLowerCase();
          if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png')) continue;
          if (badWords.some(w => lower.includes(w))) continue;
          const urlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`);
          const urlData = await urlRes.json();
          const up = urlData.query.pages;
          const upId = Object.keys(up)[0];
          const info = up[upId].imageinfo?.[0];
          if (info?.thumburl && !info.thumburl.includes('1px')) { imgSrc = info.thumburl; break; }
        }
      } catch {}
    }

    return {
      title,
      imgSrc: imgSrc || undefined,
      extract: pageData.extract ? pageData.extract.substring(0, 120) + '...' : undefined,
      pageId: String(pageId),
      wikiUrl: pageData.fullurl || `https://en.wikipedia.org/?curid=${pageId}`,
    };
  } catch { return null; }
};

export const TopicGrid: React.FC<TopicGridProps> = ({ category, context, onOpenReader }) => {
  const [cards, setCards] = useState<TopicCard[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const loadedRef = useRef<Set<string>>(new Set());

  const getList = useCallback(() => {
    if (category === 'study') return (DATA_SETS as any)[context || 'Physics'] || DATA_SETS.Physics;
    if (category === 'kids') return (DATA_SETS as any)[context || 'Nature'] || DATA_SETS.Nature;
    return DATA_SETS.diseases;
  }, [category, context]);

  const topicList = useMemo(() => {
    const list = getList();
    if (!searchQuery.trim()) return list;
    return list.filter((topic: string) => topic.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  }, [getList, searchQuery]);

  const loadBatch = useCallback((start: number, end: number) => {
    const list = topicList.slice(start, end);
    list.forEach((topic: string) => {
      if (loadedRef.current.has(topic)) return;
      loadedRef.current.add(topic);
      fetchWikiCard(topic, context || category).then(data => {
        if (data) {
          setCards(prev => {
            const exists = prev.findIndex(c => c.title === data.title);
            if (exists >= 0) {
              const next = [...prev];
              next[exists] = { ...next[exists], ...data };
              return next;
            }
            // Insert in correct position
            const idx = list.indexOf(topic);
            const before = prev.filter(c => list.indexOf(c.title) < idx);
            const after = prev.filter(c => list.indexOf(c.title) >= idx && c.title !== data.title);
            return [...before, data, ...after];
          });
        }
      });
    });
  }, [topicList, context, category]);

  useEffect(() => {
    setCards([]);
    setVisibleCount(8);
    loadedRef.current.clear();
    loadBatch(0, 8);
  }, [category, context, searchQuery, loadBatch]);

  useEffect(() => {
    if (visibleCount > 8) {
      loadBatch(visibleCount - 8, visibleCount);
    }
  }, [visibleCount, loadBatch]);

  const totalChapters = topicList.length;
  const visibleCards = cards.slice(0, visibleCount);
  const hasMore = visibleCount < totalChapters;

  const handleLoadMore = () => {
    setLoading(true);
    setVisibleCount(prev => Math.min(prev + 8, totalChapters));
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black mb-2">Chapter Search</div>
          <div className="text-sm text-slate-300">{category === 'study' ? `${topicList.length} chapters available in ${context || 'Science'}` : `${topicList.length} topics available`}</div>
        </div>
        <div className="relative w-full sm:w-[340px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapter, formula, topic..."
            className="w-full rounded-3xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visibleCards.map((card, i) => (
          <motion.button
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 8) * 0.05, duration: 0.4 }}
            onClick={() => onOpenReader(card.title, context || category)}
            className="group text-left rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 hover:bg-white/[0.03] transition-all duration-300 overflow-hidden flex flex-col"
          >
            <div className="relative h-48 overflow-hidden bg-black">
              {card.imgSrc ? (
                <img
                  src={card.imgSrc}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-[1.15] contrast-[1.05]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#050608]">
                  <i className={`fas ${getSubjectIcon(context || category)} text-4xl text-white/10 group-hover:text-blue-500/30 transition-colors duration-500`} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-transparent to-transparent opacity-70" />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300">
                  <i className={`fas ${getSubjectIcon(context || category)} mr-1.5 text-[8px]`} />
                  {context || category}
                </span>
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-white font-bold text-sm tracking-tight mb-2 group-hover:text-blue-300 transition-colors">{card.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mb-4 flex-1">
                {card.extract || 'Accessing data stream...'}
              </p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.03]">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/60 group-hover:text-blue-400 transition-colors">
                  Read Chapter
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-10 py-4 bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 hover:bg-white/[0.05] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <i className="fas fa-circle-notch fa-spin text-blue-400" />
            ) : (
              <>
                <i className="fas fa-chevron-down text-xs text-blue-400" />
                Load More Topics
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

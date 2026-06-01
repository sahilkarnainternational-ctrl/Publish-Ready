import React, { useEffect, useState } from 'react';

type NewsItem = { id: string; title: string; url: string };

const fetchRedditNews = async (): Promise<NewsItem[]> => {
  try {
    const res = await fetch('https://www.reddit.com/r/news/.json?limit=8');
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data.children || []).map((c: any) => ({ id: c.data.id, title: c.data.title, url: `https://reddit.com${c.data.permalink}` }));
  } catch (e) {
    return [];
  }
};

export const LeftNewsPanel: React.FC = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const res = await fetchRedditNews();
      if (!mounted) return;
      setItems(res);
      setLoading(false);
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000); // 5 minutes
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="fixed left-4 top-1/4 z-[1050] w-64">
      <div className="p-3 bg-black/90 backdrop-blur-md border border-white/6 rounded-2xl text-white text-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold">News</div>
          <div className="text-xs text-slate-400">Auto-refresh 5m</div>
        </div>
        {loading && <div className="text-slate-400 text-sm">Loading...</div>}
        <ul className="space-y-2 max-h-64 overflow-auto text-slate-300 text-[13px]">
          {items.length === 0 && !loading && <li className="text-slate-500">No headlines available.</li>}
          {items.map(i => (
            <li key={i.id} className="hover:bg-white/5 p-2 rounded">
              <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-white">{i.title}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LeftNewsPanel;

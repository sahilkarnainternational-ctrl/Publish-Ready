import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, X, ChevronLeft, ChevronRight, ExternalLink, Play,
  Layers, Sparkles, Info, Quote, Lightbulb, Brain, Clock,
  ArrowRight, Bookmark, Share2, FileText
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChapterData {
  title: string;
  extract: string;
  imgSrc?: string;
  pageId?: string;
  wikiUrl?: string;
  context?: string;
}

interface RelatedTopic {
  title: string;
  imgSrc?: string;
  icon: string;
}

interface ChapterReaderProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  context?: string;
  onNavigate?: (topic: string, context?: string) => void;
}

const fetchWiki = async (topic: string, context = ''): Promise<ChapterData | null> => {
  try {
    const WIKI_MAP: Record<string, string> = {
      "Life": "Life (biology)", "Plant reproduction": "Plant reproduction",
      "Living Things": "Life", "Solar System": "Solar System",
      "Water cycle": "Water cycle", "Atmosphere of Earth": "Atmosphere of Earth",
      "Photosynthesis": "Photosynthesis", "Apple": "Apple",
      "Orange": "Orange (fruit)", "Lemon": "Lemon", "Lime": "Lime (fruit)",
      "Pea": "Pea", "Kiwi": "Kiwifruit", "Kiwifruit": "Kiwifruit",
      "Work": "Work (physics)", "Energy": "Energy",
      "Power": "Power (physics)", "Mercury": "Mercury (element)",
      "Lead": "Lead", "Mole": "Mole (unit)", "Cell": "Cell (biology)",
      "Mammal": "Mammal", "Bird": "Bird", "Reptile": "Reptile",
      "Amphibian": "Amphibian", "Fish": "Fish", "Insect": "Insect",
      "Classical mechanics": "Classical mechanics",
      "Newton's laws of motion": "Newton's laws of motion",
      "Gravity": "Gravity", "Flux": "Flux",
      "Acid\u2013base reaction": "Acid\u2013base reaction", "Redox": "Redox",
      "Cell cycle": "Cell cycle", "Mitosis": "Mitosis",
      "Meiosis": "Meiosis", "DNA": "DNA", "RNA": "RNA",
      "Kinematics": "Kinematics", "Dynamics": "Dynamics",
      "Statics": "Statics", "Thermodynamics": "Thermodynamics",
      "Optics": "Optics", "Magnetism": "Magnetism",
      "Electricity": "Electricity", "Atomic physics": "Atomic physics"
    };
    const q = WIKI_MAP[topic] || topic;
    let pageId: string | null = null;
    let title: string = q;

    if (WIKI_MAP[topic]) {
      const directRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&format=json&origin=*`);
      const directData = await directRes.json();
      const pages = directData.query.pages;
      const firstId = Object.keys(pages)[0];
      if (firstId !== "-1") { pageId = firstId; title = pages[pageId].title; }
    }

    if (!pageId) {
      const searchQuery = context ? `${q} ${context}` : q;
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`);
      const d = await res.json();
      if (!d.query?.search?.length) return null;
      pageId = d.query.search[0].pageid;
      title = d.query.search[0].title;
    }

    const detail = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|images|info&inprop=url&pageids=${pageId}&exintro=0&explaintext=0&pithumbsize=1200&origin=*`);
    const detData = await detail.json();
    const pageData = detData.query.pages[pageId as string | number];

    let imgSrc = pageData.thumbnail?.source || null;
    const wikiUrl = pageData.fullurl || `https://en.wikipedia.org/?curid=${pageId}`;

    // fallback image search
    if (!imgSrc) {
      try {
        const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=10&format=json&origin=*`);
        const imgData = await imgRes.json();
        const imgPages = imgData.query.pages;
        const imgPageId = Object.keys(imgPages)[0];
        const images = imgPages[imgPageId].images || [];
        const badWords = ['logo','icon','stub','symbol','flag','map','ambox','wikiquote','padlock','search','edit','speaker','increase','decrease','question','disambig','portal','commons','category','folder'];
        for (const img of images) {
          const lower = img.title.toLowerCase();
          if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png')) continue;
          if (badWords.some(w => lower.includes(w))) continue;
          const urlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`);
          const urlData = await urlRes.json();
          const urlPages = urlData.query.pages;
          const upId = Object.keys(urlPages)[0];
          const info = urlPages[upId].imageinfo?.[0];
          if (info?.thumburl && !info.thumburl.includes('1px')) { imgSrc = info.thumburl; break; }
        }
      } catch {}
    }

    return {
      title,
      extract: pageData.extract || "",
      imgSrc: imgSrc || undefined,
      pageId: String(pageId),
      wikiUrl,
      context
    };
  } catch (e) {
    console.error("Wiki Fetch Error:", e);
    return null;
  }
};

const getRelatedTopics = (topic: string, context = ''): string[] => {
  const DATA_SETS: Record<string, string[]> = {
    Nature: ["Solar System","Life","Plant reproduction","Water cycle","Atmosphere of Earth","Photosynthesis","Mammal","Bird","Reptile","Amphibian","Fish","Insect"],
    Fruits: ["Apple","Banana","Orange","Mango","Pineapple","Grapes","Watermelon","Strawberry","Blueberry","Kiwifruit","Peach","Plum","Cherry","Pear","Papaya","Pomegranate","Lemon","Coconut","Guava","Avocado"],
    Vegetables: ["Tomato","Potato","Carrot","Broccoli","Spinach","Cabbage","Onion","Garlic","Ginger","Radish","Cucumber","Pumpkin","Eggplant","Bell pepper","Maize","Pea","Bean","Lentil","Soybean"],
    Hygiene: ["Drinking water","Soap","Toothbrush","Toothpaste","Towel","Comb","Shampoo","Hand sanitizer","Dental floss","Nail clipper"],
    Physics: ["Classical mechanics","Kinematics","Newton's laws of motion","Gravity","Work (physics)","Energy","Power (physics)","Momentum","Torque","Fluid mechanics","Bernoulli's principle","Thermodynamics","Entropy","Electromagnetism","Electric charge","Magnetic field","Maxwell's equations","Optics","Refraction","Diffraction","Quantum mechanics","Schr\u00f6dinger equation","Heisenberg uncertainty principle","Theory of relativity","Special relativity","Nuclear physics","Radioactivity","Astrophysics","Black hole","Cosmology","String theory"],
    Chemistry: ["Atomic theory","Electron configuration","Periodic table","Chemical bond","Covalent bond","Ionic bond","Intermolecular force","Chemical reaction","Stoichiometry","Acid\u2013base reaction","Redox","Chemical equilibrium","Chemical kinetics","Chemical thermodynamics","Electrochemistry","Organic chemistry","Alkane","Alkene","Alcohol","Carboxylic acid","Amine","Polymer","Biochemistry","Protein","Carbohydrate","Lipid","Nucleic acid","Enzyme","Metabolism","Ideal gas law","Spectroscopy","Chromatography"],
    Biology: ["Cell (biology)","Organelle","Cell nucleus","Mitochondrion","Chloroplast","Cell membrane","Ribosome","Lysosome","Cell cycle","Mitosis","Meiosis","Genetics","DNA","RNA","Gene","Chromosome","Mutation","Transcription (biology)","Translation (biology)","Epigenetics","Evolution","Natural selection","Phylogeny","Ecology","Ecosystem","Food web","Biome","Tree","Anatomy","Physiology","Nervous system","Cardiovascular system","Respiratory system","Endocrine system","Immune system","Botany","Photosynthesis","Microbiology","Bacteria","Virus","Fungi","CRISPR","Stem cell"],
    Mathematics: ["Calculus","Algebra","Trigonometry","Pythagorean theorem","Euler's formula","Integral","Derivative","Linear algebra","Probability","Statistics","Differential equation","Quadratic equation","Taylor series","Fourier transform","Complex number","Matrix (mathematics)","Vector space","Logarithm"],
    diseases: ["Malaria","Dengue fever","Tuberculosis","Cholera","Typhoid fever","HIV/AIDS","COVID-19","Influenza","Pneumonia","Measles","Rubella","Polio","Tetanus","Rabies","Leprosy","Leishmaniasis","Lymphatic filariasis","Asthma","Chronic obstructive pulmonary disease","Lung cancer","Breast cancer","Prostate cancer","Colorectal cancer","Leukemia","Lymphoma","Melanoma","Diabetes","Hypertension","Coronary artery disease","Stroke","Heart failure","Alzheimer's disease","Parkinson's disease","Epilepsy","Schizophrenia","Bipolar disorder","Osteoarthritis","Rheumatoid arthritis","Osteoporosis","Gout","Cirrhosis","Appendicitis","Crohn's disease","Celiac disease","Chronic kidney disease","Anemia","Hemophilia","Sickle cell disease","Down syndrome","Cystic fibrosis","Malnutrition","Scurvy","Rickets","Kwashiorkor","Obesity","Toxoplasmosis","Giardiasis","Amoebiasis","Ascariasis","Scabies"]
  };
  const all = DATA_SETS[context] || Object.values(DATA_SETS).flat();
  const idx = all.indexOf(topic);
  if (idx < 0) return all.slice(0, 5);
  const neighbors = all.slice(Math.max(0, idx - 2), idx).concat(all.slice(idx + 1, idx + 3));
  return neighbors.slice(0, 5);
};

const getSubjectIcon = (subject: string): string => {
  const icons: Record<string, string> = {
    Physics: 'fa-atom', Chemistry: 'fa-flask', Biology: 'fa-dna',
    Mathematics: 'fa-square-root-alt', Nature: 'fa-leaf',
    Fruits: 'fa-apple-alt', Vegetables: 'fa-carrot', Hygiene: 'fa-hand-sparkles',
    diseases: 'fa-virus-slash'
  };
  return icons[subject] || 'fa-microscope';
};

const FORMULA_MAP: Record<string, string> = {
  "Newton's laws of motion": "$$ F = m \\cdot a $$",
  "Gravity": "$$ F = G \\frac{m_1 m_2}{r^2} $$",
  "Thermodynamics": "$$ \\Delta U = Q - W $$",
  "Entropy": "$$ S = k_B \\ln \\Omega $$",
  "Maxwell's equations": "$$ \\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0} \\quad \\text{and} \\quad \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t} $$",
  "Schr\u00f6dinger equation": "$$ i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t) $$",
  "Theory of relativity": "$$ E = mc^2 $$",
  "Ideal gas law": "$$ PV = nRT $$",
  "Acid\u2013base reaction": "$$ \\text{pH} = -\\log_{10}[\\text{H}^+] $$",
  "Photosynthesis": "$$ 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 $$",
  "Pythagorean theorem": "$$ a^2 + b^2 = c^2 $$",
  "Calculus": "$$ \\int_a^b f(x) dx = F(b) - F(a) $$"
};

// ─── EBOOK CHAPTER READER ───────────────────────────────────────────────

export const ChapterReader: React.FC<ChapterReaderProps> = ({ isOpen, onClose, query, context, onNavigate }) => {
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState<RelatedTopic[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [readTime, setReadTime] = useState('3 min');

  useEffect(() => {
    if (!isOpen || !query) return;
    setLoading(true);
    setData(null);
    setRelated([]);

    fetchWiki(query, context).then(d => {
      setData(d);
      if (d?.extract) {
        const words = d.extract.replace(/<[^>]+>/g, '').split(/\s+/).length;
        setReadTime(`${Math.max(2, Math.ceil(words / 200))} min read`);
      }
      setLoading(false);
    });

    const relatedTitles = getRelatedTopics(query, context);
    setRelated(relatedTitles.map(t => ({ title: t, icon: getSubjectIcon(context || 'Science') })));

    // Prefetch related images
    relatedTitles.forEach(async t => {
      const rd = await fetchWiki(t, context);
      if (rd?.imgSrc) {
        setRelated(prev => prev.map(r => r.title === t ? { ...r, imgSrc: rd.imgSrc } : r));
      }
    });
  }, [isOpen, query, context]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sections = React.useMemo(() => {
    if (!data?.extract) return [];
    const html = data.extract;
    // Find h2/h3 headings in the extract to build TOC
    const matches: { id: string; title: string; level: number }[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('h2, h3, h4').forEach((el, i) => {
      const id = `section-${i}`;
      el.setAttribute('id', id);
      matches.push({ id, title: el.textContent || '', level: parseInt(el.tagName[1]) });
    });
    // Also inject IDs for the rendered content
    return matches;
  }, [data]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };

  const hasFormula = query && FORMULA_MAP[query];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[400] bg-[#070708] overflow-hidden flex"
        >
          {/* ── Sidebar TOC ── */}
          <AnimatePresence>
            {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.aside
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className={`${sidebarOpen ? 'absolute' : 'hidden lg:flex'} lg:relative left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0c] border-r border-white/[0.04] flex-col z-20`}
              >
                <div className="p-6 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Chapter Index</span>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{query}</h3>
                  {context && (
                    <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400">
                      <i className={`fas ${getSubjectIcon(context)} text-[9px]`} />
                      {context}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-none">
                  <button
                    onClick={() => scrollToSection('overview')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeSection === 'overview' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'}`}
                  >
                    Overview
                  </button>
                  {sections.map(s => (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${activeSection === s.id ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'} ${s.level >= 3 ? 'pl-6 text-[11px] opacity-70' : ''}`}
                    >
                      {s.title}
                    </button>
                  ))}
                  {hasFormula && (
                    <button
                      onClick={() => scrollToSection('formula')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeSection === 'formula' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'}`}
                    >
                      <i className="fas fa-square-root-alt mr-2 text-[10px]" />
                      Key Formula
                    </button>
                  )}
                  <button
                    onClick={() => scrollToSection('sources')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeSection === 'sources' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'}`}
                  >
                    <Quote className="w-3 h-3 inline mr-2" />
                    Sources & Citations
                  </button>
                </div>
                {/* Mobile sidebar close */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden absolute top-4 right-4 p-2 bg-white/5 rounded-xl text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Main Content ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top bar */}
            <div className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/[0.04] bg-[#0a0a0c]/80 backdrop-blur-xl z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-all">
                  <Layers className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Back to Library</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {data?.wikiUrl && (
                  <a
                    href={data.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                    title="Open on Wikipedia"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto scrollbar-thin"
              onScroll={() => {
                // Detect active section on scroll
                if (!contentRef.current) return;
                const container = contentRef.current;
                const allIds = ['overview', ...sections.map(s => s.id), ...(hasFormula ? ['formula'] : []), 'sources'];
                for (let i = allIds.length - 1; i >= 0; i--) {
                  const el = document.getElementById(allIds[i]);
                  if (el && el.offsetTop <= container.scrollTop + 120) {
                    setActiveSection(allIds[i]);
                    break;
                  }
                }
              }}
            >
              <div className="max-w-3xl mx-auto px-6 sm:px-12 py-12 sm:py-16">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                    <div className="space-y-2 text-center">
                      <p className="text-white font-bold text-sm tracking-widest uppercase">Loading Chapter</p>
                      <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest">Accessing encrypted archives...</p>
                    </div>
                  </div>
                ) : !data ? (
                  <div className="text-center py-32">
                    <Info className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">No data found for this topic.</p>
                  </div>
                ) : (
                  <>
                    {/* ── Chapter Header ── */}
                    <div id="overview" className="mb-16">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          {context && (
                            <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                              <i className={`fas ${getSubjectIcon(context)} mr-1.5`} />
                              {context}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {readTime}
                          </span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">
                          {data.title}
                        </h1>

                        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl font-light">
                          A comprehensive exploration of <span className="text-white font-medium">{data.title}</span> —
                          from foundational principles to advanced applications, with visual aids and verified academic sources.
                        </p>

                        {/* Hero image */}
                        {data.imgSrc && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="mt-10 relative rounded-2xl overflow-hidden border border-white/[0.05] group"
                          >
                            <img
                              src={data.imgSrc}
                              alt={data.title}
                              className="w-full object-cover max-h-[420px] group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                                <i className="fas fa-image mr-1.5" />
                                Figure 1 — Primary visual reference from Wikipedia Commons
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>

                    {/* ── Chapter Body ── */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="prose prose-invert prose-lg max-w-none"
                    >
                      <div className="text-slate-300 leading-[1.85] text-[15px] font-light tracking-wide space-y-6">
                        <Markdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            h2: ({ children }) => <h2 id={`section-${Math.random().toString(36).slice(2,8)}`} className="text-2xl font-bold text-white mt-16 mb-6 pb-3 border-b border-white/10 tracking-tight">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xl font-semibold text-white mt-10 mb-4 tracking-tight">{children}</h3>,
                            p: ({ children }) => <p className="mb-5 leading-[1.85] text-slate-300">{children}</p>,
                            ul: ({ children }) => <ul className="space-y-2 my-6 ml-4">{children}</ul>,
                            li: ({ children }) => <li className="flex items-start gap-3"><span className="w-1 h-1 rounded-full bg-blue-500 mt-2.5 shrink-0" /><span>{children}</span></li>,
                            a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 transition-colors">{children}</a>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-blue-500/40 pl-5 py-2 my-8 bg-blue-500/[0.03] rounded-r-xl">
                                <div className="flex items-center gap-2 mb-2 text-blue-400/60">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Key Insight</span>
                                </div>
                                {children}
                              </blockquote>
                            ),
                            img: ({ src, alt }) => (
                              <figure className="my-10">
                                <div className="rounded-xl overflow-hidden border border-white/[0.05]">
                                  <img src={src} alt={alt || ''} className="w-full object-cover" />
                                </div>
                                <figcaption className="mt-3 text-[10px] text-slate-600 font-mono uppercase tracking-widest text-center">
                                  {alt || 'Figure — Visual reference'}
                                </figcaption>
                              </figure>
                            ),
                          }}
                        >
                          {data.extract.replace(/<\/?h2>/g, '## ').replace(/<\/?h3>/g, '### ').replace(/<\/?p>/g, '\n\n').replace(/<br\s*\/?>/gi, '\n\n')}
                        </Markdown>
                      </div>
                    </motion.div>

                    {/* ── Formula Section ── */}
                    {hasFormula && (
                      <motion.div
                        id="formula"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 p-8 sm:p-10 bg-gradient-to-br from-blue-500/[0.04] to-purple-500/[0.04] border border-blue-500/10 rounded-3xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <i className="fas fa-square-root-alt text-5xl text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                          <Brain className="w-5 h-5 text-blue-400" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Governing Mathematical Framework</h3>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-6 sm:p-8 border border-white/[0.03] text-center overflow-x-auto">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {FORMULA_MAP[query] || ''}
                          </Markdown>
                        </div>
                        <p className="mt-4 text-[10px] text-slate-600 font-mono uppercase tracking-widest text-right">
                          Encrypted Node: {Math.random().toString(16).slice(2, 8).toUpperCase()}
                        </p>
                      </motion.div>
                    )}

                    {/* ── Sources & Citations ── */}
                    <motion.div
                      id="sources"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="mt-20 pt-10 border-t border-white/[0.05]"
                    >
                      <div className="flex items-center gap-3 mb-8">
                        <Quote className="w-4 h-4 text-slate-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Verified Academic Sources</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:border-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">
                              {data.title} — Wikipedia, The Free Encyclopedia
                            </p>
                            <p className="text-slate-600 text-[11px] mt-1">
                              Primary source for chapter content, images, and structural data.
                              Content licensed under CC BY-SA 4.0.
                            </p>
                            {data.wikiUrl && (
                              <a href={data.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                                View Original Article
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:border-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium group-hover:text-emerald-300 transition-colors">
                              Wikimedia Commons — Image Repository
                            </p>
                            <p className="text-slate-600 text-[11px] mt-1">
                              All diagrams and photographs sourced from the Wikimedia Commons
                              open media library. Verified for educational use.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* ── Related Chapters ── */}
                    <div className="mt-20">
                      <div className="flex items-center gap-3 mb-8">
                        <Layers className="w-4 h-4 text-slate-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Continue Your Journey</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {related.map((r, i) => (
                          <motion.button
                            key={r.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => onNavigate?.(r.title, context)}
                            className="group text-left p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 rounded-2xl transition-all flex items-center gap-4"
                          >
                            <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                              {r.imgSrc ? (
                                <img src={r.imgSrc} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <i className={`fas ${r.icon} text-blue-500/40 text-lg`} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate group-hover:text-blue-300 transition-colors">{r.title}</p>
                              <p className="text-[10px] text-slate-600 mt-1 font-mono uppercase tracking-widest">Next Chapter</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 ml-auto shrink-0 transition-colors" />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom spacing */}
                    <div className="h-24" />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

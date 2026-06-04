import { DATA_SETS, WIKI_MAP, FORMULA_MAP } from './constants';

export class AxyomisEngine {
  private state = {
    kids: 0,
    study: 0,
    diseases: 0,
    currentKidsTopic: 'Nature',
    currentStudyTopic: 'Physics',
    mx: window.innerWidth / 2,
    my: window.innerHeight / 2,
    ringX: window.innerWidth / 2,
    ringY: window.innerHeight / 2,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0
  };

  private static batchSize = 12;

  constructor() {
    this.initEventListeners();
    this.initStarfield();
    this.renderAnimations();
    this.initSparkles();
    // this.generateAnalytics(); // Removed per request
    this.initProgress();
    (window as any).engine = this;
  }

  public initModules() {
    this.loadMore('study');
    this.loadMore('kids');
    this.loadMore('diseases');
  }

  private initProgress() {
    let pct = 0;
    const bar = document.getElementById('loader-bar');
    const pctEl = document.getElementById('loader-pct');
    const loader = document.getElementById('loader');
    
    const interval = setInterval(() => {
      pct += Math.floor(Math.random() * 15) + 5;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        setTimeout(() => {
          loader?.classList.add('loader-exit');
          setTimeout(() => { 
            if (loader) loader.style.display = 'none'; 
            this.stopSparkles = true;
          }, 1200);
        }, 500);
      }
      if (bar) bar.style.width = pct + '%';
      if (pctEl) pctEl.innerText = pct + '%';
    }, 100);
  }

  private domCache: { ring: HTMLElement | null; card: HTMLElement | null; dot: HTMLElement | null } = { ring: null, card: null, dot: null };
  private stopSparkles = false;

  private initEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.state.mx = e.clientX;
      this.state.my = e.clientY;
      const xAxis = (this.state.mx - window.innerWidth / 2) / (window.innerWidth / 2);
      const yAxis = (this.state.my - window.innerHeight / 2) / (window.innerHeight / 2);
      this.state.targetX = xAxis * 15;
      this.state.targetY = -(yAxis * 15);
    }, { passive: true });
  }

  private lastRenderState = {
    mx: -1, my: -1, ringX: -1, ringY: -1, currentX: -1, currentY: -1
  };

  private renderAnimations() {
    if (document.visibilityState === 'visible') {
      if (!this.domCache.dot) this.domCache.dot = document.getElementById('cursor-dot');
      if (this.domCache.dot && (Math.abs(this.state.mx - this.lastRenderState.mx) > 0.01 || Math.abs(this.state.my - this.lastRenderState.my) > 0.01)) {
        this.domCache.dot.style.transform = `translate3d(${this.state.mx}px, ${this.state.my}px, 0) translate(-50%, -50%)`;
        this.lastRenderState.mx = this.state.mx;
        this.lastRenderState.my = this.state.my;
      }

      this.state.ringX += (this.state.mx - this.state.ringX) * 0.15;
      this.state.ringY += (this.state.my - this.state.ringY) * 0.15;
      
      if (!this.domCache.ring) this.domCache.ring = document.getElementById('cursor-ring');
      if (this.domCache.ring && (Math.abs(this.state.ringX - this.lastRenderState.ringX) > 0.01 || Math.abs(this.state.ringY - this.lastRenderState.ringY) > 0.01)) {
        this.domCache.ring.style.transform = `translate3d(${this.state.ringX}px, ${this.state.ringY}px, 0) translate(-50%, -50%)`;
        this.lastRenderState.ringX = this.state.ringX;
        this.lastRenderState.ringY = this.state.ringY;
      }

      this.state.currentX += (this.state.targetX - this.state.currentX) * 0.05;
      this.state.currentY += (this.state.targetY - this.state.currentY) * 0.05;
      
      if (!this.domCache.card) this.domCache.card = document.getElementById('card');
      if (this.domCache.card && (Math.abs(this.state.currentX - this.lastRenderState.currentX) > 0.01 || Math.abs(this.state.currentY - this.lastRenderState.currentY) > 0.01)) {
        this.domCache.card.style.transform = `perspective(1200px) rotateY(${this.state.currentX}deg) rotateX(${this.state.currentY}deg)`;
        this.lastRenderState.currentX = this.state.currentX;
        this.lastRenderState.currentY = this.state.currentY;
      }
    }

    requestAnimationFrame(() => this.renderAnimations());
  }

  private initSparkles() {
    const canvas = document.getElementById('sparkles-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles: any[] = Array.from({length: 100}, () => ({
      x: Math.random() * w, y: Math.random() * h,
      size: Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2 - 0.5,
      life: 0, maxLife: 100 + Math.random() * 100
    }));

    const animate = () => {
      if (this.stopSparkles) return;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life++;
        let alpha = p.life < p.maxLife / 2 ? p.life / (p.maxLife / 2) : 1 - (p.life - p.maxLife / 2) / (p.maxLife / 2);
        if (p.life >= p.maxLife) { p.x = Math.random() * w; p.y = Math.random() * h; p.life = 0; }
        ctx.fillStyle = `rgba(229, 211, 179, ${alpha * 0.6})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      requestAnimationFrame(animate);
    };
    animate();
  }

  private initStarfield() {
    const c = document.getElementById('starfield') as HTMLCanvasElement;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 50 : 120;
    
    let stars = Array.from({length: starCount}, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.5, s: Math.random() * 0.2, op: Math.random()
    }));

    window.addEventListener('resize', () => {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    });

    const loop = () => {
      if (document.visibilityState === 'visible') {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
          ctx.fillStyle = `rgba(229, 211, 179, ${s.op})`;
          ctx.fillRect(s.x, s.y, s.r, s.r);
          s.y -= s.s; if (s.y < 0) s.y = h;
        });
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  public async fetchWiki(topic: string, context = '') {
    try {
      const q = WIKI_MAP[topic] || topic;
      let pageId: string | null = null;
      let title: string = q;

      // If we have a direct mapping, try to get the page info directly first
      if (WIKI_MAP[topic]) {
        const directRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&format=json&origin=*`);
        const directData = await directRes.json();
        const pages = directData.query.pages;
        const firstId = Object.keys(pages)[0];
        if (firstId !== "-1") {
          pageId = firstId;
          title = pages[pageId].title;
        }
      }

      // If no direct page found, use search
      if (!pageId) {
        const searchQuery = context ? `${q} ${context}` : q;
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`);
        const d = await res.json();
        if (!d.query?.search?.length) return null;
        pageId = d.query.search[0].pageid;
        title = d.query.search[0].title;
      }
      
      const detail = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|images|info&inprop=url&pageids=${pageId}&exintro=1&explaintext=1&pithumbsize=1200&origin=*`);
      const detData = await detail.json();
      const pageData = detData.query.pages[pageId as string | number];

      let imgSrc = pageData.thumbnail?.source || await this.getFallbackImage(pageData.title);
      
      // If we still don't have an image, let's try a broader search on the topic title itself
      if (!imgSrc) {
        imgSrc = await this.getFallbackImage(title);
      }

      return { ...pageData, imgSrc };
    } catch (e) { 
      console.error("Wiki Fetch Error:", e);
      return null; 
    }
  }

  private async getFallbackImage(title: string): Promise<string | null> {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=30&format=json&origin=*`);
      const data = await res.json();
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (!pages[pageId].images) return null;

      const badWords = ['logo','icon','stub','symbol','flag','map','ambox','wikiquote','padlock','search','edit','speaker','increase','decrease','question','disambig', 'portal', 'commons', 'category', 'folder'];
      let validImages = pages[pageId].images.filter((img: any) => {
        let lower = img.title.toLowerCase();
        if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png')) return false;
        return !badWords.some(word => lower.includes(word));
      });

      if (!validImages.length) return null;
      
      // Try to find the first high-quality image info
      for (const img of validImages.slice(0, 5)) {
        const urlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`);
        const urlData = await urlRes.json();
        const urlPages = urlData.query.pages;
        const urlPageId = Object.keys(urlPages)[0];
        const info = urlPages[urlPageId].imageinfo?.[0];
        
        if (info && info.thumburl && !info.thumburl.includes('1px')) {
          return info.thumburl;
        }
      }
      return null;
    } catch { return null; }
  }

  public generateAnalytics() {
    const grid = document.getElementById('analytics-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({length: 4}, (_, i) => `
      <div class="stat-card">
        <h4 class="text-[var(--accent)] font-bold uppercase tracking-widest mb-4">Metric Alpha-${i+1}</h4>
        <div class="flex justify-between text-xs font-mono mb-4 text-[#64748b]">
          <span>REGIONAL: 25%</span>
          <span>GLOBAL: 90%</span>
        </div>
        <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-[var(--accent)] shadow-[0_0_8px_rgba(34,211,238,0.5)]" style="width: 25%"></div>
        </div>
      </div>
    `).join('');
  }

  private getSubjectIcon(subject: string): string {
    const icons: Record<string, string> = {
      Physics: 'fa-atom',
      Chemistry: 'fa-flask',
      Biology: 'fa-dna',
      Mathematics: 'fa-square-root-alt',
      Nature: 'fa-leaf',
      Fruits: 'fa-apple-alt',
      Vegetables: 'fa-carrot',
      Hygiene: 'fa-hand-sparkles',
      diseases: 'fa-virus-slash'
    };
    return icons[subject] || 'fa-microscope';
  }

  public loadMore(cat: 'study' | 'kids' | 'diseases') {
    const gridPrefix = cat === 'study' ? 'study' : cat === 'kids' ? 'kids' : 'diseases';
    const grid = document.getElementById(`${gridPrefix}-grid`);
    if (!grid) return;
    
    let list: string[] = [];
    let context = '';
    
    if (cat === 'study') {
      list = (DATA_SETS as any)[this.state.currentStudyTopic];
      context = this.state.currentStudyTopic;
    } else if (cat === 'kids') {
      list = (DATA_SETS as any)[this.state.currentKidsTopic];
      context = this.state.currentKidsTopic;
    } else {
      list = (DATA_SETS as any)[cat];
      context = cat;
    }
    
    const start = this.state[cat];
    const end = Math.min(start + 8, list.length);

    for (let i = start; i < end; i++) {
        const topic = list[i];
        const card = document.createElement('div');
        const subjectIcon = this.getSubjectIcon(context);
        
        card.className = 'sub-topic-card group opacity-0 translate-y-10 transition-all duration-700 cursor-pointer';
        card.innerHTML = `
            <div class="st-card-inner">
              <div class="st-card-visual">
                  <div class="st-icon-container">
                    <i class="fas ${subjectIcon} text-sm text-[var(--accent)] transition-colors duration-300"></i>
                  </div>
                  <div class="st-image-layer absolute inset-0">
                    <div class="flex items-center justify-center h-full opacity-20">
                      <i class="fas ${subjectIcon} text-4xl"></i>
                    </div>
                  </div>
                  <div class="absolute inset-0 bg-gradient-to-t from-[#020408] to-transparent opacity-80"></div>
                  <div class="st-scanline"></div>
              </div>
              <div class="st-card-body">
                  <div class="flex items-start justify-between mb-2">
                    <h3 class="st-card-title">${topic}</h3>
                    <span class="st-id-tag">${Math.random().toString(36).substr(2,4).toUpperCase()}</span>
                  </div>
                  <p class="st-card-extract text-slate-500 font-mono text-[10px]">Accessing data stream...</p>
                  <div class="st-card-footer mt-auto">
                      <div class="flex items-center text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] opacity-60 group-hover:opacity-100 transition-opacity">
                        <span>Initialize Node</span>
                        <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                      </div>
                  </div>
              </div>
            </div>
        `;
        card.onclick = () => this.openReader(topic, context);
        grid.appendChild(card);
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                card.classList.remove('opacity-0', 'translate-y-10');
            }, (i - start) * 100);
        });

        this.fetchWiki(topic, context).then(data => {
            if (data) {
                const p = card.querySelector('.st-card-extract') as HTMLElement;
                if (p) p.innerText = data.extract ? data.extract.substring(0, 80) + '...' : p.innerText;
                const imgLayer = card.querySelector('.st-image-layer');
                if (imgLayer && (data as any).imgSrc) {
                  imgLayer.innerHTML = `<img src="${(data as any).imgSrc}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-[1.25] contrast-[1.1] saturate-[1.15]" alt="${topic}" />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#020408] to-transparent opacity-40"></div>`;
                }
            }
        });
    }
    this.state[cat] = end;
    const btn = document.getElementById(`btn-load-${gridPrefix}`);
    if (btn && end >= list.length) btn.classList.add('hidden');
  }

  public switchStudyHub(subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics') {
    this.state.currentStudyTopic = subject;
    this.state.study = 0;
    const display = document.getElementById('active-domain-display');
    if (display) display.innerText = subject;
    const grid = document.getElementById('study-grid');
    if (grid) {
      grid.innerHTML = '';
      this.loadMore('study');
    }
  }

  public switchKidsHub(subject: 'Nature' | 'Fruits' | 'Vegetables' | 'Hygiene') {
    this.state.currentKidsTopic = subject;
    this.state.kids = 0;
    const grid = document.getElementById('kids-grid');
    if (grid) {
      grid.innerHTML = '';
      this.loadMore('kids');
    }
  }

  public load3D(type: 'cosmos' | 'ana' | 'hosp', id: string, btn: HTMLElement) {
    const dataObj = type === 'cosmos' ? (import('./constants').then(c => c.COSMOS_DATA)) : 
                    type === 'ana' ? (import('./constants').then(c => c.ANATOMY_DATA)) : 
                    (import('./constants').then(c => c.HOSPITAL_DATA));

    const menuId = type === 'cosmos' ? 'cosmos-section' : type === 'ana' ? 'anatomy-section' : 'hospital-section';
    const textCont = type === 'cosmos' ? 'cosmos-text-container' : type === 'ana' ? 'ana-text-container' : 'hosp-text-container';
    const loaderId = type === 'cosmos' ? 'cosmos-loader' : type === 'ana' ? 'ana-loader' : 'hosp-loader';
    const iframeId = type === 'cosmos' ? 'cosmos-iframe' : type === 'ana' ? 'ana-iframe' : 'hosp-iframe';

    document.querySelectorAll(`#${menuId} button`).forEach(b => b.classList.remove('bg-[var(--accent-dim)]', 'border-[var(--accent)]', 'text-white'));
    btn.classList.add('bg-[var(--accent-dim)]', 'border-[var(--accent)]', 'text-white');

    const loader = document.getElementById(loaderId);
    if (loader) loader.style.opacity = '1';

    dataObj.then(data => {
      const item = (data as any)[id];
      const text = document.getElementById(textCont);
      if (text) text.innerHTML = item.desc;
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe) {
        iframe.onload = () => { if (loader) loader.style.opacity = '0'; };
        iframe.src = `https://sketchfab.com/models/${item.sfId}/embed?autostart=1&ui_theme=dark&transparent=1`;
      }
    });
  }

  public async openReader(q: string, context = '') {
    const modal = document.getElementById('reader-modal');
    if (!modal) return;
    modal.classList.add('open');
    modal.scrollTo(0, 0);

    const title = document.getElementById('rm-title')!;
    const extract = document.getElementById('rm-extract')!;
    const imgWrapper = document.getElementById('rm-img-wrapper')!;
    const videoContainer = document.getElementById('rm-video-container')!;
    const videoGrid = document.getElementById('rm-video-grid')!;
    
    title.innerText = q.toUpperCase();
    extract.innerHTML = "<div class='text-cyan-400 font-mono text-sm animate-pulse'>&gt; ACCESSING ENCRYPTED ARCHIVES...</div>";
    imgWrapper.innerHTML = `<i class="fas fa-spinner fa-spin text-4xl text-[var(--accent)]"></i>`;
    videoContainer.classList.add('hidden');
    videoGrid.innerHTML = '';
    
    // Curated Section
    const curatedBtn = document.getElementById('btn-curated-videos');
    if (curatedBtn) {
      curatedBtn.onclick = () => this.showCuratedVideos();
    }

    this.loadCategorizedVideos(q);

    let content = `
      <div class="flex flex-col gap-6 mb-10 pb-6 border-b border-white/5">
        <div class="flex items-center justify-between">
          <button onclick="document.getElementById('rm-extract').innerHTML = ''; document.getElementById('rm-video-grid').innerHTML = ''; document.getElementById('rm-video-container').classList.add('hidden'); window.scrollTo({top: 0, behavior: 'smooth'})" class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2">
            <i class="fas fa-chevron-left"></i> Back to Library
          </button>
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
            <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span class="text-[8px] font-black uppercase tracking-widest text-blue-400">Verified Node</span>
          </div>
        </div>
        
        <div class="flex items-center gap-6 overflow-x-auto scrollbar-hide py-2">
          <button onclick="document.getElementById('rm-extract').scrollIntoView({behavior: 'smooth'})" class="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
            <i class="fas fa-file-alt"></i> Research Nodes
          </button>
          <button onclick="document.getElementById('rm-video-container').scrollIntoView({behavior: 'smooth'})" class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2 whitespace-nowrap video-nav-btn">
            <i class="fas fa-play-circle"></i> Video Modules
          </button>
        </div>
      </div>
    `;

    const data = await this.fetchWiki(q, context);
    if (data) {
        content += data.extract ? data.extract.replace(/\n/g, '<br><br>') : "Record limited.";
        
        const related = this.getRelatedTopics(q, context);
        if (related.length > 0) {
          const relatedContainerId = `related-grid-${Date.now()}`;
          content += `<div class="related-grid-container px-4 md:px-0">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-1.5 h-6 bg-[var(--accent)] rounded-full shadow-[0_0_10px_var(--accent)]"></div>
              <h4 class="text-xs uppercase tracking-[0.3em] text-white font-bold">Related Theoretical Nodes</h4>
            </div>
            <div id="${relatedContainerId}" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              ${related.map(r => `
                <div class="related-card-v2 group cursor-pointer" onclick="window.engine.openReader('${r.replace(/'/g, "\\'")}', '${context}')">
                  <div class="card-visual">
                    <div class="placeholder-icon group-hover:scale-110 transition-transform duration-500">
                      <i class="fas ${this.getSubjectIcon(context)}"></i>
                    </div>
                    <div class="image-target absolute inset-0 opacity-0 transition-opacity duration-700"></div>
                  </div>
                  <div class="topic-label truncate px-1">${r}</div>
                </div>
              `).join('')}
            </div>
          </div>`;
          
          // Delayed image loading for related cards
          setTimeout(() => {
            const container = document.getElementById(relatedContainerId);
            if (container) {
              const cards = container.querySelectorAll('.related-card-v2');
              related.forEach((topic, idx) => {
                this.fetchWiki(topic, context).then(data => {
                  if (data && (data as any).imgSrc) {
                    const imgTarget = cards[idx].querySelector('.image-target');
                    if (imgTarget) {
                      imgTarget.innerHTML = `<img src="${(data as any).imgSrc}" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[1.3] contrast-[1.1] saturate-[1.2]" alt="${topic}" />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>`;
                      imgTarget.classList.remove('opacity-0');
                    }
                  }
                });
              });
            }
          }, 100);
        }

        if (FORMULA_MAP[q]) {
          content += `<div class="formula-section mt-12 p-8 bg-black/60 border-l-4 border-[var(--accent)] rounded-r-2xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <i class="fas fa-microchip text-4xl"></i>
            </div>
            <h5 class="text-[9px] uppercase tracking-[0.4em] text-[var(--accent)] font-bold mb-6 flex items-center">
              <span class="w-1.5 h-1.5 bg-[var(--accent)] rounded-full mr-3 animate-pulse"></span>
              Governing Mathematical Framework
            </h5>
            <div class="formula-render font-mono text-white text-center text-xl md:text-2xl py-4 overflow-x-auto">
              ${FORMULA_MAP[q]}
            </div>
            <div class="mt-6 flex justify-end">
              <span class="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Encrypted Node: ${Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
            </div>
          </div>`;
        }

        extract.innerHTML = content;

        if ((data as any).imgSrc) {
          imgWrapper.innerHTML = `<img src="${(data as any).imgSrc}" class="max-w-full max-h-[450px] object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 brightness-[1.15] contrast-[1.1] saturate-[1.1]" alt="${q}" />
          <div class="mt-4 text-[9px] uppercase tracking-widest text-[#64748b] font-bold text-center">Spectral Signature Verification: COMPLETE</div>`;
        } else {
          imgWrapper.innerHTML = `<div class="text-center font-mono opacity-20"><i class="fas fa-book-open text-6xl mb-4"></i><br>NO VISUAL</div>`;
        }
        
        // No legacy MathJax rendering needed for the current markdown/math pipeline.
    }
  }

  public playVideo(id: string, title: string, description: string) {
    try {
      if (!id) throw new Error("Invalid Video Identifier");
      
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-[99999] overflow-y-auto bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300';
      modal.innerHTML = `
        <div class="min-h-screen w-full flex items-center justify-center p-4">
          <div class='relative w-full max-w-6xl bg-[#0d0d10] rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col my-8'>
            <div class="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-black/40 sticky top-0 z-10 backdrop-blur-xl">
              <div class="flex flex-col">
                <h3 class="text-white font-black uppercase tracking-widest text-[10px] md:text-sm leading-tight line-clamp-1">${title}</h3>
                <p class="text-[8px] md:text-[9px] text-slate-500 uppercase tracking-[0.2em] mt-1">Playback Mode: Active • Source: Academic Stream</p>
              </div>
              <div class="flex items-center gap-3">
                <button class='px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2' onclick='this.closest(".fixed").remove()'>
                  <i class='fas fa-arrow-left'></i> Back
                </button>
                <button class='w-10 h-10 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all' onclick='this.closest(".fixed").remove()'>
                  <i class='fas fa-times'></i>
                </button>
              </div>
            </div>
            <div class='relative aspect-video bg-black'>
              <iframe id="video-iframe" src='https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1' class='w-full h-full border-0 absolute inset-0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
            </div>
            <div class="p-6 md:p-8 bg-[#0a0a0c]">
               <h4 class="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                 AI-Extracted Manifest
               </h4>
               <div class="text-[11px] text-slate-400 font-light leading-relaxed max-h-48 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                 ${description || 'Metadata analysis in progress. This educational module provides high-order scientific insights into the selected subject matter.'}
               </div>
               
               <div class="mt-8 pt-8 border-t border-white/5 flex justify-center">
                  <button class='px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all border border-white/5' onclick='this.closest(".fixed").remove()'>
                    Close Player & Return to Node
                  </button>
               </div>
            </div>
          </div>
        </div>
      `;
      
      // Error handling for iframe if possible
      const iframe = modal.querySelector('#video-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.onerror = () => {
          this.handlePlaybackError("Source stream synchronization failed.");
        };
      }

      document.body.appendChild(modal);
    } catch (err: any) {
      this.handlePlaybackError(err.message || "Failed to initialize media playback.");
    }
  }

  private handlePlaybackError(msg: string) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-xl text-red-500 p-12 text-center z-20';
    
    let specificMsg = msg;
    let icon = 'fa-exclamation-triangle';
    let title = 'Connection Failure';

    if (!navigator.onLine) {
      title = 'Network Offline';
      specificMsg = 'Your neural link to the global grid is inactive. Please check your connection.';
      icon = 'fa-wifi';
    } else if (msg.toLowerCase().includes('sync') || msg.toLowerCase().includes('initial')) {
      title = 'Synchronization Error';
      specificMsg = 'The media host refused the secure connection or the video is restricted in your region.';
      icon = 'fa-shield-alt';
    }

    errorDiv.innerHTML = `
      <i class="fas ${icon} text-4xl animate-pulse"></i>
      <div class="flex flex-col gap-2">
        <span class="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">${title}</span>
        <span class="text-sm font-bold text-white max-w-sm">${specificMsg}</span>
      </div>
      <button class="mt-4 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5" onclick="this.closest('.fixed').remove()">
        Dismiss Node
      </button>
    `;
    const frame = document.getElementById('video-iframe');
    if (frame) {
      frame.parentElement?.appendChild(errorDiv);
      frame.remove();
    } else {
      // Fallback to notification if iframe not found
      errorDiv.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-[100000] bg-red-500/90 backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-2xl border border-red-400/50 flex items-center gap-4 animate-in slide-in-from-top duration-500';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 6000);
    }
  }

  public async showCuratedVideos() {
    const grid = document.getElementById('rm-video-grid');
    if (!grid) return;
    
    grid.innerHTML = `<div class="col-span-full py-20 flex flex-col items-center gap-6">
      <i class="fas fa-circle-notch fa-spin text-4xl text-cyan-500"></i>
      <p class="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Filtering Standard Lectures...</p>
    </div>`;

    const curatedTopics = ["The Map of Physics", "The Map of Mathematics", "The Map of Chemistry", "The Map of Biology", "Evolution", "Quantum Mechanics Explained", "Relativity Explained"];
    const randomTopic = curatedTopics[Math.floor(Math.random() * curatedTopics.length)];
    
    const videos = await this.fetchYouTubeVideos(randomTopic);
    if (videos.length > 0) {
      grid.innerHTML = videos.map(v => `
          <div class="bg-black/60 border border-white/10 rounded-[24px] overflow-hidden group hover:border-[var(--accent)] transition-all cursor-pointer flex flex-col h-full" onclick="window.engine.playVideo('${v.id}', '${v.title.replace(/'/g, "\\'")}', '${(v.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
            <div class="aspect-video relative bg-black overflow-hidden">
              <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" alt="${v.title}" />
              <div class="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center pointer-events-none">
                 <div class="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                   <i class="fas fa-play text-white ml-1"></i>
                 </div>
              </div>
            </div>
            <div class="p-6 flex flex-col flex-1 gap-2 bg-gradient-to-b from-white/[0.03] to-transparent">
              <span class="text-[8px] font-black text-yellow-500 uppercase tracking-widest mb-1 badge">Curated Excellence</span>
              <h4 class="text-[11px] text-white font-black uppercase tracking-widest line-clamp-2 leading-relaxed h-[42px]">${v.title}</h4>
              <p class="text-[9px] text-slate-500 font-medium line-clamp-2 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity whitespace-pre-wrap">${v.description || 'Verified educational content for advanced scientific mastery.'}</p>
              <div class="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                <span class="text-[8px] font-black text-[var(--accent)] uppercase tracking-tighter">PREMIUM • 4K</span>
                <i class="fas fa-chevron-right text-[8px] text-slate-600 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </div>
        `).join('');
    }
  }

  private getRelatedTopics(topic: string, context = ''): string[] {
    let list: string[] = [];
    if (context && (DATA_SETS as any)[context]) {
      list = (DATA_SETS as any)[context];
    } else {
      const subjects = Object.keys(DATA_SETS);
      for (const s of subjects) {
        if ((DATA_SETS as any)[s].includes(topic)) {
          list = (DATA_SETS as any)[s];
          break;
        }
      }
    }

    if (list.length === 0) list = Object.values(DATA_SETS).flat();

    return list
      .filter(t => t !== topic)
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
  }

  public async loadCategorizedVideos(mainTopic: string) {
    const videoContainer = document.getElementById('rm-video-container');
    const videoGrid = document.getElementById('rm-video-grid');
    if (!videoContainer || !videoGrid) return;

    videoContainer.classList.remove('hidden');
    videoGrid.innerHTML = `
      <div class="col-span-full py-10 flex flex-col items-center gap-4">
        <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Curating Learning Path...</p>
      </div>
    `;

    const videos = await this.fetchYouTubeVideos(mainTopic);
    
    if (videos.length === 0) {
      videoGrid.innerHTML = `<p class="col-span-full py-10 text-center text-slate-500 text-xs">No specialized modules found.</p>`;
      return;
    }

    // Update navigation button to show availability
    const videoBtn = document.querySelector('.video-nav-btn');
    if (videoBtn) {
      videoBtn.classList.remove('text-slate-500');
      videoBtn.classList.add('text-red-500', 'font-black');
      videoBtn.innerHTML += ` <span class="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse ml-1">${videos.length}</span>`;
    }

    // Static categorization for important topics
    const subTopics: Record<string, string[]> = {
      'Modern Physics': ['Photoelectric Effect', 'Semiconductors', 'Radioactivity', 'Atomic Structure', 'Quantum Mechanics'],
      'Mechanics': ['Kinematics', 'Dynamics', 'Work & Energy', 'Rotational Motion', 'Gravitation'],
      'Thermodynamics': ['Laws of Thermo', 'Kinetic Theory', 'Entropy', 'Heat Transfer'],
      'Electromagnetism': ['Electric Field', 'Circuits', 'Magnetism', 'Induction', 'Alternating Current']
    };

    const matchingSubTopics = subTopics[mainTopic] || [mainTopic];
    const allVideoIds = videos.map(v => v.id);
    
    let html = '';
    for (const sub of matchingSubTopics) {
      const subVideos = videos.filter(v => v.title.toLowerCase().includes(sub.toLowerCase())).length > 0
        ? videos.filter(v => v.title.toLowerCase().includes(sub.toLowerCase())).slice(0, 8)
        : videos.slice(0, 8);

      if (subVideos.length === 0) continue;

      html += `
        <div class="col-span-full mb-16">
          <div class="flex items-center justify-between mb-8">
            <h5 class="text-[12px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4">
              <span class="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></span>
              ${sub}
            </h5>
            <div class="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
            <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">${subVideos.length} MODULES DETECTED</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${subVideos.map(v => `
              <div class="bg-black/60 border border-white/10 rounded-[28px] overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer flex flex-col h-full" onclick="window.engine.playVideoWithQueue('${v.id}', '${v.title.replace(/'/g, "\\'")}', '${(v.description || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}', ${JSON.stringify(allVideoIds).replace(/"/g, "'")})">
                <div class="aspect-video relative bg-black overflow-hidden">
                  <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" alt="${v.title}" />
                  <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <div class="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform shadow-2xl">
                      <i class="fas fa-play text-white text-[10px] ml-0.5"></i>
                    </div>
                  </div>
                </div>
                <div class="p-5 flex flex-col flex-1 bg-gradient-to-b from-white/[0.03] to-transparent">
                  <h6 class="text-[9px] text-white font-black uppercase tracking-widest line-clamp-2 leading-relaxed mb-3">${v.title}</h6>
                  <div class="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                    <span class="text-[7px] font-black text-slate-500 uppercase tracking-widest">Aura Sync Module</span>
                    <i class="fas fa-arrow-right text-[7px] text-slate-700 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    videoGrid.innerHTML = html || `<p class="col-span-full py-10 text-center text-slate-500 text-xs">No sub-modules found for this query.</p>`;
  }

  public playVideoWithQueue(id: string, title: string, description: string, queueIds: string[]) {
    this.playVideo(id, title, description);
    
    // Inject queue into the player modal 
    setTimeout(() => {
      const modal = document.querySelector('.fixed.z-\\[99999\\]');
      const infoPanel = modal?.querySelector('.p-6.md\\:p-8.bg-\\[\\#0a0a0c\\], .p-8.bg-\\[\\#0a0a0c\\]');
      const headerActions = modal?.querySelector('.flex.items-center.justify-between.border-b');

      if (infoPanel && headerActions && modal) {
        const currentIndex = queueIds.indexOf(id);
        const prevId = currentIndex > 0 ? queueIds[currentIndex - 1] : null;
        const nextId = currentIndex < queueIds.length - 1 ? queueIds[currentIndex + 1] : null;

        // Add nav buttons to header (last button group)
        const buttonGroup = headerActions.querySelector('.flex.items-center.gap-3');
        if (buttonGroup) {
          const navHtml = `
            <div class="flex items-center gap-1 md:gap-2 mr-2">
              <button class="w-8 h-8 md:w-10 md:h-10 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-20" ${!prevId ? 'disabled' : `onclick="const p = this.closest('.fixed'); p && p.remove(); window.engine.playVideoWithQueue('${prevId}', 'Loading Previous...', '', ${JSON.stringify(queueIds).replace(/"/g, "'")})"`}>
                <i class="fas fa-chevron-left text-[10px] md:text-xs"></i>
              </button>
              <button class="w-8 h-8 md:w-10 md:h-10 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-20" ${!nextId ? 'disabled' : `onclick="const p = this.closest('.fixed'); p && p.remove(); window.engine.playVideoWithQueue('${nextId}', 'Loading Next...', '', ${JSON.stringify(queueIds).replace(/"/g, "'")})"`}>
                <i class="fas fa-chevron-right text-[10px] md:text-xs"></i>
              </button>
            </div>
          `;
          buttonGroup.insertAdjacentHTML('afterbegin', navHtml);
        }

        const existingQueue = infoPanel.querySelector('.suggested-queue');
        if (existingQueue) existingQueue.remove();

        const queueHtml = `
          <div class="mt-8 pt-8 border-t border-white/5 suggested-queue">
            <div class="flex items-center justify-between mb-4">
              <h5 class="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Up Next</h5>
              <span class="text-[8px] font-black text-blue-500 uppercase tracking-widest">${currentIndex + 1} / ${queueIds.length}</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              ${queueIds.map((qid, idx) => `
                <div class="flex-shrink-0 w-40 aspect-video rounded-xl bg-black border ${qid === id ? 'border-blue-500' : 'border-white/10'} overflow-hidden cursor-pointer hover:border-blue-500 shadow-2xl group transition-all" onclick="const p = this.closest('.fixed'); p && p.remove(); window.engine.playVideoWithQueue('${qid}', 'Syncing Next Node...', '', ${JSON.stringify(queueIds).replace(/"/g, "'")})">
                  <div class="relative w-full h-full">
                    <img src="https://i.ytimg.com/vi/${qid}/default.jpg" class="w-full h-full object-cover ${qid === id ? 'opacity-100' : 'opacity-40'} group-hover:opacity-100 transition-opacity" />
                    ${qid === id ? `<div class="absolute inset-0 flex items-center justify-center bg-blue-500/20"><i class="fas fa-play text-white text-[10px]"></i></div>` : ''}
                    <div class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[8px] text-white font-black">NODE ${idx + 1}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        infoPanel.insertAdjacentHTML('beforeend', queueHtml);
      }
    }, 100);
  }

  private async fetchYouTubeVideos(query: string): Promise<{id: string, title: string, description?: string, thumbnail?: string}[]> {
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      
      if (data.videos && data.videos.length > 0) {
        return data.videos;
      }
      return [];
    } catch (e) {
      console.error('YouTube Proxy Fetch Error:', e);
      return [];
    }
  }
}

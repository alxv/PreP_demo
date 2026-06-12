(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // Surface when running from file:// which can break Dialogflow auth/origin
  if (location.protocol === 'file:') {
    console.warn('[PrEP Bot] Running from file:// may block Dialogflow replies. Please use a local server (http://localhost).');
    // Non-intrusive inline tip near the bottom of the page
    try {
      const tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:1000;background:#111a;border:1px solid rgba(255,255,255,.12);color:#e6ebff;padding:10px 12px;border-radius:10px;font:600 12px/1.4 Nunito Sans,system-ui,Segoe UI,Arial,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)';
      tip.textContent = 'Tip: run via http://localhost (Live Server) so the chatbot can reply.';
      const close = document.createElement('button');
      close.textContent = '×';
      close.setAttribute('aria-label','Dismiss tip');
      close.style.cssText = 'margin-left:10px;appearance:none;background:transparent;border:0;color:#b6c2e6;font-size:14px;cursor:pointer';
      close.onclick = () => tip.remove();
      tip.appendChild(close);
      document.body.appendChild(tip);
    } catch(_) {}
  }

  // Mobile nav toggle
  const toggle = $('.nav-toggle');
  const menu = $('#primary-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close when clicking a link (mobile)
    $$('#primary-menu a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }

  // Smooth scroll for internal links
  $$('#primary-menu a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id && $(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Chat CTAs: open the Dialogflow Messenger chat window
  function nudgeChat() {
    try {
      const bubble = document.querySelector('df-messenger-chat-bubble');
      const btn = bubble && bubble.shadowRoot && bubble.shadowRoot.querySelector('button');
      if (btn) { btn.click(); return; }
    } catch(_) {}
    const df = document.querySelector('df-messenger');
    if (df) { df.classList.add('df-nudge'); setTimeout(() => df.classList.remove('df-nudge'), 1200); }
  }

  // Show greeting + prompt suggestions on first chat open
  let chatGreeted = false;
  const dfGreet = document.querySelector('df-messenger');
  if (dfGreet) {
    dfGreet.addEventListener('df-chat-open-changed', (e) => {
      const isOpen = e && e.detail && e.detail.isOpen;
      if (isOpen && !chatGreeted) {
        chatGreeted = true;
        setTimeout(() => {
          if (typeof dfGreet.renderCustomText === 'function') {
            dfGreet.renderCustomText('Hi! I am PrEP Bot! 👋 Type your question below to get started. You can ask things like:\n• What is PrEP?\n• How do I get PrEP?\n• Are there any side effects?');
          }
        }, 350);
        showDownloadBtn();
      }
    });
  }

  const openChatBtns = ['#open-chat', '#open-chat-2'].map(id => $(id)).filter(Boolean);
  openChatBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    nudgeChat();
  }));

  // Footer year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(y);

  // Chat history capture + download
  const chatLog = [];

  function formatTimestamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function showDownloadBtn() {
    if (document.getElementById('prep-download-chat')) return;
    const btn = document.createElement('button');
    btn.id = 'prep-download-chat';
    btn.title = 'Download chat history';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download chat';
    btn.style.cssText = 'position:fixed;bottom:90px;right:16px;z-index:1000;display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1.5px solid #e2e8f0;border-radius:999px;font-size:12px;font-family:var(--f-body,sans-serif);color:#1e2d45;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.12);transition:background 0.15s;';
    btn.addEventListener('mouseenter', () => btn.style.background = '#f4f6fb');
    btn.addEventListener('mouseleave', () => btn.style.background = '#fff');
    btn.addEventListener('click', () => {
      if (!chatLog.length) return;
      const lines = ['PrEP Bot — Chat History', '=' .repeat(40), ''];
      chatLog.forEach(m => lines.push(`[${m.time}] ${m.role === 'user' ? 'You' : 'PrEP Bot'}: ${m.text}`));
      lines.push('', '=' .repeat(40), `Downloaded ${new Date().toLocaleString()}`);
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'prepbot-chat.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    document.body.appendChild(btn);
  }

  const dfEl = document.querySelector('df-messenger');
  if (dfEl) {
    try {
      dfEl.addEventListener('df-request-sent', (e) => {
        const text = e && e.detail && e.detail.queryInput && e.detail.queryInput.text && e.detail.queryInput.text.text;
        if (text) { chatLog.push({ role: 'user', text, time: formatTimestamp() }); showDownloadBtn(); }
      });
      dfEl.addEventListener('df-response-received', (e) => {
        try {
          const msgs = e && e.detail && e.detail.response && e.detail.response.queryResult && e.detail.response.queryResult.responseMessages;
          if (msgs) {
            msgs.forEach(m => {
              const text = m.text && m.text.text && m.text.text[0];
              if (text) chatLog.push({ role: 'bot', text, time: formatTimestamp() });
            });
          }
        } catch(_) {}
      });
      dfEl.addEventListener('df-error', (e) => {
        console.error('[PrEP Bot][DF] error', e && e.detail);
      });
    } catch(err) {
      console.warn('[PrEP Bot] Could not attach df-messenger event listeners.', err);
    }
  }

  // Competition-grade interaction polish
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    // Scroll progress indicator in header
    const updateScrollProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
      document.documentElement.style.setProperty('--scroll', progress.toFixed(2));
    };
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    // Staggered reveal choreography across key blocks
    const revealTargets = [
      ...$$('.hero-copy, .hero-card, .section-head'),
      ...$$('.feature, .steps li, .faq details, .cta-final-inner')
    ];

    revealTargets.forEach((el, i) => {
      el.classList.add('reveal-ready');
      el.style.transitionDelay = `${Math.min(i * 40, 260)}ms`;
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

      revealTargets.forEach((el) => io.observe(el));
    } else {
      revealTargets.forEach((el) => el.classList.add('reveal-in'));
    }

    // Subtle magnetic hover on CTA buttons
    const magneticButtons = $$('.btn');
    magneticButtons.forEach((btn) => {
      btn.classList.add('is-magnetic');
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate(${dx * 0.09}px, ${dy * 0.11}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });

    // Hero spotlight tracks pointer for depth
    const hero = $('.hero');
    if (hero) {
      hero.classList.add('is-interactive');
      hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--hero-x', `${x.toFixed(2)}%`);
        hero.style.setProperty('--hero-y', `${y.toFixed(2)}%`);
      });
    }
  }
})();

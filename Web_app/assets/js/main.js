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

  // Chat CTAs: attempt to bring the chat into focus and nudge the widget
  function nudgeChat() {
    const df = document.querySelector('df-messenger');
    if (!df) return;
    // Scroll to bottom to ensure bubble visible on long pages
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    // Add a temporary nudge animation class
    df.classList.add('df-nudge');
    setTimeout(() => df.classList.remove('df-nudge'), 1200);
    // Best-effort open attempt (may be ignored if unsupported)
    try { df.setAttribute('opened', 'true'); } catch(_) {}
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

  // Dialogflow diagnostics: log request/response and errors if available
  const df = document.querySelector('df-messenger');
  if (df) {
    try {
      df.addEventListener('df-request-sent', (e) => {
        console.log('[PrEP Bot][DF] request', e && e.detail);
      });
      df.addEventListener('df-response-received', (e) => {
        console.log('[PrEP Bot][DF] response', e && e.detail);
      });
      df.addEventListener('df-error', (e) => {
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

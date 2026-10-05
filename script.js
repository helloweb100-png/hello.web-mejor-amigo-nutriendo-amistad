/* =====================================================================
   MEJOR AMIGO · Nutriendo la Amistad
   script.js — JavaScript vanilla, sin dependencias
   ---------------------------------------------------------------------
   01 Config y helpers        08 Contadores           15 Formulario → WhatsApp
   02 Enlaces de WhatsApp     09 Manifiesto           16 Lightbox del flyer
   03 Split de palabras       10 Marquesinas          17 Hotspots del producto
   04 Loader                  11 Hero (typer+FX)      18 Efectos de puntero
   05 Menú móvil              12 Partículas (canvas)  19 Bucle de scroll
   06 Navegación activa       13 Catálogo (filtros)   20 WhatsApp flotante
   07 Revelado on-scroll      14 FAQ animado          21 Arranque
   ===================================================================== */
(() => {
  'use strict';

  /* ===================================================================
     01 · CONFIG Y HELPERS
     =================================================================== */
  const WA_NUMBER = '525551788092'; // 55 5178 8092 (México)
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  root.classList.add('js', 'is-loading');

  /** Ejecuta un módulo aislado: si uno falla, el resto de la página sigue viva. */
  const safe = (fn) => {
    try { fn(); } catch (err) { console.error('[Mejor Amigo]', err); }
  };

  /* ===================================================================
     02 · ENLACES DE WHATSAPP (mensajes prellenados por CTA)
     =================================================================== */
  const waUrl = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  function initWhatsAppLinks() {
    $$('[data-wa]').forEach((a) => { a.href = waUrl(a.dataset.wa); });
    $$('[data-wa-product]').forEach((a) => {
      a.href = waUrl(`¡Hola Mejor Amigo! 🐾 Me interesa: ${a.dataset.waProduct}. ¿Me compartes presentaciones y precios?`);
    });
  }

  /* ===================================================================
     03 · SPLIT DE PALABRAS (títulos con revelado palabra por palabra)
     =================================================================== */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'w__i';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('is-split');
  }

  /* ===================================================================
     04 · LOADER — spinner con progreso real + cortina de apertura
     =================================================================== */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) { startSite(); return; }

    const pct = $('#loaderPct');
    const bar = $('#loaderBar');
    const arc = $('#loaderArc');
    const msg = $('#loaderMsg');
    const messages = ['Preparando premios…', 'Calentando la cola…', 'Afinando el olfato…', '¡Todo listo, guau!'];
    const CIRC = 327; // 2πr con r = 52

    const MIN_MS = reduceMotion ? 250 : 2300; // tiempo mínimo para que se luzca
    const MAX_MS = 7000;                      // tope de seguridad
    const t0 = performance.now();
    let loaded = document.readyState === 'complete';
    window.addEventListener('load', () => { loaded = true; }, { once: true });

    let shown = 0;
    let finished = false;

    const paint = (p) => {
      const v = Math.round(p * 100);
      if (pct) pct.textContent = v;
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - p));
      if (msg) msg.textContent = messages[Math.min(messages.length - 1, Math.floor(p * messages.length))];
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      paint(1);
      setTimeout(() => {
        loader.classList.add('is-done');
        startSite();
        setTimeout(() => loader.classList.add('is-gone'), 1400);
      }, reduceMotion ? 0 : 380);
    };

    const frame = (now) => {
      const t = now - t0;
      // Progreso simulado (easeOut) que se detiene en 92% hasta que todo cargue
      const timeP = 1 - Math.pow(1 - clamp(t / MIN_MS, 0, 1), 3);
      let target = timeP * 0.92;
      if ((loaded && t >= MIN_MS) || t > MAX_MS) target = 1;
      shown += (target - shown) * (target === 1 ? 0.2 : 0.14);
      if (target === 1 && shown > 0.995) { finish(); return; }
      paint(shown);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /** Se ejecuta cuando el loader abre la cortina: libera el scroll y dispara el hero. */
  function startSite() {
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    $$('.hero [data-split]').forEach((el) => el.classList.add('is-in'));
    document.dispatchEvent(new CustomEvent('site:ready'));
  }

  /* ===================================================================
     05 · MENÚ MÓVIL
     =================================================================== */
  function initMenu() {
    const burger = $('#burger');
    const menu = $('#menu');
    if (!burger || !menu) return;
    menu.inert = true;

    const setOpen = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', open);
      menu.inert = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.matchMedia('(min-width: 980px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ===================================================================
     06 · NAVEGACIÓN ACTIVA (resalta la sección visible)
     =================================================================== */
  function initActiveNav() {
    if (!hasIO) return;
    const links = $$('.nav__links a');
    const map = new Map();
    links.forEach((a) => {
      const sec = $(a.getAttribute('href'));
      if (sec) map.set(sec, a);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-active'));
        const a = map.get(e.target);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, sec) => io.observe(sec));
  }

  /* ===================================================================
     07 · REVELADO AL HACER SCROLL
     =================================================================== */
  function initReveal() {
    // Escalonado automático por fila para hijos con data-reveal
    $$('[data-stagger]').forEach((parent) => {
      $$(':scope > [data-reveal]', parent).forEach((el, i) => el.style.setProperty('--d', `${(i % 4) * 0.08}s`));
    });
    $$('.pgrid > .pcard').forEach((el, i) => el.style.setProperty('--d', `${(i % 4) * 0.07}s`));

    const targets = $$('[data-reveal], [data-split]').filter((t) => !t.closest('.hero'));
    if (!hasIO || reduceMotion) { targets.forEach((t) => t.classList.add('is-in')); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ===================================================================
     08 · CONTADORES ANIMADOS
     =================================================================== */
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length || !hasIO || reduceMotion) return; // se quedan los valores finales del HTML

    const run = (el) => {
      const end = Number(el.dataset.count);
      const dur = 1700;
      const t0 = performance.now();
      const tick = (now) => {
        const p = clamp((now - t0) / dur, 0, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    els.forEach((el) => { el.textContent = '0'; });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ===================================================================
     09 · MANIFIESTO — el texto se ilumina palabra por palabra
     =================================================================== */
  const manifesto = { el: null, words: [], last: -1 };

  function initManifesto() {
    const el = $('#manifestoText');
    if (!el) return;
    const words = [];
    const walk = (node, highlight) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'mw' + (highlight ? ' is-hl' : '');
            s.textContent = part;
            words.push(s);
            frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child, highlight || child.tagName === 'MARK');
        }
      });
    };
    walk(el, false);
    manifesto.el = el;
    manifesto.words = words;
    if (reduceMotion) words.forEach((w) => w.classList.add('is-on'));
  }

  function updateManifesto(vh) {
    if (!manifesto.el || reduceMotion) return;
    const r = manifesto.el.getBoundingClientRect();
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.28), 0, 1);
    const n = Math.round(p * manifesto.words.length);
    if (n === manifesto.last) return;
    manifesto.last = n;
    manifesto.words.forEach((w, i) => w.classList.toggle('is-on', i < n));
  }

  /* ===================================================================
     10 · MARQUESINAS INFINITAS (duplica el contenido para el loop)
     =================================================================== */
  function initMarquees() {
    $$('[data-loop]').forEach((track) => {
      track.innerHTML += track.innerHTML;
    });
  }

  /* ===================================================================
     11 · HERO — typewriter + parallax del mouse
     =================================================================== */
  const pointer = { x: -9999, y: -9999, nx: 0, ny: 0 };

  function initTyper() {
    const el = $('#typer');
    if (!el || reduceMotion) return;
    const words = [
      'Patitas de pollo', 'Hígado de res', 'Oreja de cerdo', 'Corazón de res', 'Pulmón de res',
      'Fémur de cerdo', 'Tráquea de res', 'Riñón de res', 'Pezuñas de res', 'Carnes de res',
      'Oreja de res', 'Hígado de pollo', 'Cabezas y pescuezo',
    ];
    let wi = 0;
    let ci = words[0].length;
    let deleting = true;

    const step = () => {
      const word = words[wi];
      if (!deleting) {
        ci += 1;
        el.textContent = word.slice(0, ci);
        if (ci >= word.length) { deleting = true; setTimeout(step, 1700); return; }
        setTimeout(step, 60 + Math.random() * 45);
        return;
      }
      ci -= 1;
      el.textContent = word.slice(0, Math.max(ci, 0));
      if (ci <= 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        setTimeout(step, 260);
        return;
      }
      setTimeout(step, 30);
    };
    document.addEventListener('site:ready', () => setTimeout(step, 2800), { once: true });
  }

  function initHeroParallax() {
    const hero = $('#inicio');
    const visual = $('#heroVisual');
    if (!hero || !visual || !finePointer || reduceMotion) return;

    let cx = 0, cy = 0, visible = true, raf = 0;

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.nx = (pointer.x / r.width - 0.5) * 2;
      pointer.ny = (pointer.y / r.height - 0.5) * 2;
    });
    hero.addEventListener('pointerleave', () => {
      pointer.x = pointer.y = -9999;
      pointer.nx = pointer.ny = 0;
    });

    const loop = () => {
      cx = lerp(cx, pointer.nx, 0.07);
      cy = lerp(cy, pointer.ny, 0.07);
      visual.style.setProperty('--px', cx.toFixed(4));
      visual.style.setProperty('--py', cy.toFixed(4));
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    if (hasIO) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(loop);
      }).observe(hero);
    }
    raf = requestAnimationFrame(loop);
  }

  /* ===================================================================
     12 · PARTÍCULAS (canvas): puntos, red de conexiones y huellitas
     =================================================================== */
  function initParticles() {
    const canvas = $('#particles');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = ['111,168,236', '255,138,42', '233,239,250'];
    let w = 0, h = 0, dpr = 1, parts = [], running = false, raf = 0, inView = true;

    const spawn = (initial) => {
      const paw = Math.random() < 0.15;
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 24,
        r: paw ? 7 + Math.random() * 9 : 0.9 + Math.random() * 2.1,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(0.12 + Math.random() * 0.42),
        paw,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.012,
        a: paw ? 0.07 + Math.random() * 0.1 : 0.25 + Math.random() * 0.55,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        ph: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp((w * h) / 17000, 24, 84));
      parts = Array.from({ length: n }, () => spawn(true));
    };

    const drawPaw = (p) => {
      const s = p.r;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.beginPath(); ctx.ellipse(0, s * 0.35, s * 0.55, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      [[-0.72, -0.12], [-0.25, -0.62], [0.25, -0.62], [0.72, -0.12]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.ellipse(dx * s, dy * s, s * 0.22, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    };

    const tick = (t) => {
      ctx.clearRect(0, 0, w, h);
      const dots = [];
      for (const p of parts) {
        p.x += p.vx + Math.sin(t * 0.0006 + p.ph) * 0.16;
        p.y += p.vy;
        p.rot += p.vr;

        // Repulsión suave del puntero
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 16900) {
          const d = Math.sqrt(d2) || 1;
          const f = (130 - d) / 130;
          p.x += (dx / d) * f * 2.4;
          p.y += (dy / d) * f * 2.4;
        }

        if (p.y < -30 || p.x < -40 || p.x > w + 40) Object.assign(p, spawn(false));

        if (p.paw) { drawPaw(p); continue; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        dots.push(p);
      }

      // Red de conexiones entre puntos cercanos (efecto "tech")
      const max = Math.min(dots.length, 46);
      for (let i = 0; i < max; i++) {
        for (let j = i + 1; j < max; j++) {
          const a = dots[i], b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 12100) {
            ctx.strokeStyle = `rgba(111,168,236,${(1 - Math.sqrt(d2) / 110) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const start = () => { if (!running && inView && !document.hidden) { running = true; raf = requestAnimationFrame(tick); } };
    const stop = () => { running = false; };

    resize();
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if (hasIO) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : stop(); }).observe(canvas.parentElement);
    }
    start();
  }

  /* ===================================================================
     13 · CATÁLOGO — filtros animados + CTA que cierra la fila
     =================================================================== */
  function initCatalog() {
    const grid = $('#pgrid');
    if (!grid) return;
    const cards = $$('.pcard[data-cat]', grid);
    const cta = $('#pgridCta');
    const buttons = $$('.filter');

    const columns = () => getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const fitCta = () => {
      if (!cta) return;
      const visible = cards.filter((c) => !c.hidden).length;
      const n = columns();
      const rest = visible % n;
      cta.style.setProperty('--span', rest === 0 ? n : n - rest);
    };

    const apply = (cat, animate = true) => {
      let k = 0;
      cards.forEach((c) => {
        const show = cat === 'all' || c.dataset.cat === cat;
        c.hidden = !show;
        c.classList.remove('is-filtered-in');
        if (show && animate && !reduceMotion) {
          c.style.setProperty('--k', k++);
          void c.offsetWidth; // reinicia la animación
          c.classList.add('is-filtered-in');
        }
      });
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
      fitCta();
    };

    buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter)));
    $$('[data-jump-filter]').forEach((a) => a.addEventListener('click', () => apply(a.dataset.jumpFilter)));
    window.addEventListener('resize', fitCta);
    fitCta();
  }

  /* ===================================================================
     14 · FAQ — acordeón con animación de altura (usa <details>)
     =================================================================== */
  function initFaq() {
    const items = $$('.qa');
    if (!items.length) return;

    const close = (d) => {
      const body = $('.qa__a', d);
      if (reduceMotion || !body.animate) { d.open = false; return; }
      const h = body.offsetHeight;
      const anim = body.animate({ height: [`${h}px`, '0px'] }, { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
      anim.onfinish = () => { d.open = false; anim.cancel(); };
    };
    const open = (d) => {
      d.open = true;
      const body = $('.qa__a', d);
      if (reduceMotion || !body.animate) return;
      body.animate({ height: ['0px', `${body.scrollHeight}px`] }, { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
    };

    items.forEach((d) => {
      $('summary', d).addEventListener('click', (e) => {
        e.preventDefault();
        if (d.open) { close(d); return; }
        items.forEach((o) => { if (o !== d && o.open) close(o); });
        open(d);
      });
    });
  }

  /* ===================================================================
     15 · FORMULARIO → WHATSAPP
     =================================================================== */
  function initForm() {
    const form = $('#orderForm');
    if (!form) return;
    const nameInput = $('#f-nombre');
    const errName = $('#err-nombre');
    const errForm = $('#err-form');
    const status = $('#formStatus');

    nameInput.addEventListener('input', () => {
      nameInput.removeAttribute('aria-invalid');
      errName.textContent = '';
    });
    form.addEventListener('change', () => { errForm.textContent = ''; });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const nombre = String(data.get('nombre') || '').trim();
      const perro = String(data.get('perro') || '').trim();
      const tamano = String(data.get('tamano') || '');
      const premios = data.getAll('premios').map(String);
      const mensaje = String(data.get('mensaje') || '').trim();

      errName.textContent = '';
      errForm.textContent = '';
      status.textContent = '';
      status.classList.remove('is-ok');
      nameInput.removeAttribute('aria-invalid');

      if (nombre.length < 2) {
        errName.textContent = 'Dinos tu nombre para saludarte.';
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.focus();
        return;
      }
      if (!premios.length && !mensaje) {
        errForm.textContent = 'Elige al menos un premio o cuéntanos qué buscas.';
        return;
      }

      const lines = ['¡Hola Mejor Amigo! 🐾', `Soy ${nombre}${perro ? ` y mi perro se llama ${perro}` : ''}.`];
      if (tamano) lines.push(`Es un perro ${tamano}.`);
      if (premios.length) {
        lines.push('', 'Me gustaría pedir:');
        premios.forEach((p) => lines.push(`• ${p}`));
      }
      if (mensaje) lines.push('', `Mensaje: ${mensaje}`);
      lines.push('', '¿Me confirman disponibilidad, presentaciones y precios? ¡Gracias!');

      const url = waUrl(lines.join('\n'));
      window.open(url, '_blank', 'noopener');

      status.classList.add('is-ok');
      status.textContent = '¡Listo! Abrimos WhatsApp con tu pedido. ¿No se abrió? ';
      const link = document.createElement('a');
      link.href = url; link.target = '_blank'; link.rel = 'noopener';
      link.textContent = 'Toca aquí para enviarlo';
      status.appendChild(link);
    });
  }

  /* ===================================================================
     16 · LIGHTBOX DEL FLYER (<dialog> nativo)
     =================================================================== */
  function initLightbox() {
    const dlg = $('#flyerDialog');
    const openBtn = $('#flyerBtn');
    const closeBtn = $('#flyerClose');
    if (!dlg || !openBtn) return;
    openBtn.addEventListener('click', () => (typeof dlg.showModal === 'function' ? dlg.showModal() : dlg.setAttribute('open', '')));
    closeBtn.addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* ===================================================================
     17 · HOTSPOTS DEL PRODUCTO (tap en móvil)
     =================================================================== */
  function initHotspots() {
    const spots = $$('.hot');
    spots.forEach((s) => s.addEventListener('click', (e) => {
      e.stopPropagation();
      const was = s.classList.contains('is-open');
      spots.forEach((o) => o.classList.remove('is-open'));
      if (!was) s.classList.add('is-open');
    }));
    document.addEventListener('click', () => spots.forEach((o) => o.classList.remove('is-open')));
  }

  /* ===================================================================
     18 · EFECTOS DE PUNTERO — tilt 3D, spotlight, magnetismo, glow
     =================================================================== */
  function initPointerFX() {
    if (!finePointer || reduceMotion) return;

    // Tilt 3D
    $$('[data-tilt]').forEach((el) => {
      const max = el.classList.contains('shot') ? 5 : 7;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // Spotlight que sigue al cursor
    $$('[data-spot]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    // Botones magnéticos
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', `${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px`);
        el.style.setProperty('--ty', `${((e.clientY - r.top - r.height / 2) * 0.32).toFixed(1)}px`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
      });
    });

    // Resplandor que sigue al cursor
    const glow = $('#cursorGlow');
    if (glow) {
      let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
      window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add('is-on'); }, { passive: true });
      document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
      const follow = () => {
        gx = lerp(gx, tx, 0.12);
        gy = lerp(gy, ty, 0.12);
        glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
        requestAnimationFrame(follow);
      };
      follow();
    }
  }

  /* ===================================================================
     19 · BUCLE ÚNICO DE SCROLL (progreso, header, manifiesto, pasos…)
     =================================================================== */
  function initScrollLoop() {
    const progress = $('#progress');
    const header = $('#header');
    const hero = $('#inicio');
    const steps = $('#steps');
    const stepItems = steps ? $$('.step', steps) : [];
    const rows = $$('[data-sx]');
    const thresholds = [0.06, 0.4, 0.76];
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = root.scrollHeight - vh;

      if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
      if (header) header.classList.toggle('is-scrolled', y > 12);

      // Hero: la copia y la mascota se separan sutilmente al salir
      if (hero && y < vh * 1.2) hero.style.setProperty('--hs', clamp(y / vh, 0, 1).toFixed(3));

      updateManifesto(vh);

      // Línea de progreso de "Cómo pedir"
      if (steps) {
        const r = steps.getBoundingClientRect();
        const p = clamp((vh * 0.78 - r.top) / (r.height + vh * 0.05), 0, 1);
        steps.style.setProperty('--p', p.toFixed(3));
        stepItems.forEach((s, i) => s.classList.toggle('is-active', p > (thresholds[i] ?? 1)));
      }

      // Texto gigante horizontal
      rows.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const dir = Number(el.dataset.sx);
        const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
        const base = dir > 0 ? -30 : 0;
        el.style.setProperty('--sx', `${(base + dir * p * 20).toFixed(2)}%`);
      });
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ===================================================================
     20 · WHATSAPP FLOTANTE — burbuja de ayuda
     =================================================================== */
  function initWaFloat() {
    const wa = $('#waFloat');
    if (!wa) return;
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      wa.classList.add('show-tip');
      setTimeout(() => wa.classList.remove('show-tip'), 6500);
    };
    document.addEventListener('site:ready', () => setTimeout(show, 8000), { once: true });
    wa.addEventListener('click', () => wa.classList.remove('show-tip'));
  }

  /* ===================================================================
     21 · ARRANQUE
     =================================================================== */
  function boot() {
    safe(initWhatsAppLinks);
    $$('[data-split]').forEach((el) => safe(() => splitWords(el)));
    safe(initMarquees);
    safe(initManifesto);
    safe(initMenu);
    safe(initLoader);
    safe(initReveal);
    safe(initCounters);
    safe(initActiveNav);
    safe(initCatalog);
    safe(initFaq);
    safe(initForm);
    safe(initLightbox);
    safe(initHotspots);
    safe(initPointerFX);
    safe(initTyper);
    safe(initHeroParallax);
    safe(initParticles);
    safe(initScrollLoop);
    safe(initWaFloat);

    // Si una imagen falla (red/ruta), se oculta en vez de mostrar el ícono roto
    document.addEventListener('error', (e) => {
      if (e.target instanceof HTMLImageElement) e.target.classList.add('img-error');
    }, true);

    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

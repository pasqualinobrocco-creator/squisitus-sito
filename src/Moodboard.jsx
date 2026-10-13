import React, { useEffect, useRef, useState } from 'react';

// "Moodboard – Campagna media": the tiles keep their place in the grid, the photos move between them.
// Every few seconds two tiles swap photos with a crossfade, and each photo drifts slowly (Ken Burns).
// Hovering a tile pauses it and shows the photo in full colour with its caption.
// Off with prefers-reduced-motion / the accessibility "still" option, paused while off screen.

const SWAP_MS = 2600;
const FADE_MS = 1400;
const DUSK = 'grayscale(.3) sepia(.2) saturate(.9) contrast(1.05) brightness(.96)';

const still = () =>
  (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
  document.documentElement.hasAttribute('data-a11y-still');

export default function Moodboard({ photos, tiles, cols, row }) {
  // order[t] = photo shown in tile t; prev[t] = photo fading out underneath
  const [order, setOrder] = useState(() => photos.map((_, i) => i));
  const [prev, setPrev] = useState(() => photos.map(() => null));
  const [hover, setHover] = useState(-1);
  const ref = useRef(null);
  const visible = useRef(false);
  const hoverRef = useRef(-1);
  hoverRef.current = hover;
  const orderRef = useRef(order);
  orderRef.current = order;

  useEffect(() => {
    const el = ref.current;
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.15 })
      : null;
    if (io && el) io.observe(el); else visible.current = true;

    const timer = setInterval(() => {
      if (!visible.current || document.hidden || still()) return;
      const n = photos.length;
      const free = [...Array(n).keys()].filter(t => t !== hoverRef.current);
      if (free.length < 2) return;
      const a = free[Math.floor(Math.random() * free.length)];
      let b = free[Math.floor(Math.random() * free.length)];
      if (b === a) b = free[(free.indexOf(a) + 1 + Math.floor(Math.random() * (free.length - 1))) % free.length];
      const o = orderRef.current, next = [...o];
      [next[a], next[b]] = [o[b], o[a]];
      setPrev(p => { const q = [...p]; q[a] = o[a]; q[b] = o[b]; return q; });
      setOrder(next);
      // drop the faded-out layers once the crossfade is over
      setTimeout(() => setPrev(p => { const q = [...p]; q[a] = null; q[b] = null; return q; }), FADE_MS + 100);
    }, SWAP_MS);

    return () => { clearInterval(timer); io && io.disconnect(); };
  }, [photos.length]);

  return (
    <div ref={ref} data-rv="" data-sq-anim="" className="sq-mood" style={{ display: 'grid', gridTemplateColumns: cols, gridAutoRows: row, gap: '6px' }}>
      {tiles.map((t, i) => {
        const p = photos[order[i]];
        const old = prev[i] != null ? photos[prev[i]] : null;
        const on = hover === i;
        return (
          <figure key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(h => (h === i ? -1 : h))}
            style={{ position: 'relative', margin: 0, overflow: 'hidden', background: '#E3E3E3', gridColumn: 'span ' + t.c, gridRow: 'span ' + t.r }}>
            {/* slow drift, different speed and phase for every tile */}
            <div className="sq-mood-kb" style={{ position: 'absolute', inset: 0, animationDuration: (14 + (i * 3) % 9) + 's', animationDelay: (-i * 2.3) + 's', animationPlayState: on ? 'paused' : 'running' }}>
              {old && <img src={old.src} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: old.pos, filter: DUSK }} />}
              <img key={order[i]} src={p.src} alt={p.alt} loading="lazy" className={old ? 'sq-mood-in' : undefined}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.pos, filter: on ? 'none' : DUSK, transform: on ? 'scale(1.05)' : 'none', transition: 'filter .9s ease, transform 1.2s cubic-bezier(.22,1,.36,1)' }} />
            </div>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#A5143B', mixBlendMode: 'multiply', opacity: on ? 0 : 0.14, transition: 'opacity .9s ease', pointerEvents: 'none' }} />
            <figcaption style={{ position: 'absolute', left: 0, bottom: 0, padding: '8px 12px', background: '#A5143B', color: '#fff', fontFamily: 'Oswald,sans-serif', fontWeight: 600, fontSize: '12px', letterSpacing: '.16em', textTransform: 'uppercase', transform: on ? 'translateY(0)' : 'translateY(101%)', transition: 'transform .5s cubic-bezier(.22,1,.36,1)' }}>
              {p.cap}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

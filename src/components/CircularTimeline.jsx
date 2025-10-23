import { useRef, useState } from 'react';

function getIconForEvent(title) {
  // Determine icon based on title keywords
  if (title.toLowerCase().includes('intern')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (title.toLowerCase().includes('volunteer')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  if (title.toLowerCase().includes('unity')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 8l4 4m0 0l-4 4m4-4H3m4-8L3 8m0 0l4 4" />
      </svg>
    );
  }
  if (title.toLowerCase().includes('b.s.') || title.toLowerCase().includes('computer science')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    );
  }
  // Default icon
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}

function renderPointIcon(icon, title) {
  if (icon) {
    if (typeof icon === 'string' && (icon.startsWith('/') || icon.startsWith('http'))) {
      return <img src={icon} alt="" className="point-icon-img" loading="lazy" />;
    }
    return <span className="point-icon-emoji" aria-hidden>{icon}</span>;
  }
  return getIconForEvent(title || '');
}

export default function CircularTimeline({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const leaveTimer = useRef(null);

  // SVG / layout constants (match sizes in CSS)
  const width = 800;
  const height = 800;
  const inset = 50; // matches .circle-base inset in CSS
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - inset; // 250
  const bandThickness = 56;

  // Arch angles (degrees). Using 200 -> -20 (which normalizes to 340) gives a nice top arch.
  const startAngle = 200;
  const endAngle = -20; // will normalize to 340 internally

  function normalizeEnd(start, end) {
    let e = end;
    if (e < start) e = e + 360;
    return e;
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * r,
      y: cy + Math.sin(rad) * r,
    };
  }

  function describeArc(cx, cy, r, startDeg, endDeg) {
    const start = polarToCartesian(cx, cy, r, endDeg);
    const end = polarToCartesian(cx, cy, r, startDeg);
    const largeArcFlag = endDeg - startDeg <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  // Filled annular sector for 2D arc band
  function describeArcSector(cx, cy, rOuter, rInner, startDeg, endDeg) {
    const largeArcFlag = endDeg - startDeg <= 180 ? '0' : '1';
    const outerStart = polarToCartesian(cx, cy, rOuter, endDeg);
    const outerEnd = polarToCartesian(cx, cy, rOuter, startDeg);
    const innerStart = polarToCartesian(cx, cy, rInner, startDeg);
    const innerEnd = polarToCartesian(cx, cy, rInner, endDeg);
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');
  }

  const normalizedEnd = normalizeEnd(startAngle, endAngle);
  const span = normalizedEnd - startAngle;

  // Old→new left→right: sort items ascending by detected start year
  function parseStartYear(it) {
    if (it.year) return Number(String(it.year).match(/\d{4}/)?.[0]);
    if (it.date) {
      const m = String(it.date).match(/(19|20)\d{2}/);
      if (m) return Number(m[0]);
    }
    // fallback: try title
    const m2 = String(it.title || '').match(/(19|20)\d{2}/);
    return m2 ? Number(m2[0]) : Number.MIN_SAFE_INTEGER;
  }
  const itemsSorted = [...items].sort((a,b) => parseStartYear(a) - parseStartYear(b));

  // Segment math: divide the arc into equally-sized tiles with an optional gap
  const rOuter = radius + bandThickness / 2;
  const rInner = radius - bandThickness / 2;
  const rOuterHit = rOuter + 8; // expanded hit area
  const rInnerHit = Math.max(0, rInner - 8);
  const gapDeg = 0; // no visible gaps; separators are drawn as strokes
  const slot = itemsSorted.length > 0 ? span / itemsSorted.length : span;
  const segments = itemsSorted.map((item, i) => {
    const segStart = startAngle + i * slot + gapDeg / 2;
    const segEnd = startAngle + (i + 1) * slot - gapDeg / 2;
    const mid = (segStart + segEnd) / 2;
    return { segStart, segEnd, mid, item, index: i };
  });

  // Arrow wedge (triangular pointer) path for a segment
  function describeArrow(cx, cy, rBase, length, midDeg, spreadDeg = 10) {
    const left = polarToCartesian(cx, cy, rBase, midDeg - spreadDeg);
    const right = polarToCartesian(cx, cy, rBase, midDeg + spreadDeg);
    const tip = polarToCartesian(cx, cy, rBase + length, midDeg);
    return `M ${left.x} ${left.y} L ${tip.x} ${tip.y} L ${right.x} ${right.y} Z`;
  }

  function yearFrom(dateStr) {
    if (!dateStr) return '';
    const m = dateStr.match(/(20\d{2})/);
    return m ? m[1] : dateStr;
  }

  function handleEnter(idx) {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setActiveIndex(idx);
  }

  function handleLeave() {
    // small hysteresis to avoid flicker when crossing separators
    leaveTimer.current = setTimeout(() => setActiveIndex(null), 80);
  }

  return (
    <section className="timeline-section">
      <h2>Timeline</h2>

      <div className="timeline-circle" style={{ width, height }}>
        {/* SVG: continuous band, per-segment hit areas, separators, arrow */}
        <svg className="timeline-arc" viewBox={`0 0 ${width} ${height}`} aria-hidden>
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(96,165,250,0.35)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.08)" />
            </linearGradient>
            {segments.map((s) => (
              <clipPath id={`segclip-${s.index}`}> 
                <path d={describeArcSector(cx, cy, rOuter, rInner, s.segStart, s.segEnd)} />
              </clipPath>
            ))}
          </defs>
          {/* base continuous band */}
          <path
            className="timeline-band"
            d={describeArcSector(cx, cy, rOuter, rInner, startAngle, normalizedEnd)}
          />
          {/* separators (radial strokes) */}
          {segments.map((s, i) => (
            i === 0 ? null : (
              <path
                key={`sep-${i}`}
                className="timeline-sep"
                d={`M ${polarToCartesian(cx, cy, rInner, s.segStart).x} ${polarToCartesian(cx, cy, rInner, s.segStart).y} L ${polarToCartesian(cx, cy, rOuter, s.segStart).x} ${polarToCartesian(cx, cy, rOuter, s.segStart).y}`}
              />
            )
          ))}
          {segments.map((s) => (
            <g
              key={`seg-${s.index}`}
              className={`timeline-seg-group ${activeIndex === s.index ? 'active' : ''}`}
              onPointerEnter={() => handleEnter(s.index)}
              onPointerLeave={handleLeave}
              style={{
                '--vecx': String(Math.cos((s.mid * Math.PI) / 180)),
                '--vecy': String(Math.sin((s.mid * Math.PI) / 180)),
              }}
            >
              {/* invisible hit area matching the segment */}
              <path
                className="timeline-seg__hit"
                d={describeArcSector(cx, cy, rOuterHit, rInnerHit, s.segStart, s.segEnd)}
              />
              {/* subtle highlight fill on hover/active */}
              <path
                className="timeline-seg__highlight"
                d={describeArcSector(cx, cy, rOuter, rInner, s.segStart, s.segEnd)}
              />
              {/* arrow wedge animates on hover/active */}
              <path
                className="timeline-seg__arrow"
                d={describeArrow(cx, cy, rOuter - 2, 26, s.mid, 9)}
              />
              {/* thumbnails disabled per design feedback */}
              {/* subtle border highlight on active */}
              <path
                className="timeline-seg__border"
                d={describeArcSector(cx, cy, rOuter, rInner, s.segStart, s.segEnd)}
                fill="none"
              />
              {/* Bigger year label near the inner edge */}
              <text
                className="timeline-seg__year"
                x={cx + Math.cos((s.mid * Math.PI) / 180) * (rInner + 14)}
                y={cy + Math.sin((s.mid * Math.PI) / 180) * (rInner + 14)}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {yearFrom(s.item.date)}
              </text>
            </g>
          ))}

        </svg>

        {/* Neon "Tron" traces for visited segments */}
        <svg className="timeline-tron-layer" viewBox={`0 0 ${width} ${height}`} aria-hidden>
          {activeIndex != null ? (
            (() => {
              const s = segments[activeIndex];
              if (!s) return null;
              return (
                <path
                  className="timeline-tron active"
                  d={describeArc(cx, cy, radius, s.segStart, s.segEnd)}
                  fill="none"
                />
              );
            })()
          ) : null}
        </svg>

        {/* Fixed info panel inside the arc (not blocking tiles) */}
        {(() => {
          const active = activeIndex != null ? segments[activeIndex] : null;
          if (!active) return null;
          // squeeze panel inside the arc just below the top inner edge
          const margin = 36;
          const panelTop = cy - (rInner - margin);
          return (
            <div className="timeline-info-fixed" style={{ left: '50%', top: panelTop }}>
              <div className="info-card visible">
                <div className="card-date">{active.item.date}</div>
                <h3>{active.item.title}</h3>
                {(() => {
                  const fallback = '/images/luca-hero.jpg';
                  const src = active.item.thumb || fallback;
                  return (
                    <div className="card-image-container" style={{ marginTop: '10px', border: '2px solid #f33' }}>
                      <img
                        src={src}
                        alt=""
                        className="card-image"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = '1';
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                      <div className="card-src-debug">{src || 'no-src'}</div>
                    </div>
                  );
                })()}
                <p style={{ marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: active.item.blurb }} />
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}

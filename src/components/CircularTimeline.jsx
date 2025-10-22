import { useState } from 'react';

export default function CircularTimeline({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  // SVG / layout constants (match sizes in CSS)
  const width = 600;
  const height = 600;
  const inset = 50; // matches .circle-base inset in CSS
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - inset; // 250

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

  const normalizedEnd = normalizeEnd(startAngle, endAngle);
  const span = normalizedEnd - startAngle;
  const step = items.length > 1 ? span / (items.length - 1) : 0;

  return (
    <section className="timeline-section">
      <h2>Timeline</h2>

      <div className="timeline-circle" style={{ width, height }}>
        {/* SVG arc (glow + stroke) */}
        <svg className="timeline-arc" viewBox={`0 0 ${width} ${height}`} aria-hidden>
          <path
            className="timeline-arc__glow"
            d={describeArc(cx, cy, radius, startAngle, normalizedEnd)}
            fill="none"
          />
          <path
            className="timeline-arc__stroke"
            d={describeArc(cx, cy, radius, startAngle, normalizedEnd)}
            fill="none"
          />
        </svg>

        <div className="points-container">
          {items.map((item, i) => {
            const angle = startAngle + step * i;
            // position relative to center
            const pos = polarToCartesian(0, 0, radius, angle);
            // Because points-container is centered at 50%/50% we can use pos.x/pos.y directly
            // Adjust: polarToCartesian returned absolute coords; convert to offsets from center
            const offsetX = Math.cos((angle * Math.PI) / 180) * radius;
            const offsetY = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div
                key={i}
                className={`timeline-point ${activeIndex === i ? 'active' : ''}`}
                style={{
                  transform: `translate(${offsetX}px, ${offsetY}px)`,
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  className="point-marker"
                  tabIndex={0}
                  role="button"
                  aria-label={`Timeline event ${i + 1}: ${item.title}`}
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveIndex(i);
                    } else if (e.key === 'Escape') {
                      setActiveIndex(null);
                    }
                  }}
                >
                  <div className="glow" />
                </div>

                <div className="info-card">
                  <div className="card-date">{item.date}</div>
                  <h3>{item.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: item.blurb }} />
                  {item.thumb && (
                    <img src={item.thumb} alt="" className="card-image" loading="lazy" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
import { useEffect, useMemo, useRef, useState } from 'react';

const TRACK_PATH =
  'M 360 40 C 320 120 280 200 300 280 C 320 360 380 380 450 440 C 520 500 540 580 500 640 C 460 700 360 740 320 810 C 280 880 300 950 360 1000';
const TRACK_VIEWBOX = { width: 720, height: 1060 };

function extractYear(value) {
  if (!value) return null;
  const match = String(value).match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function normalizeItems(items = []) {
  const enriched = items.map((item, index) => ({
    ...item,
    _year:
      extractYear(item.date) ??
      extractYear(item.title) ??
      extractYear(item.blurb) ??
      extractYear(item?.year),
    _originalIndex: index,
  }));

  const withYear = enriched
    .filter((it) => typeof it._year === 'number')
    .sort((a, b) => a._year - b._year);
  const withoutYear = enriched
    .filter((it) => typeof it._year !== 'number')
    .sort((a, b) => a._originalIndex - b._originalIndex);

  const ordered = [...withYear, ...withoutYear];
  const denom = Math.max(ordered.length - 1, 1);

  return ordered.map((item, index) => {
    const ratio = denom === 0 ? 0 : index / denom;
    return {
      ...item,
      progress: ratio,
      percent: ratio * 100,
      label: item.date || item.title || `Milestone ${index + 1}`,
    };
  });
}

export default function TrackTimeline({ items = [] }) {
  const sectionRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const milestones = useMemo(() => normalizeItems(items), [items]);
  const activeIndex =
    milestones.length > 1
      ? Math.min(
          milestones.length - 1,
          Math.round(progress * (milestones.length - 1))
        )
      : 0;
  const activeMilestone = milestones[activeIndex] ?? milestones[0] ?? null;

  const [geometry, setGeometry] = useState({
    scaleX: 1,
    scaleY: 1,
    length: 0,
    markerPoints: [],
    offsetX: 0,
    offsetY: 0,
    overlayWidth: 1,
    overlayHeight: 1,
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    function computeProgress() {
      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;
      const total = Math.max(rect.height - windowH, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const ratio = scrolled / total;
      setProgress((prev) => {
        const next = Math.min(Math.max(ratio, 0), 1);
        return Math.abs(prev - next) < 0.002 ? prev : next;
      });
    }

    function requestMeasure() {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        computeProgress();
      });
    }

    computeProgress();
    window.addEventListener('scroll', requestMeasure, { passive: true });
    window.addEventListener('resize', requestMeasure);
    return () => {
      window.removeEventListener('scroll', requestMeasure);
      window.removeEventListener('resize', requestMeasure);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    const pathEl = pathRef.current;
    if (!svgEl || !pathEl) return;

    function measure() {
      const rect = svgEl.getBoundingClientRect();
      const overlayRect = svgEl.parentElement?.getBoundingClientRect();
      const offsetX = overlayRect ? rect.left - overlayRect.left : 0;
      const offsetY = overlayRect ? rect.top - overlayRect.top : 0;
      const scaleX = rect.width / TRACK_VIEWBOX.width;
      const scaleY = rect.height / TRACK_VIEWBOX.height;
      const length = pathEl.getTotalLength();
      const markerPoints = milestones.map((item) => {
        const pt = pathEl.getPointAtLength(length * item.progress);
        return {
          x: pt.x * scaleX + offsetX,
          y: pt.y * scaleY + offsetY,
        };
      });
      setGeometry({
        scaleX,
        scaleY,
        length,
        markerPoints,
        offsetX,
        offsetY,
        overlayWidth: overlayRect?.width || rect.width,
        overlayHeight: overlayRect?.height || rect.height,
      });
    }

    measure();
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    if (ro) ro.observe(svgEl);
    window.addEventListener('resize', measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [milestones]);

  const stageWidth = geometry.overlayWidth || 1;
  const stageHeight = geometry.overlayHeight || 1;

  const carPoint = useMemo(() => {
    const pathEl = pathRef.current;
    if (!pathEl || geometry.length <= 0) return null;
    const distance = geometry.length * progress;
    const point = pathEl.getPointAtLength(distance);
    const prev = pathEl.getPointAtLength(Math.max(0, distance - 2));
    const angle = Math.atan2(point.y - prev.y, point.x - prev.x);
    const offset = 36;
    return {
      x: point.x * geometry.scaleX + geometry.offsetX,
      y: point.y * geometry.scaleY + geometry.offsetY + offset,
      angle: (angle * 180) / Math.PI,
    };
  }, [geometry, progress]);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  return (
    <section className="track-timeline" ref={sectionRef}>
      <div className="track-timeline__inner">
        <div className="track-stage">
          <div
            className="track-visual"
            style={{
              '--track-path': `path('${TRACK_PATH}')`,
            }}
          >
            <svg
              className="track-svg"
              viewBox="0 0 720 1060"
              preserveAspectRatio="none"
              ref={svgRef}
              role="presentation"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="trackFill"
                  x1="0%"
                  x2="100%"
                  y1="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgba(96, 165, 250, 0.95)" />
                  <stop offset="100%" stopColor="rgba(96, 165, 250, 0.95)" />
                </linearGradient>
                <linearGradient id="trackEdge" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
                </linearGradient>
                <filter id="trackGlow" x="-15%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="18" />
                </filter>
              </defs>

              <path
                className="track-shadow"
                d={TRACK_PATH}
                ref={pathRef}
                fill="none"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="88"
                strokeLinecap="round"
                filter="url(#trackGlow)"
              />
              <path
                className="track-body"
                d={TRACK_PATH}
                stroke="url(#trackFill)"
                strokeWidth="72"
                strokeLinecap="round"
                fill="none"
              />
              <path
                className="track-edge"
                d={TRACK_PATH}
                stroke="url(#trackEdge)"
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
              />
            </svg>

            <div className="track-overlay">
              {carPoint && (
                <div
                  className="track-car"
                  style={{
                    transform: `translate(${carPoint.x - 60}px, ${
                      carPoint.y - 60
                    }px) rotate(${carPoint.angle}deg)`,
                  }}
                  aria-hidden
                >
                  <div className="car-shadow" />
                  <div className="car-body">
                    <svg viewBox="0 0 120 48" aria-hidden="true" focusable="false">
                      <path
                        d="M8 24h12l8-8h20l6-6h20l6 6h8l6-6h8v12h-8l-6-6-6 6h-8l-6 6h-12l-12 12H20z"
                        fill="#0f172a"
                        stroke="#60a5fa"
                        strokeWidth="2"
                      />
                      <rect x="40" y="10" width="28" height="28" rx="4" fill="#ef4444" />
                      <circle cx="28" cy="38" r="7" fill="#0f172a" stroke="#e5e7eb" />
                      <circle cx="90" cy="38" r="7" fill="#0f172a" stroke="#e5e7eb" />
                    </svg>
                  </div>
                </div>
              )}

              {milestones.map((item, index) => {
                const reached = progress >= item.progress - 0.01;
                const label = item.date || item.year || `Event ${index + 1}`;
                const point = geometry.markerPoints[index];
                if (!point) return null;
                return (
                  <div
                    key={`${item.label}-${index}`}
                    className={`track-marker${reached ? ' reached' : ''}${
                      index === activeIndex ? ' active' : ''
                    }`}
                    style={{
                      left: `${point.x}px`,
                      top: `${point.y}px`,
                      zIndex: 10 + index,
                    }}
                    aria-label={`${label} checkpoint`}
                  >
                    <div className="marker-stem" />
                    <div className="marker-pin" aria-hidden="true">
                      <span className="pin-core" />
                    </div>
                    <p className="marker-label">{label}</p>
                  </div>
                );
              })}
            </div>
              {activeMilestone && carPoint && (
                <div
                  className="track-info"
                  style={{
                    left: `${clamp(carPoint.x, 120, stageWidth - 120)}px`,
                    top: `${clamp(carPoint.y, 100, stageHeight - 140)}px`,
                    '--card-side':
                      carPoint.x > (TRACK_VIEWBOX.width * geometry.scaleX) / 2 ? 1 : -1,
                  }}
                >
                <article className="info-card" aria-live="polite">
                  <p className="marker-date">
                    {activeMilestone.date || activeMilestone.year || 'Milestone'}
                  </p>
                  <h3>{activeMilestone.title}</h3>
                  <p
                    className="marker-blurb"
                    dangerouslySetInnerHTML={{ __html: activeMilestone.blurb || '' }}
                  />
                  {activeMilestone.thumb && (
                    <div className="marker-thumb">
                      <img src={activeMilestone.thumb} alt="" loading="lazy" />
                    </div>
                  )}
                </article>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

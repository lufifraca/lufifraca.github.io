import { useEffect, useMemo, useRef, useState } from 'react';

function getYear(value) {
  if (!value) return null;
  // Pull the last 4 consecutive digits as a year, if present
  const m = String(value).match(/(19\d{2}|20\d{2}|21\d{2})/g);
  if (!m || !m.length) return null;
  const last = m[m.length - 1];
  return Number(last);
}

export default function ElevatorTimeline({ items = [] }) {
  const shaftRef = useRef(null);
  const [shaftHeight, setShaftHeight] = useState(520);
  const [activeIndex, setActiveIndex] = useState(0);
  const [moving, setMoving] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);

  // Enrich items with year and safe fields
  const floors = useMemo(() => {
    const mapped = items.map((it, i) => ({
      index: i,
      year: getYear(it?.date) ?? undefined,
      date: it?.date ?? '',
      title: it?.title ?? '',
      blurb: it?.blurb ?? '',
      thumb: it?.thumb,
    }));
    // Sort by year ascending when possible, else keep original order
    const withYear = mapped.filter(f => !!f.year);
    const withoutYear = mapped.filter(f => !f.year);
    withYear.sort((a, b) => a.year - b.year);
    return [...withYear, ...withoutYear];
  }, [items]);

  const floorCount = Math.max(floors.length, 1);

  // Measure shaft height for responsive movement
  useEffect(() => {
    function measure() {
      if (!shaftRef.current) return;
      const rect = shaftRef.current.getBoundingClientRect();
      setShaftHeight(Math.max(360, rect.height));
    }
    measure();
    // guard for environments without ResizeObserver
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && shaftRef.current) ro.observe(shaftRef.current);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, []);

  // (step calculated later after accounting for inset)

  // Floors are bottom (index 0) to top (index floorCount-1)
  // Ensure activeIndex matches the floors array order
  useEffect(() => {
    // Default to the newest (top) if years exist, otherwise first
    const idx = Math.max(0, floorCount - 1);
    setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorCount]);

  const moveTimeoutRef = useRef(null);
  const doorTimeoutRef = useRef(null);

  function goTo(index) {
    if (index === activeIndex) return;
    
    // Close doors
    setDoorOpen(false);
    
    // Wait for doors to close, then start moving
    doorTimeoutRef.current = window.setTimeout(() => {
      setMoving(true);
      setActiveIndex(index);
      
      // Wait for movement to complete, then open doors
      moveTimeoutRef.current = window.setTimeout(() => {
        setMoving(false);
        setDoorOpen(true);
      }, 600);
    }, 400);
  }

  // clear pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      if (doorTimeoutRef.current) clearTimeout(doorTimeoutRef.current);
    };
  }, []);

  // Handle call button click
  const handleCallClick = () => {
    setDoorOpen(true);
  };
  
  // Account for the .floors inset (12px top + 12px bottom = 24px)
  const usableHeight = Math.max(0, shaftHeight - 24);
  const step = floorCount > 1 ? usableHeight / (floorCount - 1) : 0;

  // Car Y: 0 at bottom, increasing upwards. Convert to CSS translate
  const carY = -(step * activeIndex);

  return (
    <section className="elev-timeline">
      <h2 className="elev-title">Timeline Elevator</h2>

      <div className="elevator-container">
        {/* Elevator shaft */}
        <div className="shaft" ref={shaftRef} aria-label="Elevator shaft">
          {/* Car */}
          <div 
            className={`car ${moving ? 'moving' : ''}`}
            style={{ transform: `translateY(${carY}px)` }}
            role="group"
            aria-label={`Elevator car at floor ${activeIndex + 1}`}
          >
            {/* Always show static doors first */}
            <div className="car-door-frame">
              {/* Exterior call button */}
              {!doorOpen && !moving && (
                <button 
                  className="call-button"
                  onClick={handleCallClick}
                  aria-label="Call elevator"
                >
                  <div className="call-button-ring"></div>
                  <div className="call-button-center"></div>
                </button>
              )}

              {/* Elevator doors */}
              <div className={`car-door left ${doorOpen ? 'open' : ''}`} aria-hidden="true" />
              <div className={`car-door right ${doorOpen ? 'open' : ''}`} aria-hidden="true" />
            </div>

            {/* Car interior - always rendered but only visible when doors open */}
            <div className={`car-interior ${doorOpen ? 'visible' : ''}`}>
              {/* Left side: Control Panel */}
              <div className="control-panel">
                <div className="floor-display">
                  {floors[activeIndex]?.year ?? '—'}
                </div>
                
                <div className="floor-buttons">
                  {floors.map((f, i) => (
                    <button
                      key={i}
                      className={`floor-button ${i === activeIndex ? 'active' : ''}`}
                      onClick={() => goTo(i)}
                      aria-pressed={i === activeIndex}
                      aria-label={`Floor ${f.year ?? f.date}`}
                    >
                      <span className="year">{f.year ?? f.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right side: Achievement Display */}
              <div className="achievement-display">
                {!moving && floors[activeIndex] && (
                  <>
                    {floors[activeIndex].thumb && (
                      <img
                        className="achievement-image"
                        src={floors[activeIndex].thumb}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <div className="achievement-content">
                      <h3>{floors[activeIndex].title}</h3>
                      <p dangerouslySetInnerHTML={{ __html: floors[activeIndex].blurb }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Floor markers (subtle indicators along shaft) */}
          <div className="floor-markers" aria-hidden>
            {Array.from({ length: floorCount }).map((_, i) => (
              <div
                key={i}
                className={`floor-marker ${i === activeIndex ? 'active' : ''}`}
                style={{ bottom: `${i * step}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


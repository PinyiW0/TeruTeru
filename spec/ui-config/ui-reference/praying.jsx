// Praying screen — clothesline + tap-to-hang dolls + counter.
// Layout: 4 ropes × 5 dolls = 20 slots. Bottom rope fills first.

const TOTAL_DOLLS = 25;
const ROPES = 5;
const SLOTS_PER_ROPE = TOTAL_DOLLS / ROPES;

// Rope y positions as fractions of the playable area (top y to bottom y of rope band).
// Symmetric distribution so the cluster sits centred vertically.
const ROPE_Y_FRACTIONS = [0.92, 0.71, 0.50, 0.29, 0.08]; // rope 0 = bottom, fills first
const SLOT_X_FRACTIONS = [0.13, 0.32, 0.50, 0.68, 0.87];
const ROPE_SAG = 14; // pixels of catenary droop

// Where the rope band sits within the stage (vertical %)
// Symmetric around 0.50 so the doll cluster reads as vertically centred.
const BAND_TOP = 0.20;
const BAND_BOT = 0.80;

function PrayingScreen({ date, location, dollStyle = 'classic', visualStyle = 'flat', onBack, onComplete }) {
  const [dolls, setDolls] = React.useState([]);    // {id, slot, fromX, fromY, hung}
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const stageRef = React.useRef(null);
  const completingRef = React.useRef(false);
  const slotCountRef = React.useRef(0);          // fresh count for rapid taps

  const DOLL_SCALE = 0.86;
  const DOLL_RW = DOLL_W * DOLL_SCALE;

  // Track stage size for pixel placement.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Convert slot index → pixel position of the doll's TOP-CENTER point.
  // Top-center = where the doll's hanging string anchors onto the rope.
  const slotToXY = React.useCallback((slotIdx) => {
    const rope = Math.floor(slotIdx / SLOTS_PER_ROPE);
    const slotInRope = slotIdx % SLOTS_PER_ROPE;
    const bandTop = size.h * BAND_TOP;
    const bandBot = size.h * BAND_BOT;
    const ropeY = bandTop + ROPE_Y_FRACTIONS[rope] * (bandBot - bandTop);
    const xFrac = SLOT_X_FRACTIONS[slotInRope];
    const slotX = size.w * xFrac;
    // Add catenary sag: rope dips most at centre.
    const sagPhase = Math.sin(xFrac * Math.PI);
    const ropeYAtX = ropeY + ROPE_SAG * sagPhase;
    return { x: slotX, y: ropeYAtX };
  }, [size]);

  const handleTap = (e) => {
    if (completingRef.current) return;
    if (slotCountRef.current >= TOTAL_DOLLS) return;

    // Ignore taps on chrome (back btn, hint area).
    const t = e.target;
    if (t && (t.closest('.pray-back') || t.closest('.pray-top'))) return;

    const rect = stageRef.current.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const tapY = e.clientY - rect.top;

    const nextSlot = slotCountRef.current;
    slotCountRef.current = nextSlot + 1;
    const { x: slotX, y: slotY } = slotToXY(nextSlot);
    // 'from' offsets relative to final position. Doll appears below the tap
    // (or below the stage if tap was above the rope) and floats up.
    const startY = Math.max(tapY, slotY + 100);
    const fromX = (tapX - slotX);
    const fromY = (startY - slotY);

    const id = Date.now() + Math.random();
    const newDoll = { id, slot: nextSlot, fromX, fromY, hung: false };
    setDolls((cur) => [...cur, newDoll]);

    // Hand off from float-up to sway after the float settles.
    setTimeout(() => {
      setDolls((cur) => cur.map((x) => x.id === id ? { ...x, hung: true } : x));
    }, 1100);

    window.TeruAudio?.chimeAt(nextSlot);

    if (nextSlot + 1 >= TOTAL_DOLLS) {
      completingRef.current = true;
      setTimeout(() => onComplete(), 1400);
    }
  };

  // Build rope SVG paths
  const ropePaths = [];
  if (size.w > 0) {
    const bandTop = size.h * BAND_TOP;
    const bandBot = size.h * BAND_BOT;
    for (let r = 0; r < ROPES; r++) {
      const y = bandTop + ROPE_Y_FRACTIONS[r] * (bandBot - bandTop);
      const x0 = size.w * 0.06;
      const x1 = size.w * 0.94;
      const midY = y + ROPE_SAG;
      const midX = size.w * 0.5;
      ropePaths.push({ d: `M ${x0} ${y} Q ${midX} ${midY} ${x1} ${y}`, y, x0, x1 });
    }
  }

  return (
    <div className="screen praying" data-screen-label="02 Praying" onClick={handleTap} ref={stageRef}>
      {/* Top bar */}
      <div className="pray-top" onClick={(e) => e.stopPropagation()}>
        <button className="pray-back" onClick={onBack} aria-label="返回">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 3 L4.5 9 L11.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="pray-meta">
          <div className="pray-meta-date">{formatDateCN(date)}</div>
          <div className="pray-meta-loc">為 {location} 祈禱晴天</div>
        </div>
      </div>

      {/* Title */}
      <div className="pray-counter">
        <div className="pray-title">晴天娃娃降臨中</div>
      </div>

      {/* Clothesline + dolls layer */}
      <div className="pray-stage">
        <svg className="clothesline-svg" viewBox={`0 0 ${size.w || 400} ${size.h || 700}`} preserveAspectRatio="none">
          {/* End-of-rope tacks */}
          {ropePaths.map((rp, i) => (
            <g key={i}>
              {/* Left tack */}
              <circle cx={rp.x0} cy={rp.y} r={2.4} fill="var(--rope-deep)" />
              <circle cx={rp.x0} cy={rp.y} r={1.0} fill="var(--rope)" />
              {/* Right tack */}
              <circle cx={rp.x1} cy={rp.y} r={2.4} fill="var(--rope-deep)" />
              <circle cx={rp.x1} cy={rp.y} r={1.0} fill="var(--rope)" />
              {/* Rope itself — slight shadow + main strand */}
              <path d={rp.d} stroke="rgba(0,0,0,0.10)" strokeWidth="2.2" fill="none" transform="translate(0, 1.5)" />
              <path d={rp.d} stroke="var(--rope)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              {/* Faint twist pattern */}
              <path d={rp.d} stroke="var(--rope-deep)" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="1.5 2.5" opacity="0.5" />
            </g>
          ))}
        </svg>

        {/* Dolls */}
        {dolls.map((d, i) => {
          const { x, y } = slotToXY(d.slot);
          // Position: doll's top-center anchored at (x, y). Doll renders at
          // its scaled natural size so animations can drive transform freely.
          const left = x - DOLL_RW / 2;
          const top = y;
          // Stagger sway timing for organic feel without nth-child shorthand pitfalls.
          const swayDur = (4.2 + (d.slot % 5) * 0.3) + 's';
          const swayDelay = (-((d.slot * 0.6) % 3)) + 's';
          return (
            <div
              key={d.id}
              className={'doll ' + (d.hung ? 'hung' : 'floating-in')}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                '--from-x': `${d.fromX}px`,
                '--from-y': `${d.fromY}px`,
                '--sway-dur': swayDur,
                '--sway-delay': swayDelay,
              }}
            >
              <TeruDoll
                index={d.slot}
                dollStyle={dollStyle}
                visualStyle={visualStyle}
                size={DOLL_SCALE}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="pray-hint-bot">
        <span>點任意處</span>
        <span className="tap-dot" />
        <span>掛上晴天娃娃</span>
      </div>
    </div>
  );
}

Object.assign(window, { PrayingScreen, TOTAL_DOLLS });

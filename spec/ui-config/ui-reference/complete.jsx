// Complete + Loading screens.

// ────────────────────────────────────────────────────────────────────
// Sun SVG with rotating rays — used in complete + (smaller) in loader.
function Sun({ size = 200, rays = 12, smile = true }) {
  const cx = size / 2, cy = size / 2;
  const coreR = size * 0.22;
  const innerR = size * 0.28;
  const outerR = size * 0.46;
  const rayItems = [];
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2;
    const x1 = cx + Math.cos(ang) * innerR;
    const y1 = cy + Math.sin(ang) * innerR;
    const x2 = cx + Math.cos(ang) * outerR;
    const y2 = cy + Math.sin(ang) * outerR;
    rayItems.push(
      <line
        key={i}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="var(--sun-deep)"
        strokeWidth={size * 0.04}
        strokeLinecap="round"
        opacity={i % 2 === 0 ? 1 : 0.7}
      />
    );
  }
  return (
    <div className="sun-stage" style={{ width: size, height: size }}>
      <svg className="sun-rays" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rayItems}
      </svg>
      <div className="sun-body">
        <svg width={coreR * 2.2} height={coreR * 2.2} viewBox={`0 0 ${coreR*2.2} ${coreR*2.2}`}>
          <defs>
            <radialGradient id="sunGrad" cx="0.4" cy="0.35" r="0.75">
              <stop offset="0%"  stopColor="#FFF2C2" />
              <stop offset="60%" stopColor="var(--sun)" />
              <stop offset="100%" stopColor="var(--sun-deep)" />
            </radialGradient>
          </defs>
          <circle cx={coreR * 1.1} cy={coreR * 1.1} r={coreR} fill="url(#sunGrad)" />
          {smile && (
            <g>
              <ellipse cx={coreR * 0.85} cy={coreR * 1.0} rx={coreR * 0.06} ry={coreR * 0.08} fill="#7A4A2A" />
              <ellipse cx={coreR * 1.35} cy={coreR * 1.0} rx={coreR * 0.06} ry={coreR * 0.08} fill="#7A4A2A" />
              <ellipse cx={coreR * 0.78} cy={coreR * 1.18} rx={coreR * 0.08} ry={coreR * 0.05} fill="#E89999" opacity="0.7" />
              <ellipse cx={coreR * 1.42} cy={coreR * 1.18} rx={coreR * 0.08} ry={coreR * 0.05} fill="#E89999" opacity="0.7" />
              <path
                d={`M ${coreR * 0.95} ${coreR * 1.22} Q ${coreR * 1.1} ${coreR * 1.4} ${coreR * 1.25} ${coreR * 1.22}`}
                stroke="#7A4A2A" strokeWidth={coreR * 0.06} fill="none" strokeLinecap="round"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// A small rain cloud shape used both pre-clear and as departing clouds.
function RainCloud({ w = 100, color = '#5F6F84', drops = 3 }) {
  const h = w * 0.7;
  return (
    <svg width={w} height={h} viewBox="0 0 100 70">
      {/* Cloud lumps */}
      <ellipse cx={32} cy={32} rx={22} ry={18} fill={color} opacity="0.9" />
      <ellipse cx={60} cy={28} rx={26} ry={22} fill={color} opacity="0.95" />
      <ellipse cx={75} cy={38} rx={20} ry={16} fill={color} opacity="0.9" />
      <ellipse cx={45} cy={42} rx={28} ry={14} fill={color} opacity="0.85" />
      {/* highlight */}
      <ellipse cx={48} cy={24} rx={20} ry={5} fill="#FFFFFF" opacity="0.18" />
      {/* drops */}
      {Array.from({ length: drops }).map((_, i) => (
        <path
          key={i}
          d={`M ${28 + i * 18} 56 q -2 4 0 8 q 2 -4 0 -8 z`}
          fill="#9CB6CC"
        />
      ))}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// Complete screen — clouds depart, sun shines, restart CTA.

function CompleteScreen({ date, location, onRestart }) {
  const [phase, setPhase] = React.useState('clouded');  // clouded → clearing → done

  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase('clearing'), 350);
    const t2 = setTimeout(() => {
      setPhase('done');
      window.TeruAudio?.bloom();
    }, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Departing clouds: pre-positioned around centre, each flies to a corner.
  // Coordinates relative to .sun-stage container (220px square) centre.
  const departing = [
    { fromX: -30, fromY: -10, toX: -260, toY: -160, w: 110 },
    { fromX:  40, fromY: -30, toX:  260, toY: -200, w: 130 },
    { fromX: -60, fromY:  40, toX: -300, toY:  100, w: 100 },
    { fromX:  50, fromY:  50, toX:  280, toY:  140, w: 120 },
    { fromX:   0, fromY: -60, toX:    0, toY: -260, w:  90 },
  ];

  return (
    <div className="screen complete" data-screen-label="03 Complete">
      {/* Background light rays glow */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(60% 40% at 50% 32%, rgba(255,220,140,0.55) 0%, rgba(255,220,140,0) 60%)',
          opacity: phase === 'done' ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      />

      {/* Sun at top */}
      <div
        style={{
          opacity: phase === 'clouded' ? 0.25 : 1,
          transform: phase === 'clouded' ? 'scale(0.85)' : 'scale(1)',
          transition: 'opacity 1.2s ease, transform 1.4s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 1,
        }}
      >
        <Sun size={220} />
      </div>

      {/* Departing clouds — render only while clearing. */}
      {phase !== 'done' && (
        <div style={{ position: 'absolute', left: '50%', top: 'calc(50% - 80px)', width: 0, height: 0, zIndex: 2, pointerEvents: 'none' }}>
          {departing.map((c, i) => (
            <div
              key={i}
              className="depart-cloud"
              style={{
                left: `${c.fromX - c.w / 2}px`,
                top: `${c.fromY - 30}px`,
                position: 'absolute',
                animationDelay: `${i * 80}ms`,
                '--from-x': '0px', '--from-y': '0px',
                '--to-x': `${c.toX}px`, '--to-y': `${c.toY}px`,
              }}
            >
              <RainCloud w={c.w} color="#7F8FA3" drops={phase === 'clouded' ? 3 : 0} />
            </div>
          ))}
        </div>
      )}

      {/* Text + CTA */}
      <div
        style={{
          opacity: phase === 'done' ? 1 : 0,
          transform: phase === 'done' ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.8s ease 0.2s, transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s',
          zIndex: 2,
          textAlign: 'center',
        }}
      >
        <h2 className="complete-title">一定會是好天氣的！</h2>
        <p className="complete-sub">20 隻晴天娃娃，已經掛滿</p>
        <p className="complete-meta">
          {formatDateCN(date)}<br />
          為 {location} 祈禱
        </p>
        <button className="btn-primary" onClick={() => { window.TeruAudio?.tok(); onRestart(); }}>
          重新祈禱
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Loading transition — clouds split apart like a stage curtain.

function LoadingScreen() {
  // Show in front of everything for ~1.2s; outer host removes after.
  return (
    <div className="loader" data-screen-label="Loading">
      {/* Sun behind */}
      <div className="loader-sun">
        <Sun size={140} />
      </div>

      {/* Left curtain — overlapping dark cloud panel with rain strands */}
      <div className="loader-curtain-l">
        <svg width="360" height="600" viewBox="0 0 360 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cloudL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="#5F6F84" />
              <stop offset="100%" stopColor="#7A8AA0" />
            </linearGradient>
          </defs>
          {/* Cloud silhouette — bumpy right edge */}
          <path
            d="M -40 0
               L 280 0
               C 290 40, 240 55, 260 90
               C 280 120, 240 135, 260 165
               C 280 195, 220 215, 250 250
               C 280 290, 220 305, 250 340
               C 280 375, 230 395, 255 430
               C 280 470, 220 490, 250 525
               C 280 560, 220 580, 240 600
               L -40 600 Z"
            fill="url(#cloudL)"
          />
          {/* Rain strands trailing off the right edge */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={i}
              x1={245 + i * 9} y1={70 + i * 50}
              x2={245 + i * 9 - 10} y2={70 + i * 50 + 24}
              stroke="rgba(150, 175, 200, 0.7)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      {/* Right curtain — mirror */}
      <div className="loader-curtain-r">
        <svg width="360" height="600" viewBox="0 0 360 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cloudR" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%"  stopColor="#5F6F84" />
              <stop offset="100%" stopColor="#7A8AA0" />
            </linearGradient>
          </defs>
          <path
            d="M 400 0
               L 80 0
               C 70 40, 120 55, 100 90
               C 80 120, 120 135, 100 165
               C 80 195, 140 215, 110 250
               C 80 290, 140 305, 110 340
               C 80 375, 130 395, 105 430
               C 80 470, 140 490, 110 525
               C 80 560, 140 580, 120 600
               L 400 600 Z"
            fill="url(#cloudR)"
          />
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={i}
              x1={115 - i * 9} y1={70 + i * 50}
              x2={115 - i * 9 + 10} y2={70 + i * 50 + 24}
              stroke="rgba(150, 175, 200, 0.7)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      {/* Tagline */}
      <div className="loader-text">
        Loading
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        &nbsp; Sunshine
      </div>
    </div>
  );
}

Object.assign(window, { CompleteScreen, LoadingScreen, Sun });

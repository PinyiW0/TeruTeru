// TeruDoll — the 晴天娃娃 SVG component.
// Three style variants:  classic | simple | varied
// "varied" picks per-instance colours/expressions for visual rhythm.

const DOLL_W = 60;
const DOLL_H = 92;

// Palette knobs that shift slightly across instances for life.
const VARIED_TIES = ['#E27E6F', '#F4B860', '#7CB1D6', '#A485C9', '#7BB386', '#E89BB0'];
const VARIED_FACES = [
  { kind: 'dot',  mouth: 'smile' },
  { kind: 'dot',  mouth: 'o'     },
  { kind: 'line', mouth: 'smile' },
  { kind: 'dot',  mouth: 'flat'  },
  { kind: 'dot',  mouth: 'smile' },
  { kind: 'happy', mouth: 'smile' },
];

function TeruDoll({ index = 0, dollStyle = 'classic', visualStyle = 'flat', tieColor, size = 1 }) {
  const tie = tieColor
    || (dollStyle === 'varied' ? VARIED_TIES[index % VARIED_TIES.length] : 'var(--accent)');
  const face = dollStyle === 'varied'
    ? VARIED_FACES[index % VARIED_FACES.length]
    : { kind: 'dot', mouth: 'smile' };
  const flipMul = (index % 2 === 0) ? 1 : -1;  // alternate small details

  // Body shape — cloth bell that flares a touch with wavy bottom.
  // Anchor: head centred at (30, 25); body neck at y=38; body bottom y=82.
  const bodyPath = dollStyle === 'simple'
    // Simple: a clean, narrower bell with straight bottom.
    ? 'M 22 38 Q 18 56 18 76 Q 30 80 42 76 Q 42 56 38 38 Z'
    // Classic / varied: wider with wavy bottom.
    : 'M 20 38 Q 14 54 12 76 Q 16 80 20 76 Q 24 82 28 76 Q 32 82 36 76 Q 40 82 44 76 Q 48 80 48 76 Q 46 54 40 38 Z';

  const filterId = visualStyle === 'washi' ? 'washi-edge' : null;

  const cheek = (
    <>
      <ellipse cx={20} cy={28} rx={3.6} ry={2.4} fill="#F2A8A2" opacity="0.75" />
      <ellipse cx={40} cy={28} rx={3.6} ry={2.4} fill="#F2A8A2" opacity="0.75" />
    </>
  );

  const eyes = face.kind === 'line' ? (
    <>
      <path d="M 23 22 L 27 22" stroke="#1F2A3A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 33 22 L 37 22" stroke="#1F2A3A" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ) : face.kind === 'happy' ? (
    <>
      <path d="M 22.5 23 Q 25 20 27.5 23" stroke="#1F2A3A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M 32.5 23 Q 35 20 37.5 23" stroke="#1F2A3A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </>
  ) : (
    <>
      <ellipse cx={25} cy={22} rx={1.4} ry={1.7} fill="#1F2A3A" />
      <ellipse cx={35} cy={22} rx={1.4} ry={1.7} fill="#1F2A3A" />
    </>
  );

  const mouth = face.mouth === 'o' ? (
    <ellipse cx={30} cy={29} rx={1.1} ry={1.4} fill="#9B5346" />
  ) : face.mouth === 'flat' ? (
    <path d="M 28 28.5 L 32 28.5" stroke="#9B5346" strokeWidth="1.2" strokeLinecap="round" />
  ) : (
    <path d="M 27.5 28 Q 30 30.5 32.5 28" stroke="#9B5346" strokeWidth="1.2" strokeLinecap="round" fill="none" />
  );

  return (
    <svg
      width={DOLL_W * size}
      height={DOLL_H * size}
      viewBox={`0 0 ${DOLL_W} ${DOLL_H}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* String anchoring to the rope (extends above the head) */}
      <line x1="30" y1="0" x2="30" y2="10" stroke="#3A2A1A" strokeWidth="1" strokeLinecap="round" />
      {/* Tiny hook knot */}
      <circle cx={30} cy={10} r={1.4} fill="#3A2A1A" />

      {/* Shadow under body */}
      <ellipse cx={30} cy={84} rx={16} ry={1.8} fill="rgba(40,60,90,0.10)" />

      <g filter={filterId ? `url(#${filterId})` : undefined}>
        {/* Body cloth */}
        <path
          d={bodyPath}
          fill="#FBFBFB"
          stroke="rgba(40,60,90,0.16)"
          strokeWidth="0.8"
        />
        {/* Body subtle shading — left side a touch cooler */}
        <path
          d={bodyPath}
          fill="url(#bodyShade)"
          opacity="0.55"
        />
        {/* Tie ribbon at neck */}
        <rect x="17" y="36" width="26" height="4.6" rx="1.6" fill={tie} />
        {/* Ribbon highlight */}
        <rect x="17" y="36" width="26" height="1.2" rx="0.6" fill="rgba(255,255,255,0.45)" />
        {/* Ribbon tails (small) */}
        <path
          d={flipMul > 0 ? 'M 41 40 Q 47 42 46 47 L 43 45 Z' : 'M 19 40 Q 13 42 14 47 L 17 45 Z'}
          fill={tie} opacity="0.85"
        />

        {/* Head */}
        <circle cx={30} cy={25} r={14.5} fill="#FEFEFE" stroke="rgba(40,60,90,0.14)" strokeWidth="0.8" />
        {/* Subtle head shading from upper-left */}
        <circle cx={30} cy={25} r={14.5} fill="url(#headShade)" opacity="0.7" />

        {/* Cheeks */}
        {cheek}
        {/* Eyes */}
        {eyes}
        {/* Mouth */}
        {mouth}
      </g>

      {/* Collage style — paper overlay seam visible */}
      {visualStyle === 'collage' && (
        <>
          {/* Subtle paper edge along head + body */}
          <circle cx={30} cy={25} r={14.5} fill="none" stroke="rgba(40,60,90,0.07)" strokeWidth="0.8" strokeDasharray="0.4 1.6" />
        </>
      )}
    </svg>
  );
}

// Defs (gradients + filters) — mounted once at app root.
function DollDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true">
      <defs>
        <radialGradient id="headShade" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#A0B0C0" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id="bodyShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D8DEE8" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
        </linearGradient>

        {/* Washi soft displacement — gives edges an irregular, hand-cut feel */}
        <filter id="washi-edge" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="0.9" />
        </filter>
      </defs>
    </svg>
  );
}

Object.assign(window, { TeruDoll, DollDefs, DOLL_W, DOLL_H });

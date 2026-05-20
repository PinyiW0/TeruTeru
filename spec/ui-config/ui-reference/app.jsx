// Main App — screen routing, persistence, tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "visualStyle": "flat",
  "themeColor": "sunny",
  "dollStyle": "classic",
  "fontStyle": "round",
  "soundOn": true
}/*EDITMODE-END*/;

const VISUAL_OPTIONS = [
  { value: 'washi',   label: '和紙' },
  { value: 'flat',    label: '扁平' },
  { value: 'collage', label: '拼貼' },
];
const THEME_OPTIONS = [
  ['#FFD46B', '#B8DEF0', '#FFF7E8'],  // sunny
  ['#FFC8A0', '#FFD3DE', '#FFF6F2'],  // sakura
  ['#F2C84A', '#C7DDB5', '#F8F4E0'],  // matcha
];
const THEME_VALUES = ['sunny', 'sakura', 'matcha'];
const DOLL_OPTIONS = [
  { value: 'classic', label: '經典' },
  { value: 'simple',  label: '極簡' },
  { value: 'varied',  label: '多樣' },
];
const FONT_OPTIONS = [
  { value: 'hand',  label: '手寫體' },
  { value: 'round', label: '圓體' },
];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Sync data-* on root so CSS picks up theme/font/style changes.
  React.useEffect(() => {
    document.documentElement.dataset.theme = tweaks.themeColor;
    document.documentElement.dataset.font  = tweaks.fontStyle;
    document.documentElement.dataset.style = tweaks.visualStyle;
  }, [tweaks.themeColor, tweaks.fontStyle, tweaks.visualStyle]);

  React.useEffect(() => {
    window.TeruAudio?.setEnabled(tweaks.soundOn);
  }, [tweaks.soundOn]);

  // App state: screen routing + selection.
  // initial location is loaded from localStorage to persist across reloads.
  const [screen, setScreen] = React.useState('setup');   // setup | praying | complete
  const [transition, setTransition] = React.useState(false);
  const [savedLocation, setSavedLocation] = React.useState(() => {
    try { return localStorage.getItem('teru.location') || ''; } catch { return ''; }
  });
  const [date, setDate] = React.useState(() => {
    const t = new Date(); t.setHours(0,0,0,0); return t;
  });
  const [location, setLocation] = React.useState(savedLocation);

  // Persist location whenever it changes.
  React.useEffect(() => {
    try { if (location) localStorage.setItem('teru.location', location); } catch {}
  }, [location]);

  // Crossfade between screens via a brief loading curtain (~1.2s).
  const goTo = (next, payload) => {
    setTransition(true);
    setTimeout(() => {
      if (payload?.date) setDate(payload.date);
      if (payload?.location) setLocation(payload.location);
      setScreen(next);
    }, 600);   // curtains begin opening at 600ms; new screen behind
    setTimeout(() => setTransition(false), 1250);
  };

  const handleStart = ({ date, location }) => {
    goTo('praying', { date, location });
  };
  const handleBack = () => {
    goTo('setup');
  };
  const handleComplete = () => {
    goTo('complete');
  };
  const handleRestart = () => {
    goTo('setup');
  };

  // Stash tweak values for praying/complete screens that render dolls.
  window.__teruDollStyle = tweaks.dollStyle;
  window.__teruVisualStyle = tweaks.visualStyle;

  let body = null;
  if (screen === 'setup') {
    body = (
      <SetupScreen
        initialDate={date}
        initialLocation={location}
        themeColor={tweaks.themeColor}
        onThemeChange={(v) => setTweak('themeColor', v)}
        onStart={handleStart}
      />
    );
  } else if (screen === 'praying') {
    body = (
      <PrayingScreen
        date={date} location={location}
        dollStyle={tweaks.dollStyle}
        visualStyle={tweaks.visualStyle}
        onBack={handleBack}
        onComplete={handleComplete}
      />
    );
  } else if (screen === 'complete') {
    body = <CompleteScreen date={date} location={location} onRestart={handleRestart} />;
  }

  return (
    <div className="stage" data-screen-root>
      {/* Decorative background clouds (subtle drift) */}
      <BgClouds />

      <DollDefs />

      {body}

      {transition && <LoadingScreen />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="風格 / Style">
          <TweakRadio
            label="視覺風格"
            value={tweaks.visualStyle}
            options={VISUAL_OPTIONS}
            onChange={(v) => setTweak('visualStyle', v)}
          />
        </TweakSection>
        <TweakSection label="主題色 / Theme">
          <TweakColor
            label="主題色"
            value={THEME_OPTIONS[THEME_VALUES.indexOf(tweaks.themeColor)] || THEME_OPTIONS[0]}
            options={THEME_OPTIONS}
            onChange={(v) => {
              const idx = THEME_OPTIONS.findIndex((p) => JSON.stringify(p) === JSON.stringify(v));
              setTweak('themeColor', THEME_VALUES[Math.max(0, idx)]);
            }}
          />
        </TweakSection>
        <TweakSection label="娃娃造型 / Doll">
          <TweakRadio
            label="造型"
            value={tweaks.dollStyle}
            options={DOLL_OPTIONS}
            onChange={(v) => setTweak('dollStyle', v)}
          />
        </TweakSection>
        <TweakSection label="字體 / Type">
          <TweakRadio
            label="字體"
            value={tweaks.fontStyle}
            options={FONT_OPTIONS}
            onChange={(v) => setTweak('fontStyle', v)}
          />
        </TweakSection>
        <TweakSection label="其他 / Misc">
          <TweakToggle
            label="音效"
            value={tweaks.soundOn}
            onChange={(v) => setTweak('soundOn', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// Decorative ambient clouds that drift across the sky behind everything.
function BgClouds() {
  return (
    <div className="bg-clouds" aria-hidden="true">
      <svg className="bg-cloud" style={{ top: '12%', left: '-20%' }} width="120" height="60" viewBox="0 0 120 60">
        <g fill="#FFFFFF" opacity="0.8">
          <ellipse cx="30" cy="35" rx="22" ry="14" />
          <ellipse cx="55" cy="28" rx="24" ry="18" />
          <ellipse cx="80" cy="34" rx="20" ry="14" />
        </g>
      </svg>
      <svg className="bg-cloud" style={{ top: '34%', left: '-30%' }} width="160" height="70" viewBox="0 0 160 70">
        <g fill="#FFFFFF" opacity="0.6">
          <ellipse cx="40" cy="42" rx="28" ry="16" />
          <ellipse cx="75" cy="33" rx="32" ry="22" />
          <ellipse cx="110" cy="42" rx="26" ry="18" />
        </g>
      </svg>
      <svg className="bg-cloud" style={{ top: '58%', left: '-25%' }} width="100" height="50" viewBox="0 0 100 50">
        <g fill="#FFFFFF" opacity="0.5">
          <ellipse cx="25" cy="28" rx="18" ry="12" />
          <ellipse cx="50" cy="22" rx="22" ry="16" />
          <ellipse cx="72" cy="28" rx="18" ry="12" />
        </g>
      </svg>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

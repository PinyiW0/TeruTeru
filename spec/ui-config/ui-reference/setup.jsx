// Setup screen — date picker, week strip, location input, start CTA.
// Date selection rules:
//   - past days disabled (can't select)
//   - today highlighted with the sun colour
//   - dropdown selects year/month/day → week strip scrolls there

const COMMON_LOCATIONS = ['台北', '台中', '高雄', '東京', '大阪', '京都', '首爾', '沖繩'];
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// Days shown: 3 past (disabled, dimmed) + today + 60 future = 64 cells.
function buildDays(today) {
  const days = [];
  for (let off = -3; off <= 60; off++) {
    const d = new Date(today);
    d.setDate(d.getDate() + off);
    days.push(d);
  }
  return days;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
}

function pad2(n) {return String(n).padStart(2, '0');}

function formatDateCN(d) {
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日（${w}）`;
}

function SetupScreen({ initialDate, initialLocation, themeColor, onThemeChange, onStart }) {
  const today = React.useMemo(() => {
    const t = new Date();t.setHours(0, 0, 0, 0);return t;
  }, []);
  const days = React.useMemo(() => buildDays(today), [today]);
  const [date, setDate] = React.useState(initialDate || today);
  const [location, setLocation] = React.useState(initialLocation || '');
  const stripRef = React.useRef(null);
  const dayRefs = React.useRef({});

  // On mount, scroll the today/selected cell into centre.
  React.useEffect(() => {
    const key = +date;
    const el = dayRefs.current[key];
    if (el && stripRef.current) {
      const strip = stripRef.current;
      const stripRect = strip.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetScroll = strip.scrollLeft + (elRect.left - stripRect.left) - (stripRect.width / 2 - elRect.width / 2);
      strip.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }, [date]);

  // Year / month / day option lists, gated so past dates can't be chosen.
  const minYear = today.getFullYear();
  const years = [];
  for (let y = minYear; y <= minYear + 2; y++) years.push(y);
  const months = [];
  const minMonth = date.getFullYear() === minYear ? today.getMonth() : 0;
  for (let m = minMonth; m < 12; m++) months.push(m);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const minDay = date.getFullYear() === minYear && date.getMonth() === today.getMonth() ?
  today.getDate() : 1;
  const dayNums = [];
  for (let d = minDay; d <= daysInMonth; d++) dayNums.push(d);

  const setY = (y) => {
    const nd = new Date(date);
    nd.setFullYear(y);
    // clamp month/day if needed
    if (y === minYear && nd.getMonth() < today.getMonth()) nd.setMonth(today.getMonth());
    if (isSameDay(nd, today) || nd < today) {
      if (nd < today) nd.setTime(today.getTime());
    }
    setDate(nd);
    window.TeruAudio?.pluck(660);
  };
  const setM = (m) => {
    const nd = new Date(date);
    nd.setDate(1);nd.setMonth(m);
    const lastDay = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
    let newDay = Math.min(date.getDate(), lastDay);
    if (nd.getFullYear() === minYear && m === today.getMonth() && newDay < today.getDate()) newDay = today.getDate();
    nd.setDate(newDay);
    setDate(nd);
    window.TeruAudio?.pluck(660);
  };
  const setD = (d) => {
    const nd = new Date(date);
    nd.setDate(d);
    setDate(nd);
    window.TeruAudio?.pluck(660);
  };

  const tapDay = (d) => {
    if (d < today) return;
    setDate(d);
    window.TeruAudio?.pluck(720);
  };

  const tapChip = (loc) => {
    setLocation(loc);
    window.TeruAudio?.pluck(620);
  };

  const canStart = !!location.trim();
  const handleStart = () => {
    if (!canStart) return;
    window.TeruAudio?.tok();
    onStart({ date, location: location.trim() });
  };

  return (
    <div className="screen setup" data-screen-label="01 Setup">
      <div className="setup-header">
        <h1 className="setup-title">Teru Teru 放晴中</h1>
        <p className="setup-subtitle">為一個日子，為一個地方，求一場好天氣</p>
      </div>

      {/* Theme color picker */}
      <div>
        <p className="field-label"></p>
        <div className="theme-picker" style={{ justifyContent: "center" }}>
          {[
          { id: 'sunny', color: '#B8DEF0' },
          { id: 'sakura', color: '#FFD3DE' },
          { id: 'matcha', color: '#C7DDB5' }].
          map((t) => {
            const active = themeColor === t.id;
            return (
              <button
                key={t.id}
                aria-label={t.id}
                className={'theme-dot' + (active ? ' active' : '')}
                style={{ background: t.color }}
                onClick={() => {onThemeChange?.(t.id);window.TeruAudio?.pluck(700);}} />);


          })}
        </div>
      </div>

      {/* Date picker */}
      <div style={{ margin: "8px 0px 0px" }}>
        <p className="field-label" style={{ margin: "4px 0px 0px" }}>選擇日期</p>
        <div className="date-picker">
          <select value={date.getFullYear()} onChange={(e) => setY(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y} 年</option>)}
          </select>
          <select value={date.getMonth()} onChange={(e) => setM(Number(e.target.value))}>
            {months.map((m) => <option key={m} value={m}>{m + 1} 月</option>)}
          </select>
          <select value={date.getDate()} onChange={(e) => setD(Number(e.target.value))}>
            {dayNums.map((d) => <option key={d} value={d}>{d} 日</option>)}
          </select>
        </div>

        <div className="weekstrip-wrap">
          <div className="weekstrip" ref={stripRef} style={{ padding: "12px" }}>
            {days.map((d) => {
              const past = d < today;
              const isToday = isSameDay(d, today);
              const selected = isSameDay(d, date);
              const cls = ['day'];
              if (past) cls.push('is-disabled');
              if (isToday) cls.push('is-today');
              if (selected) cls.push('is-selected');
              return (
                <div
                  key={+d}
                  className={cls.join(' ')}
                  ref={(el) => {if (el) dayRefs.current[+d] = el;}}
                  onClick={() => tapDay(d)}>
                  
                  <div className="day-w">{WEEKDAY_LABELS[d.getDay()]}</div>
                  <div className="day-d">{d.getDate()}</div>
                  <div className="day-m">{d.getMonth() + 1}月</div>
                </div>);

            })}
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={{ marginTop: 22 }}>
        <p className="field-label">選擇地點</p>
        <input
          className="loc-input"
          type="text"
          value={location}
          placeholder="例如：台北、京都…"
          onChange={(e) => setLocation(e.target.value)} />
        
        <div className="chips" style={{ justifyContent: "center" }}>
          {COMMON_LOCATIONS.map((loc) =>
          <button
            key={loc}
            className={'chip' + (location === loc ? ' active' : '')}
            onClick={() => tapChip(loc)}>
            
              {loc}
            </button>
          )}
        </div>
      </div>

      <div className="start-cta">
        <button className="btn-primary" onClick={handleStart} disabled={!canStart}>
          開始放晴
        </button>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', letterSpacing: '0.12em' }}>掛滿晴天娃娃就會放晴

        </div>
      </div>
    </div>);

}

Object.assign(window, { SetupScreen, formatDateCN });
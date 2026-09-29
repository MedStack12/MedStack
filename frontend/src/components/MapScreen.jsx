import { useState } from 'react';
import SafetyGraph from './SafetyGraph';
import { speak, stopSpeaking } from '../lib/speech';

const SEVMETA = {
  red: { label: 'STOP', cls: 'red', icon: '!' },
  yellow: { label: 'Use caution', cls: 'amber', icon: '!' },
  green: { label: 'No known issue', cls: 'green', icon: '✓' },
};
const SEVGRADE = {
  green: { grade: 'A', cls: 'green' },
  yellow: { grade: 'C', cls: 'amber' },
  red: { grade: 'F', cls: 'red' },
};

export default function MapScreen({ drugs, pairs, loading, groups }) {
  const [selected, setSelected] = useState(null);
  const [groupFilter, setGroupFilter] = useState(null);
  const [view, setView] = useState('node');

  const viewDrugs = groupFilter ? drugs.filter((d) => !d.groupId || d.groupId === groupFilter) : drugs;
  const viewNames = new Set(viewDrugs.map((d) => d.name.toLowerCase()));
  const viewPairs = groupFilter
    ? pairs.filter((p) => viewNames.has(p.drugA.toLowerCase()) && viewNames.has(p.drugB.toLowerCase()))
    : pairs;
  const viewSummary = viewPairs.reduce(
    (acc, p) => { acc[p.severity] = (acc[p.severity] || 0) + 1; return acc; },
    { red: 0, yellow: 0, green: 0 }
  );

  const hottest = [...viewPairs].sort((a, b) => rank(b.severity) - rank(a.severity))[0];
  const active = selected || hottest;
  const activeKey = active ? [active.drugA, active.drugB].sort().join('|') : null;
  const tappedKey = selected ? activeKey : null;

  const groupTabs = groups.length > 0 && (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 10 }}>
      <GroupTab active={!groupFilter} onClick={() => setGroupFilter(null)}>All medications</GroupTab>
      {groups.map((g) => (
        <GroupTab key={g.id} active={groupFilter === g.id} onClick={() => setGroupFilter(g.id)}>{g.name}</GroupTab>
      ))}
    </div>
  );

  if (drugs.length < 2) {
    return (
      <div style={{ paddingTop: 40, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Add at least two medications</p>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 8 }}>
          The safety map draws a line the moment two drugs could interact.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8 }}>
      {groupTabs}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p className="eyebrow">Safety map{groupFilter ? ` · ${groups.find((g) => g.id === groupFilter)?.name}` : ''}</p>
        <div className="chips">
          {viewSummary.red > 0 && <span className="chip chip--red"><span className="chip__dot" />{viewSummary.red} red</span>}
          {viewSummary.yellow > 0 && <span className="chip chip--amber"><span className="chip__dot" />{viewSummary.yellow}</span>}
          {viewSummary.green > 0 && <span className="chip chip--green"><span className="chip__dot" />{viewSummary.green}</span>}
        </div>
      </div>

      <ViewToggle view={view} onChange={setView} />

      {viewDrugs.length < 2 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>No medications in this group yet.</p>
        </div>
      ) : view === 'node' ? (
        <div className="card" style={{ padding: 6, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)' }}>
              Checking live interactions…
            </div>
          )}
          <SafetyGraph drugs={viewDrugs} pairs={viewPairs} highlightKey={activeKey} tappedKey={tappedKey}
            onSelectPair={(p) => { stopSpeaking(); setSelected(p); }} />
          <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', paddingBottom: 8 }}>
            Tap any colored line for details
          </p>
        </div>
      ) : (
        <ListView pairs={viewPairs} activeKey={activeKey} loading={loading}
          onSelectPair={(p) => { stopSpeaking(); setSelected(p); }} />
      )}

      {active && viewDrugs.length >= 2 && <DetailCard pair={active} />}
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, marginBottom: 10, background: 'var(--surface-2, #f2f2f0)', borderRadius: 12 }}>
      <ToggleTab active={view === 'node'} onClick={() => onChange('node')}>Node</ToggleTab>
      <ToggleTab active={view === 'list'} onClick={() => onChange('list')}>List</ToggleTab>
    </div>
  );
}

function ToggleTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
      border: 'none', cursor: 'pointer',
      background: active ? 'var(--teal)' : 'transparent',
      color: active ? '#fff' : 'var(--ink-soft)',
    }}>
      {children}
    </button>
  );
}

function ListView({ pairs, activeKey, loading, onSelectPair }) {
  if (pairs.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>No interactions to show yet.</p>
      </div>
    );
  }
  const sorted = [...pairs].sort((a, b) => rank(b.severity) - rank(a.severity));

  return (
    <div className="card" style={{ padding: 6, position: 'relative' }}>
      {loading && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)', padding: '10px 0 0' }}>
          Checking live interactions…
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((p) => {
          const key = [p.drugA, p.drugB].sort().join('|');
          const g = SEVGRADE[p.severity] || SEVGRADE.green;
          const isActive = key === activeKey;
          return (
            <button key={key} onClick={() => onSelectPair(p)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '12px 10px', border: 'none', background: 'none',
              borderBottom: '1px solid var(--line)', cursor: 'pointer', textAlign: 'left',
              borderRadius: isActive ? 8 : 0,
              outline: isActive ? `1px solid var(--${g.cls})` : 'none',
            }}>
              <span style={{ fontSize: 14, textTransform: 'capitalize', color: 'var(--ink)' }}>
                {p.drugA} + {p.drugB}
              </span>
              <span className={`chip chip--${g.cls}`} style={{ fontWeight: 700, minWidth: 26, justifyContent: 'center' }}>
                {g.grade}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailCard({ pair }) {
  const meta = SEVMETA[pair.severity] || SEVMETA.green;
  const [spoken, setSpoken] = useState(false);
  const line = `${pair.drugA} and ${pair.drugB}. ${pair.summary} ${pair.action}`;

  function toggleSpeak() {
    if (spoken) { stopSpeaking(); setSpoken(false); }
    else { speak(line); setSpoken(true); }
  }

  return (
    <div className={`card`} style={{ marginTop: 14, padding: 18, borderTop: `3px solid var(--${meta.cls})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span className={`chip chip--${meta.cls}`}><span className="chip__dot" />{meta.label}</span>
        {pair.source === 'live' && (
          <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>● LIVE DATA</span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, textTransform: 'capitalize', marginBottom: 8 }}>
        {pair.drugA} + {pair.drugB}
      </p>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink)', marginBottom: 10 }}>{pair.summary}</p>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-soft)', marginBottom: 16 }}>
        <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>What to do: </strong>{pair.action}
      </p>
      <button className="btn-ghost" onClick={toggleSpeak} style={{ width: '100%' }}>
        <SpeakerIcon /> {spoken ? 'Stop' : 'Read this aloud'}
      </button>
      {pair.sourceUrl && (
        <a href={pair.sourceUrl} target="_blank" rel="noreferrer"
          style={{ display: 'block', textAlign: 'center', fontSize: 11.5, color: 'var(--teal)', marginTop: 10, textDecoration: 'none' }}>
          Source
        </a>
      )}
    </div>
  );
}

function rank(s) { return { green: 0, yellow: 1, red: 2 }[s] ?? 0; }

function GroupTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      border: `1px solid ${active ? 'var(--teal)' : 'var(--line)'}`,
      background: active ? 'var(--teal)' : 'var(--surface)',
      color: active ? '#fff' : 'var(--ink-soft)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" />
    </svg>
  );
}
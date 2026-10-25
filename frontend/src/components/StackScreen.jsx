import { useState } from 'react';

const COLOR = { red: 'var(--red)', yellow: 'var(--amber)', green: 'var(--green)' };

function worstFor(name, pairs) {
  const rank = { green: 0, yellow: 1, red: 2 };
  let worst = 'green';
  pairs.forEach((p) => {
    if ([p.drugA, p.drugB].map((d) => d.toLowerCase()).includes(name.toLowerCase())) {
      if (rank[p.severity] > rank[worst]) worst = p.severity;
    }
  });
  return worst;
}

export default function StackScreen({
  drugs, pairs, summary, groups, onRemove, onRename, onAssignGroup, onCreateGroup, onDeleteGroup, onGoScan,
}) {
  if (drugs.length === 0) {
    return (
      <div style={{ paddingTop: 40, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)' }}>No medications yet</p>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '8px 0 20px' }}>
          Scan a pill bottle to start building this person's safety map.
        </p>
        <button className="btn-primary" onClick={onGoScan}>Scan first bottle</button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <GroupsBar groups={groups} drugs={drugs} onCreateGroup={onCreateGroup} onDeleteGroup={onDeleteGroup} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="eyebrow">Current stack · {drugs.length}</p>
        <div className="chips">
          {summary.red > 0 && <span className="chip chip--red"><span className="chip__dot" />{summary.red} red</span>}
          {summary.amber > 0 && <span className="chip chip--amber"><span className="chip__dot" />{summary.amber} caution</span>}
          {summary.green > 0 && <span className="chip chip--green"><span className="chip__dot" />{summary.green} safe</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {drugs.map((d) => (
          <DrugCard
            key={d.name}
            drug={d}
            severity={worstFor(d.name, pairs)}
            groups={groups}
            onRemove={onRemove}
            onRename={onRename}
            onAssignGroup={onAssignGroup}
          />
        ))}
      </div>
    </div>
  );
}

function DrugCard({ drug: d, severity: sev, groups, onRemove, onRename, onAssignGroup }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(d.displayName || '');

  function save() {
    onRename(d.name, value);
    setEditing(false);
  }
  function cancel() {
    setValue(d.displayName || '');
    setEditing(false);
  }

  return (
    <div className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${COLOR[sev]}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              placeholder={d.name}
              style={{
                width: '100%', fontSize: 15, fontWeight: 600, padding: '4px 8px',
                border: '1px solid var(--teal)', borderRadius: 8, outline: 'none', color: 'var(--ink)',
              }}
            />
          ) : (
            <>
              <p style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', color: 'var(--ink)' }}>
                {d.displayName || d.name}
              </p>
              {/* When a nickname is set, still show the real drug name — important for a medical app. */}
              {d.displayName && (
                <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'capitalize', marginTop: 1 }}>
                  {d.name}
                </p>
              )}
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>
                {[d.dosage, d.frequency].filter(Boolean).join(' · ') || 'No dosage recorded'}
              </p>
            </>
          )}
        </div>

        <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLOR[sev], flexShrink: 0 }} />

        {editing ? (
          <>
            <button onClick={save} aria-label="Save name" style={{ color: 'var(--teal)', padding: 4, lineHeight: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </button>
            <button onClick={cancel} aria-label="Cancel" style={{ color: 'var(--ink-faint)', padding: 4, lineHeight: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setValue(d.displayName || ''); setEditing(true); }} aria-label={`Rename ${d.name}`}
              style={{ color: 'var(--ink-faint)', padding: 4, lineHeight: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            </button>
            <button onClick={() => onRemove(d.name)} aria-label={`Remove ${d.name}`}
              style={{ color: 'var(--ink-faint)', padding: 4, lineHeight: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginRight: 2 }}>Group:</span>
        <GroupPill active={!d.groupId} onClick={() => onAssignGroup(d.name, null)}>None</GroupPill>
        {groups.map((g) => (
          <GroupPill key={g.id} active={d.groupId === g.id} onClick={() => onAssignGroup(d.name, g.id)}>
            {g.name}
          </GroupPill>
        ))}
      </div>
    </div>
  );
}

function GroupsBar({ groups, drugs, onCreateGroup, onDeleteGroup }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function submit() {
    const trimmed = name.trim();
    if (trimmed) onCreateGroup(trimmed);
    setName('');
    setAdding(false);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Groups</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {groups.map((g) => {
          const count = drugs.filter((d) => d.groupId === g.id).length;
          return (
            <span key={g.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              borderRadius: 20, border: '1px solid var(--line)', background: 'var(--surface)',
              fontSize: 12.5,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{g.name}</span>
              <span style={{ color: 'var(--ink-faint)' }}>{count} med{count === 1 ? '' : 's'}</span>
              <button onClick={() => onDeleteGroup(g.id)} aria-label={`Delete ${g.name}`}
                style={{ color: 'var(--ink-faint)', lineHeight: 0, padding: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </span>
          );
        })}

        {adding ? (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false); }}
              placeholder="Group name" style={{
                fontSize: 12.5, padding: '6px 10px', borderRadius: 20,
                border: '1px solid var(--teal)', outline: 'none', width: 110,
              }} />
            <button onClick={submit} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12.5 }}>Add</button>
          </span>
        ) : (
          <button onClick={() => setAdding(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12.5 }}>
            + New group
          </button>
        )}
      </div>
    </div>
  );
}

function GroupPill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 500,
      border: `1px solid ${active ? 'var(--teal)' : 'var(--line)'}`,
      background: active ? 'var(--teal)' : 'transparent',
      color: active ? '#fff' : 'var(--ink-soft)',
    }}>
      {children}
    </button>
  );
}

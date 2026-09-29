import { useEffect, useState, useCallback, useRef } from 'react';
import ScanScreen from './components/ScanScreen';
import StackScreen from './components/StackScreen';
import MapScreen from './components/MapScreen';
import Onboarding, { STEPS } from './components/Onboarding';
import { api } from './lib/api';

const SEED = [
  { name: 'metformin', dosage: '500 mg', frequency: '2× daily' },
  { name: 'lisinopril', dosage: '10 mg', frequency: 'daily' },
  { name: 'atorvastatin', dosage: '20 mg', frequency: 'daily' },
];

function hasOnboarded() {
  try { return localStorage.getItem('medstack_onboarded') === 'true'; } catch { return false; }
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !hasOnboarded());
  const [onboardStep, setOnboardStep] = useState(0);
  const [tab, setTab] = useState(showOnboarding ? STEPS[0].tab : 'stack');
  const [drugs, setDrugs] = useState(() => (hasOnboarded() ? [] : SEED));
  const [groups, setGroups] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [summary, setSummary] = useState({ red: 0, amber: 0, green: 0 });
  const [loading, setLoading] = useState(false);

  const appRef = useRef(null);
  const scanBtnRef = useRef(null);
  const stackBtnRef = useRef(null);
  const mapBtnRef = useRef(null);
  const [targetRects, setTargetRects] = useState({});
  const [appHeight, setAppHeight] = useState(0);

  useEffect(() => {
    if (!showOnboarding) return;
    setTab(STEPS[onboardStep].tab);
  }, [showOnboarding, onboardStep]);

  useEffect(() => {
    if (!showOnboarding) return;
    function measure() {
      const appRect = appRef.current?.getBoundingClientRect();
      if (!appRect) return;
      const rel = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left - appRect.left, top: r.top - appRect.top, width: r.width, height: r.height };
      };
      setAppHeight(appRect.height);
      setTargetRects({ scan: rel(scanBtnRef.current), stack: rel(stackBtnRef.current), map: rel(mapBtnRef.current) });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [showOnboarding, onboardStep]);

  function finishOnboarding() {
    try { localStorage.setItem('medstack_onboarded', 'true'); } catch {}
    setShowOnboarding(false);
    setDrugs([]);
    setGroups([]);
    setPairs([]);
    setSummary({ red: 0, amber: 0, green: 0 });
    setTab('scan');
  }

  const recheck = useCallback(async (list) => {
    if (list.length < 2) { setPairs([]); setSummary({ red: 0, amber: 0, green: 0 }); return; }
    setLoading(true);
    try {
      const { pairs, summary } = await api.stackCheck(list.map((d) => d.name));
      setPairs(pairs);
      setSummary({ red: summary.red || 0, amber: summary.yellow || 0, green: summary.green || 0 });
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { recheck(drugs); }, []);

  function addDrug(d) {
    if (!d?.name) return;
    setDrugs((prev) => {
      if (prev.some((x) => x.name.toLowerCase() === d.name.toLowerCase())) return prev;
      const next = [...prev, { ...d, groupId: d.groupId || null }];
      recheck(next);
      return next;
    });
    setTab('map');
  }

  function removeDrug(name) {
    setDrugs((prev) => {
      const next = prev.filter((x) => x.name.toLowerCase() !== name.toLowerCase());
      recheck(next);
      return next;
    });
  }

  function assignGroup(name, groupId) {
    setDrugs((prev) => prev.map((x) => (x.name.toLowerCase() === name.toLowerCase() ? { ...x, groupId } : x)));
  }

  function createGroup(name) {
    setGroups((prev) => {
      if (prev.some((g) => g.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name }];
    });
  }

  function deleteGroup(groupId) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setDrugs((prev) => prev.map((x) => (x.groupId === groupId ? { ...x, groupId: null } : x)));
  }

  return (
    <div className="app" ref={appRef}>
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark">Med<em>Stack</em></span>
        </div>
        <span className="brand__tag">Safety map</span>
      </header>

      <main className="app__body">
        {tab === 'scan' && <ScanScreen onAdd={addDrug} />}
        {tab === 'stack' && (
          <StackScreen drugs={drugs} pairs={pairs} summary={summary} groups={groups}
            onRemove={removeDrug} onAssignGroup={assignGroup}
            onCreateGroup={createGroup} onDeleteGroup={deleteGroup}
            onGoScan={() => setTab('scan')} />
        )}
        {tab === 'map' && <MapScreen drugs={drugs} pairs={pairs} loading={loading} groups={groups} />}

        {tab !== 'scan' && (
          <p className="disclaimer">
            MedStack is a prototype, not medical advice. Always confirm with a doctor or pharmacist.
          </p>
        )}
      </main>

      <nav className="tabbar">
        <button ref={scanBtnRef} className={tab === 'scan' ? 'active' : ''} onClick={() => !showOnboarding && setTab('scan')}>
          <IconCam /> Scan
        </button>
        <button ref={stackBtnRef} className={tab === 'stack' ? 'active' : ''} onClick={() => !showOnboarding && setTab('stack')}>
          <IconList /> Stack
        </button>
        <button ref={mapBtnRef} className={tab === 'map' ? 'active' : ''} onClick={() => !showOnboarding && setTab('map')}>
          <IconMap /> Map
        </button>
      </nav>

      {showOnboarding && (
        <Onboarding
          step={onboardStep}
          targetRects={targetRects}
          appHeight={appHeight}
          onNext={() => setOnboardStep((n) => n + 1)}
          onSkip={finishOnboarding}
          onFinish={finishOnboarding}
        />
      )}
    </div>
  );
}

function IconCam() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4l1.5 2H20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4L9.5 4z" /><circle cx="12" cy="13" r="3.2" /></svg>;
}
function IconList() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
}
function IconMap() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="7" r="2.4" /><circle cx="18" cy="9" r="2.4" /><circle cx="11" cy="18" r="2.4" /><path d="M7.7 8.6l2.6 7.4M16.2 10.6l-3.6 5.6M8 7.4l8 1.4" /></svg>;
}
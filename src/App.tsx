import { useEffect, useMemo, useRef, useState } from 'react'
import { classifyLocally, classifyWithCloud, getHostname, nextFocusState, type Decision, type FocusState, type UrlDecision } from './lib/focus'

const defaultDomains = ['github.com', 'figma.com', 'notion.so', 'linear.app']
const labels: Record<FocusState, string> = { focused: 'In flow', grace: 'Refocus gently', distracted: 'Distracted', paused: 'Monitoring paused' }

function Ring({ state, seconds }: { state: FocusState; seconds: number }) {
  const progress = state === 'grace' ? seconds / 10 : state === 'focused' ? 1 : 0.25
  return <div className={`ring ring--${state}`} style={{ '--progress': progress } as React.CSSProperties}>
    <div className="ring__center"><span className="eyebrow">{labels[state]}</span><strong>{state === 'grace' ? `00:${String(seconds).padStart(2, '0')}` : state === 'distracted' ? 'Take a breath' : '48:37'}</strong></div>
  </div>
}

export default function App() {
  const [domains, setDomains] = useState(defaultDomains)
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=focus')
  const [state, setState] = useState<FocusState>('focused')
  const [seconds, setSeconds] = useState(10)
  const [cameraOn, setCameraOn] = useState(false)
  const [cloudEndpoint, setCloudEndpoint] = useState('')
  const [activity, setActivity] = useState('Ready for a calm, focused session.')
  const [decision, setDecision] = useState<UrlDecision>({ decision: 'approved', source: 'allowlist', reason: 'Your workspace is protected.' })
  const timer = useRef<number | undefined>(undefined)
  const hostname = useMemo(() => getHostname(url) || 'No active tab', [url])

  useEffect(() => () => window.clearInterval(timer.current), [])
  useEffect(() => {
    if (state !== 'grace') return
    timer.current = window.setInterval(() => setSeconds((remaining) => {
      if (remaining <= 1) { window.clearInterval(timer.current); setState('distracted'); setActivity('Grace period ended — your notch is now glowing red.'); return 0 }
      return remaining - 1
    }), 1000)
    return () => window.clearInterval(timer.current)
  }, [state])

  async function reviewTab() {
    const local = classifyLocally(url, domains)
    let result = local
    if (local.decision === 'review') {
      try { result = await classifyWithCloud(url, cloudEndpoint || undefined) }
      catch { result = { decision: 'review', source: 'fallback', reason: 'Could not reach cloud review; choose how to treat this site.' } }
    }
    setDecision(result)
    if (result.decision === 'distracting') { setSeconds(10); setState('grace'); setActivity(`Gentle nudge: ${hostname} looks distracting. You have ten seconds to return to work.`) }
    else if (result.decision === 'approved') { setState('focused'); setActivity(`${hostname} is approved. Staying quiet and out of your way.`) }
    else { setState('focused'); setActivity(`Please approve or block ${hostname}; nothing is interrupted automatically.`) }
  }
  function approveSite() { if (!domains.includes(hostname)) setDomains((items) => [...items, hostname]); setDecision({ decision: 'approved', source: 'allowlist', reason: 'Approved by you.' }); setState('focused'); setActivity(`${hostname} is now on your focus list.`) }
  function returnToFocus() { setState('focused'); setSeconds(10); setActivity('Welcome back. Your visual indicator has settled.') }
  async function toggleCamera() {
    if (!cameraOn && navigator.mediaDevices?.getUserMedia) { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }); stream.getTracks().forEach((track) => track.stop()) }
    setCameraOn(!cameraOn); setActivity(!cameraOn ? 'Camera access granted. Head-pose events stay on this device.' : 'Camera monitoring is off.')
  }
  return <main>
    <header><div className="brand"><i></i><span>NotchFlow</span></div><div className="header-status"><b></b> Focus session active <button className="icon-button" aria-label="Settings">⚙</button><div className="avatar">M</div></div></header>
    <section className="hero"><div><p className="kicker">YOUR AMBIENT FOCUS COMPANION</p><h1>Protect your <em>flow.</em><br />Not your browser.</h1><p className="intro">A calm visual signal for when attention drifts — designed to keep you moving, never shut you down.</p></div><Ring state={state} seconds={seconds} /></section>
    <section className="workspace">
      <article className="panel monitor"><div className="panel-head"><div><p className="eyebrow">LIVE STATUS</p><h2>{labels[state]}</h2></div><span className={`pill pill--${state}`}>{state === 'grace' ? `${seconds}s grace` : state}</span></div><div className="notch-preview"><span className="notch-dot"></span><b>{hostname}</b><small>{activity}</small></div><div className="actions"><button className="primary" onClick={returnToFocus}>I&apos;m back on task</button>{decision.decision === 'review' && <button className="secondary" onClick={approveSite}>Approve this site</button>}</div></article>
      <article className="panel"><p className="eyebrow">CHROME TAB CHECK</p><h2>Review a browser tab</h2><p className="copy">Your Chrome companion sends active URLs here. Try the live decision flow now.</p><label>Active URL<input value={url} onChange={(event) => setUrl(event.target.value)} /></label><button className="primary wide" onClick={() => void reviewTab()}>Check active tab <span>→</span></button><p className="decision"><b>{decision.source}</b> · {decision.reason}</p></article>
      <article className="panel"><p className="eyebrow">ATTENTION SENSE</p><h2>Phone-check awareness</h2><p className="copy">Optional, local head-pose sensing notices repeated downward glances. No video is stored or uploaded.</p><div className="toggle-row"><span><b>Camera monitoring</b><small>{cameraOn ? 'Local sensing enabled' : 'Off until you opt in'}</small></span><button className={`toggle ${cameraOn ? 'toggle--on' : ''}`} onClick={() => void toggleCamera()} aria-pressed={cameraOn}><i /></button></div><button className="text-button">Calibrate camera →</button></article>
    </section>
    <section className="bottom"><article className="panel domains"><div><p className="eyebrow">FOCUS LIST</p><h2>Approved workspaces</h2></div><div className="chips">{domains.map((domain) => <span key={domain}>{domain}</span>)}</div></article><article className="panel cloud"><p className="eyebrow">AI REVIEW</p><label>Cloud classifier endpoint<input placeholder="https://your-api.example.com/classify" value={cloudEndpoint} onChange={(event) => setCloudEndpoint(event.target.value)} /></label><small>Used only when local rules are uncertain.</small></article></section>
    <footer>NotchFlow is a gentle signal, not a lockout. Your decisions always come first.</footer>
  </main>
}

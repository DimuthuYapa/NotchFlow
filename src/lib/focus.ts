export type Decision = 'approved' | 'distracting' | 'review'
export type FocusState = 'focused' | 'grace' | 'distracted' | 'paused'
export type UrlDecision = { decision: Decision; source: 'allowlist' | 'heuristic' | 'cloud' | 'fallback'; reason: string }

const distractingTerms = ['youtube.com', 'netflix.com', 'tiktok.com', 'instagram.com', 'reddit.com', 'x.com', 'twitter.com', 'facebook.com', 'twitch.tv']

export function getHostname(url: string) { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }
export function classifyLocally(url: string, allowedDomains: string[]): UrlDecision {
  const hostname = getHostname(url)
  if (!hostname) return { decision: 'review', source: 'fallback', reason: 'This tab does not expose a valid URL.' }
  if (allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) return { decision: 'approved', source: 'allowlist', reason: 'This domain is on your focus list.' }
  if (distractingTerms.some((term) => hostname === term || hostname.endsWith(`.${term}`))) return { decision: 'distracting', source: 'heuristic', reason: 'This domain matches your distraction policy.' }
  return { decision: 'review', source: 'heuristic', reason: 'This site needs a quick review.' }
}

export async function classifyWithCloud(url: string, endpoint?: string): Promise<UrlDecision> {
  if (!endpoint) return { decision: 'review', source: 'fallback', reason: 'Cloud review is not configured.' }
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
  if (!response.ok) throw new Error('Cloud classifier was unavailable.')
  const data = await response.json() as { decision?: Decision; reason?: string }
  if (!data.decision || !['approved', 'distracting', 'review'].includes(data.decision)) throw new Error('Cloud classifier returned an invalid decision.')
  return { decision: data.decision, source: 'cloud', reason: data.reason ?? 'Cloud classifier reviewed this tab.' }
}

export function nextFocusState(decision: Decision, monitoring: boolean): FocusState {
  if (!monitoring) return 'paused'
  return decision === 'approved' ? 'focused' : decision === 'distracting' ? 'grace' : 'focused'
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
const adminWorkspaceRoles = ['admin', 'lecturer', 'demonstrator']

// ─── Inline styles as JS objects ─────────────────────────────────────────────

const theme = {
  green900: '#0d2b1a',
  green800: '#134522',
  green700: '#1a5c2d',
  green600: '#226e38',
  green500: '#2e8b47',
  green400: '#3dab5a',
  green300: '#6dc98a',
  green100: '#d4f4df',
  green50:  '#edfaf3',
  sage:     '#8fb89e',
  cream:    '#f8fbf6',
  white:    '#ffffff',
  gray50:   '#f9fafb',
  gray100:  '#f3f4f6',
  gray200:  '#e5e7eb',
  gray400:  '#9ca3af',
  gray500:  '#6b7280',
  gray700:  '#374151',
  gray900:  '#111827',
}

const fonts = {
  display: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
}

const styles = {
  page: {
    fontFamily: fonts.body,
    backgroundColor: theme.cream,
    minHeight: '100vh',
    color: theme.gray900,
  },

  // ── Nav ──────────────────────────────────────────────────────────────────
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2.5rem',
    height: '64px',
    backgroundColor: 'rgba(248,251,246,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: `1px solid ${theme.gray200}`,
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  navLogoMark: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: theme.green600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogoText: {
    fontFamily: fonts.display,
    fontWeight: 700,
    fontSize: '1.05rem',
    color: theme.green900,
    letterSpacing: '-0.01em',
  },
  navActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero: {
    padding: '5rem 2.5rem 3.5rem',
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '4rem',
    alignItems: 'center',
  },
  heroEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: theme.green600,
    backgroundColor: theme.green50,
    border: `1px solid ${theme.green100}`,
    borderRadius: '999px',
    padding: '0.3rem 0.9rem',
    marginBottom: '1.5rem',
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
    lineHeight: 1.08,
    fontWeight: 700,
    color: theme.green900,
    letterSpacing: '-0.02em',
    marginBottom: '1.25rem',
  },
  heroTitleAccent: {
    color: theme.green600,
    fontStyle: 'italic',
  },
  heroSubtitle: {
    fontSize: '1.05rem',
    lineHeight: 1.7,
    color: theme.gray500,
    maxWidth: '520px',
    marginBottom: '2.25rem',
  },
  heroCtas: {
    display: 'flex',
    gap: '0.85rem',
    flexWrap: 'wrap',
  },

  // ── Metrics panel ─────────────────────────────────────────────────────────
  metricsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  metricCard: {
    backgroundColor: theme.white,
    border: `1px solid ${theme.gray200}`,
    borderRadius: '16px',
    padding: '1.5rem 1.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  metricIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricValue: {
    fontFamily: fonts.display,
    fontSize: '1.9rem',
    fontWeight: 700,
    lineHeight: 1,
    color: theme.green900,
  },
  metricLabel: {
    fontSize: '0.8rem',
    color: theme.gray500,
    marginTop: '0.2rem',
    lineHeight: 1.4,
  },

  // ── Status bar ────────────────────────────────────────────────────────────
  statusBar: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 2.5rem',
    marginBottom: '1rem',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: theme.green700,
    backgroundColor: theme.green50,
    border: `1px solid ${theme.green100}`,
    borderRadius: '999px',
    padding: '0.45rem 1rem',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: theme.green500,
    animation: 'pulse 2s infinite',
  },

  // ── Section wrapper ────────────────────────────────────────────────────────
  section: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 2.5rem 3.5rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: '1.45rem',
    fontWeight: 700,
    color: theme.green900,
    letterSpacing: '-0.01em',
  },
  sectionMeta: {
    fontSize: '0.82rem',
    color: theme.gray400,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.25rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.25rem',
  },

  // ── Session card ──────────────────────────────────────────────────────────
  sessionCard: {
    backgroundColor: theme.white,
    border: `1px solid ${theme.gray200}`,
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s, transform 0.2s',
    cursor: 'default',
  },
  sessionCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  sessionTitle: {
    fontWeight: 600,
    fontSize: '0.97rem',
    color: theme.gray900,
    lineHeight: 1.4,
  },
  sessionMeta: {
    fontSize: '0.8rem',
    color: theme.gray400,
    lineHeight: 1.55,
  },
  sessionDivider: {
    borderTop: `1px solid ${theme.gray100}`,
    margin: '0.25rem 0',
  },
  sessionFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.25rem',
  },

  // ── Badges ─────────────────────────────────────────────────────────────────
  badge: (color) => {
    const map = {
      success: { bg: theme.green50, text: theme.green700, border: theme.green100 },
      warning: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
      info:    { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
      neutral: { bg: theme.gray100, text: theme.gray500, border: theme.gray200 },
    }
    const c = map[color] || map.neutral
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      padding: '0.25rem 0.65rem',
      borderRadius: '999px',
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: theme.green600,
    color: theme.white,
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.88rem',
    fontWeight: 600,
    fontFamily: fonts.body,
    cursor: 'pointer',
    transition: 'background 0.18s, transform 0.15s',
    textDecoration: 'none',
  },
  btnOutlined: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    color: theme.green700,
    border: `1.5px solid ${theme.green300}`,
    borderRadius: '10px',
    padding: '0.72rem 1.4rem',
    fontSize: '0.88rem',
    fontWeight: 600,
    fontFamily: fonts.body,
    cursor: 'pointer',
    transition: 'background 0.18s, border-color 0.18s',
    textDecoration: 'none',
  },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'transparent',
    color: theme.green600,
    border: 'none',
    padding: '0.4rem 0',
    fontSize: '0.82rem',
    fontWeight: 600,
    fontFamily: fonts.body,
    cursor: 'pointer',
    textDecoration: 'none',
  },

  // ── Empty + Loading ────────────────────────────────────────────────────────
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: theme.gray400,
    fontSize: '0.9rem',
    backgroundColor: theme.white,
    border: `1px dashed ${theme.gray200}`,
    borderRadius: '16px',
  },
  loader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: `3px solid ${theme.gray200}`,
    borderTop: `3px solid ${theme.green600}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    maxWidth: '1280px',
    margin: '0 auto 2.5rem',
    padding: '0 2.5rem',
  },
  dividerLine: {
    borderTop: `1px solid ${theme.gray200}`,
  },
}

// ─── Small reusable sub-components ───────────────────────────────────────────

function LeafIcon({ size = 16, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

function MetricCard({ value, label, iconBg, icon }) {
  return (
    <div
      style={styles.metricCard}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ ...styles.metricIcon, backgroundColor: iconBg }}>
        {icon}
      </div>
      <div>
        <div style={styles.metricValue}>{value}</div>
        <div style={styles.metricLabel}>{label}</div>
      </div>
    </div>
  )
}

function Badge({ color, children }) {
  return <span style={styles.badge(color)}>{children}</span>
}

function SessionCard({ session, label, badgeColor, onAction, actionLabel }) {
  return (
    <div
      style={styles.sessionCard}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={styles.sessionCardHeader}>
        <div style={styles.sessionTitle}>
          {session.session_title || session.lab_name || `Lab ${session.id}`}
        </div>
        {label && <Badge color={badgeColor}>{label}</Badge>}
      </div>
      <div style={styles.sessionMeta}>
        {session.subject && <div>{session.subject}</div>}
        <div>{session.department_name || session.department_id || '—'}</div>
      </div>
      <div style={styles.sessionDivider} />
      <div style={{ fontSize: '0.78rem', color: theme.gray400 }}>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          Deadline {new Date(session.date || session.submission_deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        {session.available_from && (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.2rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Opens {new Date(session.available_from).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      {onAction && (
        <div style={styles.sessionFooter}>
          <button style={styles.btnGhost} onClick={onAction}>
            {actionLabel || 'Open'} →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const [backendStatus, setBackendStatus]       = useState(null)
  const [loading, setLoading]                   = useState(true)
  const [sessions, setSessions]                 = useState([])
  const [availableSessions, setAvailableSessions] = useState([])
  const [userRole, setUserRole]                 = useState(null)
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    const loadData = async () => {
      try {
        const healthRes   = await api.get('/health').catch(() => null)
        if (healthRes?.data) setBackendStatus(healthRes.data)

        const sessionsRes = await api.get('/sessions').catch(() => null)
        if (sessionsRes?.data?.data) setSessions(sessionsRes.data.data)

        if (token) {
          const meRes = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
          if (meRes?.data?.data?.role) setUserRole(meRes.data.data.role)

          const availableRes = await api.get('/student/available-sessions', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
          if (availableRes?.data?.data) setAvailableSessions(availableRes.data.data)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const isAdmin = adminWorkspaceRoles.includes(userRole)

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600&display=swap');
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>
        <div style={{ ...styles.page, ...styles.loader }}>
          <div style={styles.spinner} />
        </div>
      </>
    )
  }

  const openCount = availableSessions.filter(s => s.can_submit).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes pulse  { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        .hero-content { animation: fadeUp 0.55s ease both; }
        .hero-metrics { animation: fadeUp 0.55s 0.12s ease both; }
        .section-anim { animation: fadeUp 0.5s 0.2s ease both; }
      `}</style>

      <div style={styles.page}>

        {/* ── Nav ── */}
        <nav style={styles.nav}>
          <div style={styles.navLogo}>
            <div style={styles.navLogoMark}>
              <LeafIcon size={18} />
            </div>
            <span style={styles.navLogoText}>AgriRuh Lab Portal</span>
          </div>
          <div style={styles.navActions}>
            {token ? (
              <button
                style={styles.btnPrimary}
                onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.green700}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.green600}
              >
                {isAdmin ? 'Workspace' : 'Dashboard'} →
              </button>
            ) : (
              <>
                <button
                  style={styles.btnOutlined}
                  onClick={() => navigate('/register')}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.green50 }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Register
                </button>
                <button
                  style={styles.btnPrimary}
                  onClick={() => navigate('/login')}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.green700}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.green600}
                >
                  Sign in →
                </button>
              </>
            )}
          </div>
        </nav>

        {/* ── Hero ── */}
        <div style={styles.hero}>
          <div className="hero-content">
            <div style={styles.heroEyebrow}>
              <LeafIcon size={11} color={theme.green600} />
              Faculty of Agriculture · University of Ruhuna
            </div>
            <h1 style={styles.heroTitle}>
              Lab submissions &amp;<br />
              <span style={styles.heroTitleAccent}>academic review,</span><br />
              one portal.
            </h1>
            <p style={styles.heroSubtitle}>
              Manage submission periods, review student work, and maintain grading records — all through a single, unified system built for the Faculty of Agriculture.
            </p>
            <div style={styles.heroCtas}>
              {token ? (
                <>
                  <button
                    style={styles.btnPrimary}
                    onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.green700}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.green600}
                  >
                    {isAdmin ? 'Open workspace' : 'Open dashboard'} →
                  </button>
                  {!isAdmin && (
                    <button
                      style={styles.btnOutlined}
                      onClick={() => navigate('/submissions')}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.green50}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      View submissions
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    style={styles.btnPrimary}
                    onClick={() => navigate('/login')}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.green700}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.green600}
                  >
                    Sign in →
                  </button>
                  <button
                    style={styles.btnOutlined}
                    onClick={() => navigate('/register')}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.green50}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Create account
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metrics panel */}
          <div style={styles.metricsPanel} className="hero-metrics">
            <MetricCard
              value={sessions.length}
              label="Active lab sessions listed"
              iconBg={theme.green50}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.green600} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              }
            />
            <MetricCard
              value={openCount}
              label="Open for student submission"
              iconBg="#eff6ff"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
            <MetricCard
              value={backendStatus ? 'Online' : 'Offline'}
              label={backendStatus ? `Uptime ${Math.round(backendStatus.uptime)}s · ${backendStatus.environment}` : 'System unavailable'}
              iconBg={backendStatus ? theme.green50 : '#fef2f2'}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={backendStatus ? theme.green600 : '#ef4444'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Status bar ── */}
        {backendStatus && (
          <div style={styles.statusBar}>
            <span style={styles.statusPill}>
              <span style={styles.statusDot} />
              All systems operational · {backendStatus.environment} environment · Uptime {Math.round(backendStatus.uptime)}s
            </span>
          </div>
        )}

        {/* ── Divider ── */}
        <div style={styles.divider}><div style={styles.dividerLine} /></div>

        {/* ── Available sessions (student) ── */}
        {!isAdmin && token && availableSessions.length > 0 && (
          <section style={styles.section} className="section-anim">
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Your available sessions</h2>
              <span style={styles.sectionMeta}>{availableSessions.length} session{availableSessions.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={styles.grid3}>
              {availableSessions.slice(0, 3).map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  label={session.has_submitted ? 'Submitted' : session.availability === 'open' ? 'Open' : 'Scheduled'}
                  badgeColor={session.has_submitted ? 'info' : session.availability === 'open' ? 'success' : 'warning'}
                  onAction={() => navigate('/dashboard')}
                  actionLabel="Open dashboard"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Published sessions ── */}
        <section style={styles.section} className="section-anim">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Published sessions</h2>
            <span style={styles.sectionMeta}>{sessions.length} total</span>
          </div>
          {sessions.length > 0 ? (
            <div style={styles.grid2}>
              {sessions.slice(0, 6).map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onAction={() => navigate(token ? (isAdmin ? '/admin' : '/dashboard') : '/login')}
                  actionLabel={token ? (isAdmin ? 'Open workspace' : 'Open dashboard') : 'Sign in to continue'}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={theme.gray300} strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div>No active lab sessions at the moment.</div>
            </div>
          )}
        </section>

      </div>
    </>
  )
}

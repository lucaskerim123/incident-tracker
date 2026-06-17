const STYLES = {
  legal:         { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa', label: 'Legal' },
  mental_health: { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc', label: 'Mental Health' },
  police:        { bg: 'rgba(249,115,22,0.15)',  text: '#fb923c', label: 'Police' },
  court:         { bg: 'rgba(239,68,68,0.15)',   text: '#f87171', label: 'Court' },
  avo:           { bg: 'rgba(234,179,8,0.15)',   text: '#facc15', label: 'AVO' },
  other:         { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: 'Other' },
}

export default function CategoryBadge({ category, size = 'sm' }) {
  const s = STYLES[category] ?? STYLES.other
  const px = size === 'xs' ? '6px' : '10px'
  const py = size === 'xs' ? '2px' : '4px'
  const fs = size === 'xs' ? '11px' : '12px'
  return (
    <span style={{ background: s.bg, color: s.text, padding: `${py} ${px}`, fontSize: fs, borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

export { STYLES as CATEGORY_STYLES }

const StatusBadge = ({ tone, variant = 'pill', children }) => (
  <span className={`status ${tone} ${variant === 'dot' ? 'status--dot' : ''}`}>{children}</span>
)

const InfoCard = ({ label, value }) => (
  <div className="info-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)

const MiniCard = ({ label, value }) => (
  <div className="mini-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)

const MetricCard = ({ label, value, hint }) => (
  <article className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{hint}</small>
  </article>
)

const MasterListRow = ({ active, children, onClick }) => (
  <button
    className={`table-row order-row ${active ? 'active-card' : ''}`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
)

const FrameShapePreview = ({ title, image, imageAlt }) => {
  if (!image) {
    return (
      <div
        style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '72px', color: '#888' }}
      >
        No image uploaded
      </div>
    )
  }

  return (
    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '72px', position: 'relative' }}>
      <img
        alt={imageAlt || title || 'Frame shape'}
        src={image}
        style={{
          display: 'block',
          maxHeight: '64px',
          maxWidth: '92px',
          objectFit: 'contain',
          userSelect: 'none',
        }}
      />
    </div>
  )
}


export {
  FrameShapePreview,
  InfoCard,
  MasterListRow,
  MetricCard,
  MiniCard,
  StatusBadge,
}

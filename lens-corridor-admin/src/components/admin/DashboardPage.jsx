import { MetricCard, MiniCard, StatusBadge } from './AdminUiPrimitives'

const DashboardPage = ({
  salesCaption,
  salesData,
  salesRange,
  setSalesRange,
  salesRanges,
  dashboardHero,
  dashboardMetrics,
  storePerformance,
  operationalQueue,
  productInsights,
}) => (
  <>
    <div className="hero-panel">
      <div>
        <p className="eyebrow">Operations snapshot</p>
        <h3>Revenue, service queue, and store health at a glance</h3>
        <p className="muted">Designed for fast tablet review during store rounds, morning huddles, and owner-level monitoring.</p>
      </div>
      <div className="hero-stats">
        <div>
          <span>Revenue Today</span>
          <strong>{dashboardHero.revenueToday}</strong>
        </div>
        <div>
          <span>Pending Orders</span>
          <strong>{dashboardHero.pendingOrders}</strong>
        </div>
      </div>
    </div>

    <div className="metric-grid">
      {dashboardMetrics.map((metric, index) => (
        <MetricCard
          hint={metric.hint}
          key={`${metric.label}-${index}`}
          label={metric.label}
          value={metric.value}
        />
      ))}
    </div>

    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Sales trend</p>
            <h4>Today / Weekly / Monthly comparison</h4>
          </div>
          <div className="segmented">
            {salesRanges.map((range) => (
              <button
                className={`segment-btn ${salesRange === range ? 'active' : ''}`}
                key={range}
                onClick={() => setSalesRange(range)}
                type="button"
              >
                {range === 'weekly' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-area">
          <div className="chart-caption">{salesCaption}</div>
          <div className="chart-bars" style={{ gridTemplateColumns: `repeat(${salesData.values.length}, 1fr)` }}>
            {salesData.values.map((value, index) => (
              <span
                key={`${salesRange}-${value}-${index}`}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
          <div className="chart-labels" style={{ gridTemplateColumns: `repeat(${salesData.labels.length}, 1fr)` }}>
            {salesData.labels.map((label, index) => (
              <span key={`${label}-${index}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Store performance</p>
            <h4>Store-wise snapshot</h4>
          </div>
        </div>
        <div className="orders-table-shell">
          <table className="orders-table listing-table listing-table--three">
            <thead>
              <tr>
                <th>Store</th>
                <th>Revenue Snapshot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {storePerformance.length ? storePerformance.map((store) => (
                <tr key={store.id}>
                  <td>
                    <strong className="table-cell-primary">{store.name}</strong>
                    <small className="table-cell-secondary">{store.subtitle}</small>
                  </td>
                  <td>
                    <strong className="table-cell-primary">{store.revenue}</strong>
                    <small className="table-cell-secondary">{store.meta}</small>
                  </td>
                  <td>
                    <StatusBadge tone={store.tone}>{store.status}</StatusBadge>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td>
                    <strong className="table-cell-primary">No store data yet</strong>
                    <small className="table-cell-secondary">Store performance will appear after app orders are placed</small>
                  </td>
                  <td>-</td>
                  <td><StatusBadge tone="neutral">Empty</StatusBadge></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Operational queue</p>
            <h4>Pending actions</h4>
          </div>
        </div>
        <div className="task-list">
          {operationalQueue.map((item, index) => (
            <div className="task-item" key={`${item.title}-${index}`}>
              <strong>{item.title}</strong>
              <small>{item.meta}</small>
            </div>
          ))}

        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Product insights</p>
            <h4>Top selling items</h4>
          </div>
        </div>
        <div className="mini-grid">
          {productInsights.map((item, index) => (
            <MiniCard
              key={`${item.label}-${index}`} label={item.label} value={item.value} />
          ))}
        </div>
      </section>
    </div>
  </>
)

export default DashboardPage

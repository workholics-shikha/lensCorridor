import { MetricCard, MiniCard, StatusBadge } from './AdminUiPrimitives'

const DashboardPage = ({
  salesCaption,
  salesData,
  salesRange,
  setSalesRange,
  salesRanges,
  dashboardStoreFilter,
  setDashboardStoreFilter,
  dashboardStoreOptions,
  dashboardStoreLabel,
  dashboardHero,
  dashboardRevenueCards,
  dashboardMetrics,
  storePerformance,
  operationalQueue,
  productInsights,
  isStoreFilterLocked = false,
}) => (
  <>
    <div className="hero-panel dashboard-hero-panel">
      <div className="dashboard-hero-copy">
        <p className="eyebrow">Revenue overview</p>
        <h3>Track revenue performance across today, weekly, and monthly windows</h3>
        <p className="dashboard-scope-copy">Viewing revenue for {dashboardStoreLabel}.</p>
        <div className="dashboard-filter-card">
          <div className="dashboard-filter-copy">
            <span className="dashboard-filter-kicker">Store Filter</span>
            <p>Select a store to review its revenue, sales trend, and billing performance.</p>
          </div>
          <div className="dashboard-filter-group">
            <label className="dashboard-filter-label" htmlFor="dashboard-store-filter">Choose Store</label>
            <div className="dashboard-filter-select-wrap">
              <select
                className="input filled dashboard-filter-select"
                disabled={isStoreFilterLocked}
                id="dashboard-store-filter"
                onChange={(event) => setDashboardStoreFilter(event.target.value)}
                value={dashboardStoreFilter}
              >
                {dashboardStoreOptions.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-hero-highlight">
        <span>Pending Orders</span>
        <strong>{dashboardHero.pendingOrders}</strong>
        <small>Orders that still need billing, fulfillment, or follow-up action.</small>
      </div>
    </div>

    <div className="dashboard-revenue-grid">
      {dashboardRevenueCards.map((card) => (
        <article className="dashboard-revenue-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.hint}</small>
        </article>
      ))}
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
          <div className="dashboard-chart-summary">
            {salesData.labels.map((label, index) => (
              <div className="dashboard-chart-summary__item" key={`${label}-${index}`}>
                <span>{label}</span>
                <strong>
                  Rs. {Number(salesData.totals?.[index] ?? 0).toLocaleString('en-IN')}
                </strong>
              </div>
            ))}
          </div>
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
                    <StatusBadge tone={store.tone} variant="dot">{store.status}</StatusBadge>
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

export default function Home() {
  return (
    <main className="page page-narrow">
      <h1>Deal Desk Quote Simulator</h1>
      <p className="muted">Build, price, and review deal desk quotes.</p>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2>Get started</h2>
        <div className="btn-row">
          <a className="btn btn-primary" href="/quote">
            Build a quote
          </a>
          <a className="btn" href="/quotes">
            View saved quotes
          </a>
        </div>
      </div>
    </main>
  );
}

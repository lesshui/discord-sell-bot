import Link from "next/link";

export default function Home() {
  return (
    <section className="hero">
      <span className="badge">Pokemon trading cards MVP</span>
      <h1>Instant offers with Discord order rooms.</h1>
      <p className="muted">
        Sellers authenticate with Discord, submit Pokemon card photos/details, receive an immediate configurable offer,
        accept terms, choose payout, and get private channel updates through delivery, inspection, and payout.
      </p>
      <div className="row">
        <Link className="button" href="/sell">Start selling</Link>
        <Link className="button secondary" href="/admin">Admin dashboard</Link>
      </div>
      <div className="grid">
        <div className="card"><h3>Offer toggles</h3><p className="muted">Manual admin, rule-based, AI-assisted placeholder, and external API placeholder modes are admin controlled.</p></div>
        <div className="card"><h3>Manual labels</h3><p className="muted">Admins upload a label URL for MVP; shipping deductions are shown before seller acceptance.</p></div>
        <div className="card"><h3>Inspection first</h3><p className="muted">Payout is prompted only after delivery plus admin inspection approval.</p></div>
      </div>
    </section>
  );
}

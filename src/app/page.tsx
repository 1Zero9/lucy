export default function Page() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">LUCY</div>
        <nav className="nav" aria-label="Primary">
          <a href="/">Home</a>
          <a href="#">Modules</a>
          <a href="#">Notes</a>
          <a href="#">Tasks</a>
        </nav>
      </aside>

      <main className="main">
        <section className="hero">
          <h1>Your learning workspace.</h1>
          <p>Capture. Organise. Learn. Succeed.</p>
        </section>

        <input className="search" aria-label="Search" placeholder="Search anything…" />

        <section className="cards" aria-label="Getting started">
          <article className="card">
            <h2>Start a workspace</h2>
            <p>Create a home for any course, subject, qualification or learning project.</p>
          </article>
          <article className="card">
            <h2>Create a module</h2>
            <p>Keep related notes and resources together without complicated navigation.</p>
          </article>
          <article className="card">
            <h2>Write your first note</h2>
            <p>Fast, safe note-taking is the first core LUCY workflow.</p>
          </article>
        </section>
      </main>
    </div>
  );
}

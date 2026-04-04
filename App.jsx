import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">React base file</p>
        <h1>Website starter</h1>
        <p className="subtitle">
          This is a clean starter component with a map placeholder section.
        </p>
      </header>

      <main className="content-grid">
        <section className="card">
          <h2>About this section</h2>
          <p>
            Use this area for your main website content, headings, buttons, or other
            React components.
          </p>
        </section>

        <section className="card map-card">
          <div className="map-text">
            <h2>Map placeholder</h2>
            <p>Replace the image below with your real map when ready.</p>
            <p className="code-note">
              In this file, look for the comment: <code>MAP PLACEHOLDER - REPLACE HERE</code>
            </p>
          </div>

          {/* MAP PLACEHOLDER - REPLACE HERE
              Option 1: Replace the image src with your own map image URL or imported file.
              Option 2: Replace this entire <img /> block with an embedded map component.
          */}
          <img
            className="map-placeholder"
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png"
            alt="Map placeholder"
          />
        </section>
      </main>
    </div>
  );
}
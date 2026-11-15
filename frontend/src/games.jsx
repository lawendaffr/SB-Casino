import { Link } from "react-router-dom";

const games = [
  { number: "01", title: "Blackjack", type: "Cards", playable: true, art: "art-blackjack" },
  { number: "02", title: "Coming soon", type: "02", art: "art-violet" },
  { number: "03", title: "Coming soon", type: "03", art: "art-coral" },
  { number: "04", title: "Coming soon", type: "04", art: "art-cyan" },
  { number: "05", title: "Coming soon", type: "05", art: "art-blue" }
];

function GameCards() {
  return <div className="game-grid">
    {games.map((game) => {
      const content = <>
        <div className={`game-art ${game.art}`} aria-hidden="true">
          {game.playable ? <><span className="art-glow" /><span className="art-symbol">21</span><span className="art-suit">♠</span><span className="art-label">BLACKJACK</span></> : <><span className="placeholder-number">{game.number}</span><span className="placeholder-status">COMING SOON</span></>}
        </div>
        <div className="game-tile-meta"><div><h2>{game.title}</h2><p>{game.type}</p></div>{game.playable ? <span className="game-launch" aria-hidden="true">↗</span> : <span className="soon-dot" aria-hidden="true" />}</div>
      </>;
      return game.playable
        ? <Link className="game-tile game-tile-playable" to="/blackjack" key={game.number}>{content}</Link>
        : <article className="game-tile game-tile-soon" key={game.number}>{content}</article>;
    })}
  </div>;
}

export function SiteFooter() {
  return <footer className="site-footer"><span>SB-CASINO</span><span>© 2026 SB-Casino. All rights reserved.</span></footer>;
}

export function HomePage() {
  return <>
    <main className="home-shell">
      <header className="home-welcome">
        <div><p className="section-eyebrow">SB-CASINO / HOME</p><h1>Welcome to SB-Casino</h1><p className="welcome-description">Browse the current games and upcoming titles.</p></div>
        <div className="welcome-actions"><a className="welcome-primary" href="#games" onClick={(event) => { event.preventDefault(); document.getElementById("games")?.scrollIntoView({ behavior: "smooth" }); }}>View games <span aria-hidden="true">↓</span></a><Link className="welcome-secondary" to="/login">Create an account</Link></div>
        <div className="welcome-mark" aria-hidden="true"><span>SB</span></div>
      </header>
      <section className="games-section" id="games" aria-labelledby="games-title">
        <header className="games-heading"><div><p className="section-eyebrow">LOBBY</p><h2 id="games-title">Games</h2></div><p className="games-count"><span /> 1 available <b>/</b> 4 coming soon</p></header>
        <GameCards />
      </section>
    </main>
    <SiteFooter />
  </>;
}

export function GamesPage() {
  return <>
    <main className="home-shell">
      <header className="games-heading"><div><p className="section-eyebrow">LOBBY</p><h1>Games</h1></div><p className="games-count"><span /> 1 available <b>/</b> 4 coming soon</p></header>
      <section className="games-section" aria-label="Casino games"><GameCards /></section>
    </main>
    <SiteFooter />
  </>;
}

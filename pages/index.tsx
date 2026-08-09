import Head from "next/head";
import Image from "next/image";

export default function Popup() {
  return (
    <>
      <Head>
        <title>OLWLG Beautifier</title>
        <meta
          name="description"
          content="A calmer, clearer interface for OLWLG."
        />
      </Head>

      <main className="popup-shell">
        <header className="brand">
          <span className="brand-mark" aria-hidden="true">
            OB
          </span>
          <div>
            <p className="eyebrow">Browser extension</p>
            <h1>OLWLG Beautifier</h1>
          </div>
        </header>

        <section className="status-card" aria-labelledby="status-heading">
          <div>
            <p className="eyebrow">Appearance</p>
            <h2 id="status-heading">Modern interface</h2>
            <p id="status-copy">Loading your preference…</p>
          </div>

          <label className="switch">
            <span className="sr-only">Enable the modern interface</span>
            <input id="beautifier-toggle" type="checkbox" defaultChecked />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
          </label>
        </section>

        <a
          className="primary-action"
          href="https://bgg.activityclub.org/olwlg/"
          target="_blank"
          rel="noreferrer"
        >
          Open OLWLG
          <span aria-hidden="true">↗</span>
        </a>

        <footer className="popup-footer">
          <p className="footer-note">
            Refresh an open OLWLG tab after installing the extension.
          </p>
          <a
            className="bgg-attribution"
            href="https://boardgamegeek.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit BoardGameGeek"
          >
            <Image
              src="/assets/powered-by-bgg.svg"
              alt="Powered by BoardGameGeek"
              width="171"
              height="38"
            />
          </a>
          <a
            className="contact-link"
            href="mailto:olwlg.beautifier@gmail.com"
            aria-label="Email OLWLG Beautifier support"
          >
            <span className="contact-link__label">Contact</span>
            <span className="contact-link__address">
              olwlg.beautifier@gmail.com
            </span>
          </a>
        </footer>
      </main>
    </>
  );
}

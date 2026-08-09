import Head from "next/head";
import Link from "next/link";

export default function Support() {
  return (
    <>
      <Head>
        <title>Support · OLWLG Beautifier</title>
        <meta
          name="description"
          content="Support information for the OLWLG Beautifier browser extension."
        />
      </Head>

      <main className="privacy-shell">
        <header className="privacy-header">
          <span className="brand-mark" aria-hidden="true">
            OB
          </span>
          <div>
            <p className="eyebrow">OLWLG Beautifier</p>
            <h1>Support</h1>
            <p className="privacy-effective">Help with the browser extension</p>
          </div>
        </header>

        <section className="privacy-summary" aria-labelledby="support-title">
          <h2 id="support-title">Contact support</h2>
          <p>
            Email{" "}
            <a href="mailto:olwlg.beautifier@gmail.com">
              olwlg.beautifier@gmail.com
            </a>{" "}
            for installation help, bug reports, or accessibility feedback.
          </p>
        </section>

        <article className="privacy-content">
          <section>
            <h2>What to include</h2>
            <ul>
              <li>The OLWLG page where the issue occurred.</li>
              <li>What you expected to happen and what happened instead.</li>
              <li>Your Chrome and OLWLG Beautifier versions.</li>
              <li>
                A screenshot, if it does not contain information you prefer to
                keep private.
              </li>
            </ul>
          </section>

          <section>
            <h2>Protect your account</h2>
            <p>
              Do not send passwords, authentication cookies, payment
              information, or other account secrets with a support request.
            </p>
          </section>

          <section>
            <h2>Privacy</h2>
            <p>
              Read the extension&apos;s <Link href="/privacy">Privacy Policy</Link>{" "}
              for details about local processing, storage, and data handling.
            </p>
          </section>

          <p className="privacy-disclaimer">
            OLWLG Beautifier is independent and is not affiliated with or
            endorsed by OLWLG or BoardGameGeek.
          </p>
        </article>
      </main>
    </>
  );
}

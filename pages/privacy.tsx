import Head from "next/head";
import Link from "next/link";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy · OLWLG Beautifier</title>
        <meta
          name="description"
          content="Privacy policy for the OLWLG Beautifier browser extension."
        />
      </Head>

      <main className="privacy-shell">
        <header className="privacy-header">
          <span className="brand-mark" aria-hidden="true">
            OB
          </span>
          <div>
            <p className="eyebrow">OLWLG Beautifier</p>
            <h1>Privacy Policy</h1>
            <p className="privacy-effective">Effective August 2, 2026</p>
          </div>
        </header>

        <section className="privacy-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">The short version</h2>
          <p>
            OLWLG Beautifier processes OLWLG page content locally to improve
            the site&apos;s interface. The developer does not collect, receive,
            sell, or share that content.
          </p>
        </section>

        <article className="privacy-content">
          <section>
            <h2>Information processed</h2>
            <p>
              To provide its features, the extension locally processes content
              already displayed on OLWLG pages, including math-trade titles,
              game information, participant usernames, collection indicators,
              notices, and want-list form state. It may read the signed-in
              username shown by OLWLG to determine whether editing should be
              available. It does not read passwords or payment information.
            </p>
          </section>

          <section>
            <h2>How information is used</h2>
            <p>
              Information is used only to restyle and reorganize OLWLG and to
              provide search, filtering, matrix navigation, review, deadline,
              and read-only-state features.
            </p>
          </section>

          <section>
            <h2>Storage and transmission</h2>
            <ul>
              <li>
                Chrome Sync stores only the extension&apos;s enabled or disabled
                preference.
              </li>
              <li>
                Browser local and session storage may retain limited interface
                state, trade identifiers, deadline timestamps, and a local
                participation result.
              </li>
              <li>
                Page content and form state are not transmitted to the
                developer.
              </li>
              <li>
                Requests to OLWLG or BoardGameGeek are sent directly to those
                services over HTTPS and may use the user&apos;s existing session.
              </li>
            </ul>
          </section>

          <section>
            <h2>Sharing and sale</h2>
            <p>
              The developer does not receive, sell, rent, or share user data.
              The extension contains no advertising, analytics, tracking
              pixels, or developer-operated collection service.
            </p>
          </section>

          <section>
            <h2>Retention and control</h2>
            <p>
              Users can disable the extension from its popup or remove it in
              Chrome. Chrome Sync data is controlled through the user&apos;s Chrome
              account. Local OLWLG state can be removed through Chrome&apos;s site
              data controls for bgg.activityclub.org.
            </p>
          </section>

          <section>
            <h2>Changes</h2>
            <p>
              If the extension&apos;s data practices change, this policy and the
              Chrome Web Store disclosures will be updated before the changed
              behavior is released.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions can be sent to{" "}
              <a href="mailto:olwlg.beautifier@gmail.com">
                olwlg.beautifier@gmail.com
              </a>, or visit the <Link href="/support">support page</Link>.
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

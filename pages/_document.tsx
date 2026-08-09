import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#17211b" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script src="/popup.js" defer />
      </body>
    </Html>
  );
}

import { ScrollViewStyleReset } from "expo-router/html";

/**
 * Web-only root HTML for static export.
 * Runs in Node during `expo export` — no browser APIs.
 */
export default function Root({ children }) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="robots" content="noindex, nofollow" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

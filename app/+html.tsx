import { ScrollViewStyleReset } from "expo-router/html";

/**
 * Web-only root HTML for static export.
 * Runs in Node during `expo export` — no browser APIs.
 */
const WEB_ROOT_CSS = `
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background-color: #1a0033;
  }
  body {
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
  }
  #root {
    display: flex;
    flex: 1;
  }
`;

export default function Root({ children }) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#1a0033" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: WEB_ROOT_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

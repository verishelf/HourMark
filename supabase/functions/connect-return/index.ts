const APP_SCHEME = "hourmark";

function sanitizePath(value: string | null): string {
  if (value === "sell") return "sell";
  return "profile";
}

Deno.serve((req) => {
  const url = new URL(req.url);
  const path = sanitizePath(url.searchParams.get("path"));
  const deepLink = `${APP_SCHEME}:///${path}`;
  const acceptsHtml = (req.headers.get("accept") ?? "").includes("text/html");

  // Browsers opened via openAuthSessionAsync close before this renders.
  // A direct visit gets a short HTML page with a manual app link fallback.
  if (!acceptsHtml && req.headers.get("sec-fetch-mode") !== "navigate") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: deepLink,
        "Cache-Control": "no-store",
      },
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Returning to HourMark</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #000;
        color: #fff;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        text-align: center;
      }
      a {
        color: #fff;
        font-size: 18px;
      }
    </style>
  </head>
  <body>
    <div>
      <h1>Verification complete</h1>
      <p>Return to the HourMark app to continue.</p>
      <p><a href="${deepLink}">Open HourMark</a></p>
    </div>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});

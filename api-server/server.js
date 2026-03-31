const http = require("http");
const https = require("https");

const OWM_API_KEY = process.env.OWM_API_KEY;
const PORT = 3000;

if (!OWM_API_KEY) {
  console.error("ERROR: OWM_API_KEY environment variable is required");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.url?.startsWith("/api/owm/")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Rewrite path: /api/owm/weather?... → /data/2.5/weather?...&appid=KEY
  const owmPath = req.url.replace("/api/owm/", "/data/2.5/");
  const separator = owmPath.includes("?") ? "&" : "?";
  const owmUrl = `https://api.openweathermap.org${owmPath}${separator}appid=${OWM_API_KEY}`;

  https
    .get(owmUrl, (proxyRes) => {
      let body = "";
      proxyRes.on("data", (chunk) => (body += chunk));
      proxyRes.on("end", () => {
        res.writeHead(proxyRes.statusCode || 200, {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        });
        res.end(body);
      });
    })
    .on("error", (err) => {
      console.error("OWM proxy error:", err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Upstream error" }));
    });
});

server.listen(PORT, () => {
  console.log(`API proxy running on :${PORT}`);
});

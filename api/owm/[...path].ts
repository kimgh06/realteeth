export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.replace("/api/owm", "");
  const search = url.search;
  const separator = search ? "&" : "?";
  const apiKey = process.env.OWM_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const owmUrl = `https://api.openweathermap.org/data/2.5${path}${search}${separator}appid=${apiKey}`;

  const res = await fetch(owmUrl);
  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}

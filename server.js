const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const apiKey = process.env.OPENWEATHER_API_KEY;
const port = Number(process.env.PORT || 3000);
const windowMs = 60 * 1000;
const requestLimit = 60;
const requestsByAddress = new Map();
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]]
]);

if (!apiKey) {
  console.error("Set OPENWEATHER_API_KEY before starting the server.");
  process.exit(1);
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be a valid TCP port.");
  process.exit(1);
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

function getCoordinates(url) {
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lon"));

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

function isRateLimited(address) {
  const now = Date.now();
  const current = requestsByAddress.get(address);

  if (!current || now - current.startedAt >= windowMs) {
    requestsByAddress.set(address, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > requestLimit;
}

async function fetchOpenWeather(pathname, parameters) {
  const url = new URL("https://api.openweathermap.org");
  url.pathname = pathname;
  url.search = new URLSearchParams({
    ...parameters,
    appid: apiKey
  }).toString();

  let upstream;
  try {
    upstream = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    console.error("OpenWeatherMap request failed.");
    throw new Error("Weather service is temporarily unavailable.");
  }

  if (!upstream.ok) {
    const status = upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status;
    throw Object.assign(new Error("Weather service request failed."), { status });
  }

  return upstream.json();
}

async function handleApiRequest(url, response, address) {
  if (isRateLimited(address)) {
    sendJson(response, 429, { error: "Too many requests. Please try again shortly." });
    return;
  }

  if (url.pathname === "/api/geocode") {
    const city = (url.searchParams.get("q") || "").trim();
    if (!city || city.length > 100) {
      sendJson(response, 400, { error: "Enter a city name of 1 to 100 characters." });
      return;
    }

    sendJson(response, 200, await fetchOpenWeather("/geo/1.0/direct", {
      q: city,
      limit: "1"
    }));
    return;
  }

  if (url.pathname === "/api/reverse" || url.pathname === "/api/weather") {
    const coordinates = getCoordinates(url);
    if (!coordinates) {
      sendJson(response, 400, { error: "Valid latitude and longitude are required." });
      return;
    }

    const parameters = {
      lat: String(coordinates.latitude),
      lon: String(coordinates.longitude)
    };
    const isWeather = url.pathname === "/api/weather";
    if (isWeather) {
      parameters.units = "metric";
    } else {
      parameters.limit = "1";
    }

    const endpoint = isWeather ? "/data/2.5/weather" : "/geo/1.0/reverse";
    sendJson(response, 200, await fetchOpenWeather(endpoint, parameters));
    return;
  }

  sendJson(response, 404, { error: "Not found." });
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const address = request.socket.remoteAddress || "unknown";

  if (requestUrl.pathname.startsWith("/api/")) {
    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    await handleApiRequest(requestUrl, response, address);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const file = publicFiles.get(requestUrl.pathname);
  if (!file) {
    response.writeHead(404);
    response.end("Not found.");
    return;
  }

  const contents = fs.readFileSync(path.join(__dirname, file[0]));
  response.writeHead(200, {
    "Content-Type": file[1],
    "Content-Length": contents.length,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
  });
  response.end(request.method === "HEAD" ? undefined : contents);
}

http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error("Request failed:", error.message);
    if (!response.headersSent) {
      sendJson(response, error.status || 502, {
        error: error.status ? error.message : "Weather service is temporarily unavailable."
      });
    } else {
      response.destroy();
    }
  });
}).listen(port, () => {
  console.log(`Weatherly server listening on port ${port}.`);
});
const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: jsonHeaders });
}

function coordinatesFrom(url: URL) {
  const latitude = url.searchParams.get("lat");
  const longitude = url.searchParams.get("lon");
  if (!latitude?.trim() || !longitude?.trim()) {
    return null;
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    return null;
  }

  return { lat, lon };
}

export default async (request: Request) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const apiKey = Netlify.env.get("OPENWEATHER_API_KEY");

  if (!apiKey) {
    return jsonResponse({ error: "Weather service is not configured." }, 503);
  }

  const upstream = new URL("https://api.openweathermap.org");
  const parameters = new URLSearchParams({ appid: apiKey });

  if (type === "search") {
    const city = url.searchParams.get("city")?.trim();
    if (!city || city.length > 100) {
      return jsonResponse({ error: "Enter a valid city name." }, 400);
    }

    upstream.pathname = "/geo/1.0/direct";
    parameters.set("q", city);
    parameters.set("limit", "1");
  } else if (type === "reverse") {
    const coordinates = coordinatesFrom(url);
    if (!coordinates) {
      return jsonResponse({ error: "Valid coordinates are required." }, 400);
    }

    upstream.pathname = "/geo/1.0/reverse";
    parameters.set("lat", String(coordinates.lat));
    parameters.set("lon", String(coordinates.lon));
    parameters.set("limit", "1");
  } else if (type === "current") {
    const coordinates = coordinatesFrom(url);
    if (!coordinates) {
      return jsonResponse({ error: "Valid coordinates are required." }, 400);
    }

    upstream.pathname = "/data/2.5/weather";
    parameters.set("lat", String(coordinates.lat));
    parameters.set("lon", String(coordinates.lon));
    parameters.set("units", "metric");
  } else {
    return jsonResponse({ error: "Unsupported weather request." }, 400);
  }

  upstream.search = parameters.toString();

  try {
    const response = await fetch(upstream);
    if (!response.ok) {
      return jsonResponse({ error: "Weather could not be loaded. Please try again." }, 502);
    }

    return jsonResponse(await response.json());
  } catch {
    return jsonResponse({ error: "Weather service is temporarily unavailable." }, 502);
  }
};

export const config = {
  path: "/api/weather",
  method: "GET",
};

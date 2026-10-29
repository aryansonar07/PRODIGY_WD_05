const endpoints = {
  search: {
    url: "https://api.openweathermap.org/geo/1.0/direct",
    parameters: ["q", "limit"]
  },
  reverse: {
    url: "https://api.openweathermap.org/geo/1.0/reverse",
    parameters: ["lat", "lon", "limit"]
  },
  weather: {
    url: "https://api.openweathermap.org/data/2.5/weather",
    parameters: ["lat", "lon", "units"]
  }
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function validCoordinates(parameters) {
  const latitude = Number(parameters.get("lat"));
  const longitude = Number(parameters.get("lon"));

  return Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
}

export default async function weather(request) {
  if (request.method !== "GET") {
    return jsonResponse({ message: "Only GET requests are supported." }, 405);
  }

  const parameters = new URL(request.url).searchParams;
  const action = parameters.get("action");
  const endpoint = endpoints[action];

  if (!endpoint) {
    return jsonResponse({ message: "Unsupported weather request." }, 400);
  }

  if (action === "search") {
    const city = parameters.get("q")?.trim();
    if (!city || city.length > 100) {
      return jsonResponse({ message: "Enter a valid city name." }, 400);
    }
  } else if (!validCoordinates(parameters)) {
    return jsonResponse({ message: "Valid latitude and longitude are required." }, 400);
  }

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return jsonResponse({
      message: "Weather service is not configured. Set WEATHER_API_KEY in Netlify."
    }, 503);
  }

  const upstreamUrl = new URL(endpoint.url);
  for (const name of endpoint.parameters) {
    const value = parameters.get(name);
    if (value !== null) {
      upstreamUrl.searchParams.set(name, value);
    }
  }
  upstreamUrl.searchParams.set("appid", apiKey);

  let upstream;
  try {
    upstream = await fetch(upstreamUrl);
  } catch {
    return jsonResponse({ message: "Could not connect to the weather service." }, 502);
  }

  let body;
  try {
    body = await upstream.json();
  } catch {
    return jsonResponse({ message: "The weather service returned an invalid response." }, 502);
  }
  if (!upstream.ok) {
    const message = upstream.status === 401
      ? "The weather service rejected its API key. Check your Netlify WEATHER_API_KEY."
      : body.message || "The weather service request failed.";
    return jsonResponse({ message }, upstream.status);
  }

  return jsonResponse(body, 200);
}

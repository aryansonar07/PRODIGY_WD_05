# Weatherly

Weatherly is a static weather app hosted on Netlify. In production, weather
requests go through a Netlify Function so the OpenWeatherMap API key is not
exposed in browser code.

## Configure Netlify

1. In the Netlify site dashboard, open **Site configuration → Environment
   variables**.
2. Add `WEATHER_API_KEY` with an active API key from OpenWeatherMap.
3. Trigger a new deploy so the function receives the environment variable.

The site must be deployed on Netlify for `/api/weather` to work. For local
development, you can either use Netlify Dev with `WEATHER_API_KEY` set in your
environment, or create the ignored `config.js` from `config.example.js` and use
your key there. Never commit `config.js` or a real API key.
# Weatherly

Weatherly looks up current weather through a Netlify Function. The OpenWeather API key is read by the function at runtime and is never included in browser code or responses.

## Configure the API key

Add `OPENWEATHER_API_KEY` as an environment variable in the Netlify project settings, scoped to Functions runtime. Set the value to your OpenWeather API key, then redeploy the site. Do not add the key to `config.js`, frontend code, or a committed file.

The app calls `/api/weather` for city search, location lookup, and current conditions. If the runtime variable is missing, the app reports that the weather service is not configured.

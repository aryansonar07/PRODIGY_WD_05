# Weather App

This simple weather app lets you search for a city or use your location.
The API key is kept on the server so it is not sent to the browser.

## Start the app

Install Node.js 18 or newer. In PowerShell, set your OpenWeatherMap key and
start the server:

```powershell
$env:OPENWEATHER_API_KEY = "your_new_api_key"
npm start
```

Then open http://localhost:3000 in your browser.

Do not put the key in browser code or commit it to GitHub. Set
`OPENWEATHER_API_KEY` in your hosting service when you deploy the app. A
static-only host such as GitHub Pages cannot keep the key secret.

If you previously committed a key, revoke it and make a new one. Removing the
file does not remove it from old Git commits.
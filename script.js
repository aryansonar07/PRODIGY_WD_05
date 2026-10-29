const apiKey = window.WEATHER_API_KEY;
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const message = document.getElementById("message");

function requestWeather(action, parameters) {
  const query = new URLSearchParams(parameters);
  let url;

  if (apiKey) {
    const endpoints = {
      search: "https://api.openweathermap.org/geo/1.0/direct",
      reverse: "https://api.openweathermap.org/geo/1.0/reverse",
      weather: "https://api.openweathermap.org/data/2.5/weather"
    };
    query.set("appid", apiKey);
    url = endpoints[action] + "?" + query.toString();
  } else {
    query.set("action", action);
    url = "/api/weather?" + query.toString();
  }

  return fetch(url).then(function (response) {
    return response.json().then(function (data) {
      if (!response.ok) {
        throw new Error(data.message || "Weather request failed.");
      }
      return data;
    });
  });
}

function getWeather(latitude, longitude, cityName) {
  message.textContent = "Loading weather...";

  requestWeather("weather", {
    lat: latitude,
    lon: longitude,
    units: "metric"
  })
    .then(function (data) {
      document.getElementById("place").textContent = cityName;
      document.getElementById("date").textContent = new Date().toDateString();
      document.getElementById("temperature").textContent = Math.round(data.main.temp);
      document.getElementById("feels-like").textContent = Math.round(data.main.feels_like);
      document.getElementById("humidity").textContent = data.main.humidity;
      document.getElementById("wind").textContent = Math.round(data.wind.speed * 3.6);
      document.getElementById("clouds").textContent = data.clouds.all;
      document.getElementById("description").textContent = data.weather[0].description;

      let icon = "☁";
      const weather = data.weather[0].main;

      if (weather === "Clear") {
        icon = "☀";
      } else if (weather === "Rain" || weather === "Drizzle") {
        icon = "🌧";
      } else if (weather === "Snow") {
        icon = "❄";
      } else if (weather === "Thunderstorm") {
        icon = "⛈";
      }

      document.getElementById("weather-icon").textContent = icon;
      message.textContent = "Weather updated.";
    })
    .catch(function (error) {
      message.textContent = error.message;
    });
}

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const cityName = cityInput.value.trim();
  if (cityName === "") {
    message.textContent = "Enter a city name first.";
    return;
  }

  message.textContent = "Searching...";

  requestWeather("search", { q: cityName, limit: "1" })
    .then(function (places) {
      if (places.length === 0) {
        message.textContent = "City not found. Try another name.";
        return;
      }

      const city = places[0];
      getWeather(city.lat, city.lon, city.name + ", " + city.country);
    })
    .catch(function (error) {
      message.textContent = error.message;
    });
});

document.getElementById("location-button").addEventListener("click", function () {
  if (!navigator.geolocation) {
    message.textContent = "Location is not available in this browser.";
    return;
  }

  message.textContent = "Finding your location...";

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      requestWeather("reverse", {
        lat: latitude,
        lon: longitude,
        limit: "1"
      })
        .then(function (places) {
          if (places.length === 0) {
            throw new Error("Could not find your location name.");
          }

          const place = places[0];
          const cityName = place.name + ", " + place.country;
          getWeather(latitude, longitude, cityName);
        })
        .catch(function (error) {
          message.textContent = error.message;
        });
    },
    function () {
      message.textContent = "Location unavailable. Search for a city instead.";
    }
  );
});

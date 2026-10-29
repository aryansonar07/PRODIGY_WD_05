const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const message = document.getElementById("message");

function getWeatherData(parameters) {
  const query = new URLSearchParams(parameters);

  return fetch("/api/weather?" + query.toString())
    .then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "Weather could not be loaded. Please try again.");
        }
        return data;
      });
    });
}

function getWeather(latitude, longitude, cityName) {
  message.textContent = "Loading weather...";

  getWeatherData({ type: "current", lat: latitude, lon: longitude })
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

  getWeatherData({ type: "search", city: cityName })
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
      getWeatherData({ type: "reverse", lat: latitude, lon: longitude })
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

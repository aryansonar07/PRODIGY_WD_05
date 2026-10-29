const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const message = document.getElementById("message");

function getWeather(latitude, longitude, cityName) {
  message.textContent = "Loading weather...";

  const weatherUrl = "/api/weather"
    + "?lat=" + encodeURIComponent(latitude)
    + "&lon=" + encodeURIComponent(longitude);

  fetch(weatherUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Weather could not be loaded. Please try again.");
      }
      return response.json();
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

  const searchUrl = "/api/geocode?q=" + encodeURIComponent(cityName);

  fetch(searchUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("City search failed. Please try again.");
      }
      return response.json();
    })
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
      const locationUrl = "/api/reverse"
        + "?lat=" + latitude
        + "&lon=" + longitude;

      fetch(locationUrl)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Could not find your location name.");
          }
          return response.json();
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

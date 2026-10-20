const form = document.getElementById('fish-form');
const result = document.getElementById('fish-result');

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const fish = document.getElementById('fish-name').value;
  const length = Number(document.getElementById('fish-length').value);

  result.textContent = 'Your ' + fish + ' is ' + length + ' cm long.';

  if (length >= 50) {
    result.textContent += ' That is a big fish!';
  } else {
    result.textContent += ' Thanks for recording your fish!';
  }
});
//check later
// API documentation: https://open-meteo.com/en/docs
const weatherButton = document.getElementById('weather-button');
const weatherStatus = document.getElementById('weather-status');

weatherButton.addEventListener('click', async function () {
  weatherButton.disabled = true;
  weatherStatus.textContent = 'Loading weather...';
//goes after
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=1.29&longitude=103.85&current=temperature_2m,wind_speed_10m', {
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      throw new Error('Weather service unavailable.');
    }
    const data = await response.json();
    const temperature = data.current.temperature_2m;
    const wind = data.current.wind_speed_10m;
    if (!Number.isFinite(temperature) || !Number.isFinite(wind)) {
      throw new Error('Missing weather data.');
    }
    weatherStatus.textContent = 'Singapore: ' + temperature + ' °C. Wind: ' + wind + ' km/h.';
  } catch (error) {
    weatherStatus.textContent = 'Could not load the weather. Please try again.';
  } finally {
    weatherButton.disabled = false;
  }
});

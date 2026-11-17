
/**
 * Fetch current weather and 5-day forecast
 * using OpenWeatherMap API.
 */
export const fetchWeather = async (city = 'Solapur') => {
  if (!OWM_KEY) {
    await new Promise(r => setTimeout(r, 800));
    return getMock(city);
  }

  try {
    const [weatherResponse, forecastResponse] = await Promise.all([
      axios.get(`${OWM_BASE}/weather`, {
        params: { q: city, appid: OWM_KEY, units: 'metric' },
      }),
      axios.get(`${OWM_BASE}/forecast`, {
        params: { q: city, appid: OWM_KEY, units: 'metric' },
      }),
    ]);

    const current = parseOWM(weatherResponse.data);

    // Select one forecast near midday for each of the next 5 days.
    const daily = {};
    forecastResponse.data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      const hour = Number(item.dt_txt.split(' ')[1].slice(0, 2));

      if (!daily[date] || Math.abs(hour - 12) <
          Math.abs(daily[date].hour - 12)) {
        daily[date] = {
          hour,
          day: new Date(item.dt * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
          }),
          icon: item.weather[0].icon,
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
        };
      }
    });

    return {
      ...current,
      forecast: Object.values(daily).slice(0, 5),
    };
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 'Unable to fetch live weather.'
    );
  }
};

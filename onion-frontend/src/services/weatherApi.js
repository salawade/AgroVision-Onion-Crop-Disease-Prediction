
/**
 * weatherApi.js
 * AgroVision - Live Weather Service
 *
 * Features:
 * 1. Current weather using OpenWeatherMap
 * 2. Five-day weather forecast
 * 3. Marathi agricultural advice
 * 4. Demo mode fallback when API key is missing
 * 5. Error handling for API failures
 */

import axios from 'axios';

// =====================================================
// 1. API CONFIGURATION
// =====================================================

const OWM_KEY = process.env.REACT_APP_WEATHER_API_KEY;

const OWM_BASE =
  'https://api.openweathermap.org/data/2.5';

// =====================================================
// 2. DEMO WEATHER DATA
// =====================================================

const MOCK_DB = {
  default: {
    city: 'Solapur',
    country: 'IN',
    temp: 28,
    feels_like: 31,
    humidity: 62,
    wind_speed: 14,
    visibility: 10,
    condition: 'Partly Cloudy',
    icon: '02d',
    sunrise: '06:12',
    sunset: '18:45',
    uv_index: 6,
    pressure: 1012,

    forecast: [
      { day: 'Mon', icon: '01d', high: 30, low: 22 },
      { day: 'Tue', icon: '02d', high: 29, low: 21 },
      { day: 'Wed', icon: '10d', high: 26, low: 20 },
      { day: 'Thu', icon: '01d', high: 31, low: 23 },
      { day: 'Fri', icon: '03d', high: 28, low: 21 },
    ],

    agro_tip:
      'शेतात पाहणी करण्यासाठी चांगली परिस्थिती आहे. आर्द्रतेनुसार बुरशीजन्य रोगांचे निरीक्षण करा.',
  },

  pune: {
    city: 'Pune',
    country: 'IN',
    temp: 26,
    feels_like: 29,
    humidity: 68,
    wind_speed: 12,
    visibility: 8,
    condition: 'Overcast',
    icon: '04d',
    sunrise: '06:10',
    sunset: '18:50',
    uv_index: 4,
    pressure: 1008,

    forecast: [
      { day: 'Mon', icon: '04d', high: 27, low: 20 },
      { day: 'Tue', icon: '10d', high: 24, low: 19 },
      { day: 'Wed', icon: '09d', high: 22, low: 18 },
      { day: 'Thu', icon: '10d', high: 23, low: 19 },
      { day: 'Fri', icon: '02d', high: 26, low: 20 },
    ],

    agro_tip:
      'ढगाळ वातावरण आहे. पावसानंतर पिकांमध्ये बुरशीजन्य रोगांची लक्षणे तपासा.',
  },
};

// =====================================================
// 3. DEMO DATA FUNCTION
// =====================================================

const getMock = (city) => {
  const key = city.toLowerCase();

  return MOCK_DB[key] || {
    ...MOCK_DB.default,
    city,
  };
};

// =====================================================
// 4. MARATHI WEATHER CONDITION
// =====================================================

export const getMarathiCondition = (condition = '') => {
  const value = condition.toLowerCase();

  if (value.includes('cloud')) return 'अंशतः ढगाळ';
  if (value.includes('clear')) return 'स्वच्छ आकाश';
  if (value.includes('sun')) return 'उन्हाळी वातावरण';
  if (value.includes('rain')) return 'पावसाळी वातावरण';
  if (value.includes('drizzle')) return 'रिमझिम पाऊस';
  if (value.includes('thunder')) return 'मेघगर्जनेसह पाऊस';
  if (value.includes('snow')) return 'हिमवृष्टी';
  if (value.includes('mist')) return 'धुके';
  if (value.includes('fog')) return 'धुके';
  if (value.includes('haze')) return 'धुरकट वातावरण';
  if (value.includes('overcast')) return 'पूर्ण ढगाळ';

  return condition;
};

// =====================================================
// 5. MARATHI FARMER ADVICE
// =====================================================

const deriveAgroTip = (humidity, temp, condition) => {
  const cond = condition.toLowerCase();

  if (cond.includes('rain') || cond.includes('drizzle')) {
    return 'पावसाळी वातावरण आहे. फवारणी करण्यापूर्वी पावसाचा अंदाज तपासा. शेतात पाणी साचणार नाही याची काळजी घ्या.';
  }

  if (cond.includes('thunder')) {
    return 'मेघगर्जनेसह पाऊस अपेक्षित आहे. शेतातील कामे आणि फवारणी तात्पुरती टाळा. सुरक्षित ठिकाणी राहा.';
  }

  if (temp > 35) {
    return 'तापमान जास्त आहे. पिकांना योग्य वेळी पाणी द्या. शक्यतो सकाळी किंवा संध्याकाळी सिंचन करा.';
  }

  if (humidity > 75) {
    return 'हवेत आर्द्रता जास्त आहे. कांदा पिकावर बुरशीजन्य रोगांची लक्षणे तपासा आणि शेतात हवा खेळती ठेवा.';
  }

  if (humidity < 40) {
    return 'हवेतील आर्द्रता कमी आहे. जमिनीतील ओलावा तपासा आणि गरजेनुसार सिंचन करा.';
  }

  return 'हवामान तुलनेने अनुकूल आहे. शेताची नियमित पाहणी करा आणि पिकांच्या पानांवरील रोगांची लक्षणे तपासा.';
};

// =====================================================
// 6. PARSE CURRENT WEATHER
// =====================================================

const parseOWM = (data) => ({
  city: data.name,
  country: data.sys.country,

  temp: Math.round(data.main.temp),
  feels_like: Math.round(data.main.feels_like),

  humidity: data.main.humidity,

  wind_speed: Math.round(data.wind.speed * 3.6),

  visibility: Math.round(
    (data.visibility || 10000) / 1000
  ),

  condition: data.weather[0].main,
  icon: data.weather[0].icon,

  sunrise: new Date(
    data.sys.sunrise * 1000
  ).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }),

  sunset: new Date(
    data.sys.sunset * 1000
  ).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }),

  uv_index: null,
  pressure: data.main.pressure,

  forecast: [],

  agro_tip: deriveAgroTip(
    data.main.humidity,
    data.main.temp,
    data.weather[0].main
  ),
});

// =====================================================
// 7. PARSE FIVE-DAY FORECAST
// =====================================================

const parseForecast = (forecastData) => {
  const daily = {};

  forecastData.list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];

    const hour = Number(
      item.dt_txt.split(' ')[1].slice(0, 2)
    );

    if (!daily[date]) {
      daily[date] = {
        day: new Date(
          item.dt * 1000
        ).toLocaleDateString('en-US', {
          weekday: 'short',
          timeZone: 'Asia/Kolkata',
        }),

        high: item.main.temp_max,
        low: item.main.temp_min,
        icon: item.weather[0].icon,
        hour,
        selectedHourDifference: Math.abs(hour - 12),
      };
    } else {
      daily[date].high = Math.max(
        daily[date].high,
        item.main.temp_max
      );

      daily[date].low = Math.min(
        daily[date].low,
        item.main.temp_min
      );

      const difference = Math.abs(hour - 12);

      if (difference < daily[date].selectedHourDifference) {
        daily[date].icon = item.weather[0].icon;
        daily[date].selectedHourDifference = difference;
      }
    }
  });

  return Object.values(daily)
    .slice(0, 5)
    .map((day) => ({
      day: day.day,
      icon: day.icon,
      high: Math.round(day.high),
      low: Math.round(day.low),
    }));
};

// =====================================================
// 8. FETCH LIVE WEATHER
// =====================================================

export const fetchWeather = async (city = 'Solapur') => {

  // Demo mode if API key is missing
  if (!OWM_KEY) {
    console.warn(
      'Weather API key missing. Running in demo mode.'
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    return getMock(city);
  }

  try {

    // Fetch current weather and forecast together
    const [weatherResponse, forecastResponse] =
      await Promise.all([

        axios.get(`${OWM_BASE}/weather`, {
          params: {
            q: city,
            appid: OWM_KEY,
            units: 'metric',
          },
          timeout: 15000,
        }),

        axios.get(`${OWM_BASE}/forecast`, {
          params: {
            q: city,
            appid: OWM_KEY,
            units: 'metric',
          },
          timeout: 15000,
        }),

      ]);

    const currentWeather = parseOWM(
      weatherResponse.data
    );

    const forecast = parseForecast(
      forecastResponse.data
    );

    return {
      ...currentWeather,
      forecast,
    };

  } catch (error) {

    console.error(
      'Weather API error:',
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.message ||
      'Unable to fetch live weather.'
    );
  }
};


/**
 * weatherApi.js
 * AgroVision - Backend Weather Service
 *
 * Features:
 * 1. Live weather from AgroVision FastAPI backend
 * 2. Five-day weather forecast
 * 3. Marathi weather conditions
 * 4. Marathi agricultural advice
 * 5. Error handling
 */

import axios from 'axios';

// =====================================================
// 1. API CONFIGURATION
// =====================================================

const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '');

const WEATHER_URL = `${API_BASE_URL}/weather`;

// =====================================================
// 2. MARATHI WEATHER CONDITION
// =====================================================

export const getMarathiCondition = (condition = '') => {
  const value = condition.toLowerCase();

  if (value.includes('thunder')) return 'मेघगर्जनेसह पाऊस';
  if (value.includes('drizzle')) return 'रिमझिम पाऊस';
  if (value.includes('rain')) return 'पावसाळी वातावरण';
  if (value.includes('cloud')) return 'अंशतः ढगाळ';
  if (value.includes('overcast')) return 'पूर्ण ढगाळ';
  if (value.includes('clear')) return 'स्वच्छ आकाश';
  if (value.includes('sun')) return 'उन्हाळी वातावरण';
  if (value.includes('snow')) return 'हिमवृष्टी';
  if (value.includes('mist')) return 'धुके';
  if (value.includes('fog')) return 'धुके';
  if (value.includes('haze')) return 'धुरकट वातावरण';
  if (value.includes('smoke')) return 'धुरकट वातावरण';
  if (value.includes('dust')) return 'धुळीचे वातावरण';

  return condition;
};

// =====================================================
// 3. MARATHI FARMER ADVICE
// =====================================================

const deriveAgroTip = (humidity, temp, condition) => {
  const cond = condition.toLowerCase();

  if (cond.includes('thunder')) {
    return 'मेघगर्जनेसह पाऊस अपेक्षित आहे. शेतातील कामे आणि फवारणी तात्पुरती टाळा. सुरक्षित ठिकाणी राहा.';
  }

  if (cond.includes('rain') || cond.includes('drizzle')) {
    return 'पावसाळी वातावरण आहे. फवारणी करण्यापूर्वी पावसाचा अंदाज तपासा. शेतात पाणी साचणार नाही याची काळजी घ्या.';
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
// 4. FETCH LIVE WEATHER FROM BACKEND
// =====================================================

export const fetchWeather = async (city = 'Solapur') => {
  try {
    const response = await axios.get(WEATHER_URL, {
      params: {
        city: city
      },
      timeout: 30000,
    });

    const data = response.data;

    // Check whether the backend returned valid data
    if (
      !data ||
      typeof data.temp !== 'number' ||
      typeof data.humidity !== 'number'
    ) {
      throw new Error('Invalid weather data received from backend.');
    }

    // Prepare weather information
    const weatherData = {
      city: data.city || city,
      country: data.country || 'IN',

      temp: data.temp,
      feels_like: data.feels_like,

      humidity: data.humidity,
      wind_speed: data.wind_speed,
      visibility: data.visibility,

      condition: data.condition || 'Unknown',
      description: data.description || '',
      icon: data.icon || '01d',

      sunrise: data.sunrise || '--:--',
      sunset: data.sunset || '--:--',

      uv_index: null,
      pressure: data.pressure,

      forecast: Array.isArray(data.forecast)
        ? data.forecast
        : [],

      agro_tip: deriveAgroTip(
        data.humidity,
        data.temp,
        data.condition || ''
      ),
    };

    console.log('Live weather loaded:', weatherData);

    return weatherData;

  } catch (error) {
    console.error(
      'AgroVision Weather Error:',
      error.response?.data || error.message
    );

    const message =
      error.response?.data?.detail ||
      error.message ||
      'Unable to fetch live weather.';

    throw new Error(message);
  }
};

// =====================================================
// 5. WEATHER ICON URL
// =====================================================

export const getWeatherIconUrl = (icon) => {
  if (!icon) return '';

  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
};

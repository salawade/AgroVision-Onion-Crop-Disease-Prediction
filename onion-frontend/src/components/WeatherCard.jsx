/**
 * WeatherCard.jsx
 * Live weather widget for farmers
 * Uses OpenWeather API through weatherApi.js
 */

import React, { useState, useEffect } from 'react';
import { fetchWeather } from '../services/weatherApi';

// ─────────────────────────────────────────────
// Weather condition theme
// ─────────────────────────────────────────────

const CONDITION_THEME = {
  Sunny: {
    emoji: '☀️',
    bg: 'from-amber-400 to-orange-400',
    marathi: 'उन्हाळी',
  },

  Clear: {
    emoji: '🌤️',
    bg: 'from-sky-400 to-blue-500',
    marathi: 'स्वच्छ आकाश',
  },

  'Partly Cloudy': {
    emoji: '⛅',
    bg: 'from-sky-300 to-slate-400',
    marathi: 'अंशतः ढगाळ',
  },

  Overcast: {
    emoji: '☁️',
    bg: 'from-slate-400 to-slate-500',
    marathi: 'पूर्ण ढगाळ',
  },

  Rain: {
    emoji: '🌧️',
    bg: 'from-blue-500 to-indigo-500',
    marathi: 'पाऊस',
  },

  Drizzle: {
    emoji: '🌦️',
    bg: 'from-blue-400 to-teal-500',
    marathi: 'रिमझिम पाऊस',
  },

  Thunderstorm: {
    emoji: '⛈️',
    bg: 'from-slate-700 to-slate-900',
    marathi: 'वादळी पाऊस',
  },

  Snow: {
    emoji: '❄️',
    bg: 'from-sky-200 to-blue-300',
    marathi: 'बर्फ',
  },

  Mist: {
    emoji: '🌫️',
    bg: 'from-slate-300 to-slate-400',
    marathi: 'धुके',
  },

  Haze: {
    emoji: '🌁',
    bg: 'from-yellow-200 to-slate-400',
    marathi: 'धुके',
  },

  Clouds: {
    emoji: '☁️',
    bg: 'from-slate-400 to-slate-500',
    marathi: 'ढगाळ',
  },
};

const getTheme = (condition) => {
  return (
    CONDITION_THEME[condition] || {
      emoji: '🌡️',
      bg: 'from-forest-500 to-forest-700',
      marathi: 'तापमान',
    }
  );
};

// ─────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────

const Skel = ({ width = 'w-20', height = 'h-3' }) => (
  <div
    className={`${width} ${height} rounded bg-white/20 animate-pulse`}
  />
);

// ─────────────────────────────────────────────
// Stat pill
// ─────────────────────────────────────────────

const StatPill = ({ icon, label, value }) => (
  <div className="bg-white/15 border border-white/20 rounded-xl px-2 py-2 text-center backdrop-blur-sm">
    <div className="text-sm">{icon}</div>

    <p className="text-[10px] text-white/70 font-sans mt-0.5">
      {label}
    </p>

    <p className="text-xs font-sans font-semibold text-white mt-0.5">
      {value}
    </p>
  </div>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

const WeatherCard = ({ defaultCity = 'Solapur' }) => {
  const [city, setCity] = useState(defaultCity);

  const [input, setInput] = useState(defaultCity);

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  // ─────────────────────────────────────────
  // Load weather
  // ─────────────────────────────────────────

  const load = async (selectedCity) => {
    const searchCity = selectedCity.trim();

    if (!searchCity) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchWeather(searchCity);

      setData(result);

      setCity(result.city);

      setInput(result.city);
    } catch (err) {
      console.error('Weather error:', err);

      if (err.response?.status === 404) {
        setError(`शहर "${searchCity}" सापडला नाही.`);
      } else if (err.response?.status === 401) {
        setError(
          'Weather API key चुकीची किंवा निष्क्रिय आहे.'
        );
      } else if (err.response?.status === 429) {
        setError(
          'Weather API ची विनंती मर्यादा पूर्ण झाली आहे. थोड्या वेळाने पुन्हा प्रयत्न करा.'
        );
      } else {
        setError(
          'हवामान सेवा उपलब्ध नाही. API key आणि इंटरनेट कनेक्शन तपासा.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // Initial weather
  // ─────────────────────────────────────────
  useEffect(() => {
    load(defaultCity);
  }, []);
  // ─────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────

  const handleSearch = (event) => {
    event.preventDefault();

    const searchCity = input.trim();

    if (searchCity) {
      load(searchCity);
    }
  };

  const theme = data
    ? getTheme(data.condition)
    : {
        emoji: '🌿',
        bg: 'from-forest-500 to-forest-700',
      };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-forest-100 shadow-sm">

      {/* ─────────────────────────────────────
          Hero weather banner
      ───────────────────────────────────── */}

      <div
        className={`bg-gradient-to-br ${theme.bg} p-5 relative overflow-hidden`}
      >
        {/* Decorative circles */}

        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />

        <div className="absolute top-8 -right-2 w-14 h-14 bg-white/10 rounded-full" />

        {/* Search */}

        <form
          onSubmit={handleSearch}
          className="flex gap-2 mb-4 relative z-10"
        >
          <div className="flex-1 flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-2">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="w-3.5 h-3.5 text-white/70 flex-shrink-0"
            >
              <path
                d="M9.5 3a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM2 9.5a7.5 7.5 0 1113.307 4.747l3.473 3.473a.75.75 0 01-1.06 1.06l-3.473-3.473A7.5 7.5 0 012 9.5z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="शहर शोधा…"
              className="flex-1 bg-transparent text-white placeholder-white/60 text-sm font-sans outline-none min-w-0"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl px-3 py-2 text-sm font-sans font-medium transition-all active:scale-95"
          >
            {loading ? '…' : 'जा'}
          </button>
        </form>

        {/* Loading */}

        {loading && !data && (
          <div className="space-y-3">
            <Skel width="w-32" height="h-5" />
            <Skel width="w-16" height="h-10" />
            <Skel width="w-24" height="h-3" />
          </div>
        )}

        {/* Error */}

        {error && !loading && (
          <div className="bg-white/20 rounded-xl p-3 text-white text-sm font-sans">
            {error}
          </div>
        )}

        {/* Weather data */}

        {data && !loading && (
          <>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-white/80 text-sm font-sans">
                  {data.city}, {data.country}
                </p>

                <div className="flex items-end gap-2 mt-1">
                  <span className="font-display text-5xl font-bold text-white">
                    {data.temp}°
                  </span>

                  <span className="text-white/70 text-sm font-sans mb-2">
                    वाटते {data.feels_like}°C
                  </span>
                </div>

                <p className="text-white/90 font-sans font-medium">
                  {getTheme(data.condition).marathi}
                </p>
              </div>

              <span
                className="text-5xl"
                aria-hidden="true"
              >
                {theme.emoji}
              </span>
            </div>

            {/* Stats */}

            <div className="grid grid-cols-3 gap-2 mt-4">
              <StatPill
                icon="💧"
                label="आर्द्रता"
                value={`${data.humidity}%`}
              />

              <StatPill
                icon="💨"
                label="वारा"
                value={`${data.wind_speed} km/h`}
              />

              <StatPill
                icon="👁️"
                label="दृश्यता"
                value={`${data.visibility} km`}
              />
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────
          Forecast
      ───────────────────────────────────── */}

      {data?.forecast?.length > 0 && (
        <div className="bg-white px-4 py-3 border-b border-forest-100">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2">
            ५-दिवसांचा अंदाज
          </p>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {data.forecast.map((forecast, index) => {
              const forecastTheme = getTheme(
                forecast.condition
              );

              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1 min-w-[58px] bg-forest-50 rounded-xl py-2 px-1"
                >
                  <span className="text-[11px] font-sans font-semibold text-gray-500">
                    {forecast.day}
                  </span>

                  <span className="text-base">
                    {forecastTheme.emoji}
                  </span>

                  <span className="text-xs font-sans font-bold text-forest-800">
                    {forecast.high}°
                  </span>

                  <span className="text-[10px] font-sans text-gray-400">
                    {forecast.low}°
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          Sun + pressure
      ───────────────────────────────────── */}

      {data && (
        <div className="bg-white px-4 py-3 border-b border-forest-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              {
                icon: '🌅',
                label: 'सूर्योदय',
                value: data.sunrise,
              },
              {
                icon: '🌇',
                label: 'सूर्यास्त',
                value: data.sunset,
              },
              {
                icon: '🧭',
                label: 'दाब',
                value: `${data.pressure} hPa`,
              },
            ].map(({ icon, label, value }) => (
              <div key={label}>
                <p
                  className="text-sm"
                  aria-hidden="true"
                >
                  {icon}
                </p>

                <p className="text-[10px] font-sans text-gray-400 uppercase tracking-wide">
                  {label}
                </p>

                <p className="text-xs font-sans font-semibold text-gray-700">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          Farmer advice
      ───────────────────────────────────── */}

      {data?.agro_tip && (
        <div className="bg-forest-50 px-4 py-3 flex items-start gap-2.5">
          <span
            className="text-base mt-0.5 flex-shrink-0"
            aria-hidden="true"
          >
            🌱
          </span>

          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-forest-600 mb-0.5">
              शेतकरी सल्ला
            </p>

            <p className="text-xs font-sans text-forest-800 leading-relaxed">
              {data.agro_tip}
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          Demo mode
      ───────────────────────────────────── */}

      {!process.env.REACT_APP_WEATHER_API_KEY && (
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-2 flex items-center gap-2">
          <span
            className="text-amber-500 text-xs"
            aria-hidden="true"
          >
            ℹ️
          </span>

          <p className="text-[11px] font-sans text-amber-700">
            डेमो मोड — लाइव डेटासाठी{' '}
            <code className="font-mono bg-amber-100 px-1 rounded">
              REACT_APP_WEATHER_API_KEY
            </code>{' '}
            सेट करा.
          </p>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
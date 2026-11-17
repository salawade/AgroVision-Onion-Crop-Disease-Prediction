
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import tensorflow as tf
import json
import os

from urllib.request import urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from datetime import datetime
from zoneinfo import ZoneInfo

from database import Base, engine
from routes.predict import router as predict_router
from routes.chat import router as chat_router
from routes.auth import router as auth_router
from routes.profile import router as profile_router


# ── Create FastAPI Application ─────────────────────────────────────

app = FastAPI(
    title="AgroVision API",
    version="2.0",
    description="AI-powered onion disease detection and monitoring system"
)

Base.metadata.create_all(bind=engine)


# ── CORS Configuration ─────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://agrovision-frontend-ashen.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Base Directory ─────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ── Load AI Disease Prediction Model ────────────────────────────────

model_path = os.path.join(
    BASE_DIR,
    "model",
    "onion_mobilenet_model.h5"
)

model = tf.keras.models.load_model(model_path)


# ── Load Disease Class Names ────────────────────────────────────────

classes_path = os.path.join(
    BASE_DIR,
    "model",
    "classes.json"
)

with open(classes_path, "r", encoding="utf-8") as f:
    class_names = json.load(f)


# ── Attach Model to Application State ──────────────────────────────

app.state.model = model
app.state.class_names = class_names


# ── Include Existing Project Routes ────────────────────────────────

app.include_router(predict_router)
app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(profile_router)


# ── Health Check Endpoint ───────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():

    return {
        "status": "healthy",
        "service": "AgroVision Backend",
        "model_loaded": app.state.model is not None,
        "classes_loaded": app.state.class_names is not None
    }


# ── Live Weather Endpoint ──────────────────────────────────────────

@app.get("/weather", tags=["Weather"])
def get_weather(city: str = "Solapur"):

    # Get private API key from Render environment variables
    api_key = os.getenv("WEATHER_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Weather API key is not configured on the backend."
        )

    base_url = "https://api.openweathermap.org/data/2.5"
    india_tz = ZoneInfo("Asia/Kolkata")

    # Fetch data from OpenWeatherMap
    def fetch_weather_data(endpoint):

        params = urlencode({
            "q": city,
            "appid": api_key,
            "units": "metric"
        })

        url = f"{base_url}/{endpoint}?{params}"

        try:
            with urlopen(url, timeout=15) as response:
                return json.loads(
                    response.read().decode("utf-8")
                )

        except HTTPError as error:

            if error.code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="City not found."
                )

            if error.code == 401:
                raise HTTPException(
                    status_code=502,
                    detail="Weather API key is invalid or not active."
                )

            raise HTTPException(
                status_code=502,
                detail="Weather provider request failed."
            )

        except URLError:
            raise HTTPException(
                status_code=503,
                detail="Unable to connect to weather provider."
            )

    # Get current weather and forecast
    current = fetch_weather_data("weather")
    forecast_data = fetch_weather_data("forecast")

    weather_info = current["weather"][0]
    main_info = current["main"]

    # ── Prepare Five-Day Forecast ───────────────────────────────────

    daily = {}

    for item in forecast_data.get("list", []):

        local_time = datetime.fromtimestamp(
            item["dt"],
            india_tz
        )

        date_key = local_time.strftime("%Y-%m-%d")

        if date_key not in daily:

            daily[date_key] = {
                "day": local_time.strftime("%a"),
                "hour": local_time.hour,
                "high": item["main"]["temp_max"],
                "low": item["main"]["temp_min"],
                "icon": item["weather"][0]["icon"]
            }

        else:

            daily[date_key]["high"] = max(
                daily[date_key]["high"],
                item["main"]["temp_max"]
            )

            daily[date_key]["low"] = min(
                daily[date_key]["low"],
                item["main"]["temp_min"]
            )

            # Select forecast icon closest to 12 PM
            if abs(local_time.hour - 12) < abs(
                daily[date_key]["hour"] - 12
            ):

                daily[date_key]["hour"] = local_time.hour

                daily[date_key]["icon"] = item["weather"][0]["icon"]

    forecast = []

    for date_key in sorted(daily.keys())[:5]:

        day_data = daily[date_key]

        forecast.append({
            "day": day_data["day"],
            "high": round(day_data["high"]),
            "low": round(day_data["low"]),
            "icon": day_data["icon"]
        })

    # ── Return Weather Information ──────────────────────────────────

    return {
        "city": current["name"],
        "country": current["sys"]["country"],

        "temp": round(main_info["temp"]),
        "feels_like": round(main_info["feels_like"]),

        "condition": weather_info["main"],
        "description": weather_info["description"],
        "icon": weather_info["icon"],

        "humidity": main_info["humidity"],
        "wind_speed": round(current["wind"]["speed"] * 3.6),

        "visibility": round(
            current.get("visibility", 10000) / 1000
        ),

        "pressure": main_info["pressure"],

        "sunrise": datetime.fromtimestamp(
            current["sys"]["sunrise"],
            india_tz
        ).strftime("%H:%M"),

        "sunset": datetime.fromtimestamp(
            current["sys"]["sunset"],
            india_tz
        ).strftime("%H:%M"),

        "forecast": forecast
    }


# ── Root Endpoint ──────────────────────────────────────────────────

@app.get("/", tags=["Info"])
async def root():

    return {
        "name": "AgroVision API",
        "version": "2.0",
        "description": "AI-powered onion disease detection for Indian farmers",

        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "weather": "/weather?city=Solapur",
            "predict": "/predict/",
            "chat": "/chat/"
        }
    }


# ── Startup Event ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():

    print("[AgroVision] Backend started")

    print(
        f"[AgroVision] Model loaded: "
        f"{app.state.model is not None}"
    )

    print(
        f"[AgroVision] Classes loaded: "
        f"{len(app.state.class_names) if app.state.class_names else 0}"
    )

    print(
        f"[AgroVision] Weather API configured: "
        f"{bool(os.getenv('WEATHER_API_KEY'))}"
    )


# ── Shutdown Event ─────────────────────────────────────────────────

@app.on_event("shutdown")
async def shutdown_event():

    print("[AgroVision] Backend shutting down")


# ── Entry Point ────────────────────────────────────────────────────

if __name__ == "__main__":

    import uvicorn

    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )

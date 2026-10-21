from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Form
from PIL import Image
import numpy as np
import io
import json
import os

from database import SessionLocal, ScanHistory
from utils.preprocess import preprocess_image
from utils.image_quality import check_image_quality
from utils.severity import calculate_severity

router = APIRouter()

# Get base directory (backend folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load Marathi disease information
DISEASE_MARATHI_PATH = os.path.join(BASE_DIR, "model", "disease_marathi.json")
disease_marathi_data = {}


def load_disease_marathi():
    """Load Marathi disease data from JSON file"""
    global disease_marathi_data

    try:
        if os.path.exists(DISEASE_MARATHI_PATH):
            with open(DISEASE_MARATHI_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                disease_marathi_data = data.get("diseases", {})
                print(f"Loaded {len(disease_marathi_data)} Marathi disease translations")
        else:
            print(f"[Warning] Disease Marathi file not found at: {DISEASE_MARATHI_PATH}")

    except Exception as e:
        print(f"Error loading disease_marathi.json: {str(e)}")


# Load disease data on startup
load_disease_marathi()


@router.post("/predict/")
async def predict(
    request: Request,
    file: UploadFile = File(...),
    farmer_id: int = Form(None)
):

    # --------------------------------------------------
    # Validate file type
    # --------------------------------------------------

    if file.content_type not in ["image/jpeg", "image/jpg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG and PNG images are allowed."
        )

    try:

        # --------------------------------------------------
        # Read uploaded image
        # --------------------------------------------------

        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        # --------------------------------------------------
        # Image Quality Validation (Module 3)
        # --------------------------------------------------

        quality = check_image_quality(image)

        if not quality["valid"]:
            raise HTTPException(
                status_code=400,
                detail=quality["message"]
            )

        # --------------------------------------------------
        # Image Preprocessing (Module 4)
        # --------------------------------------------------

        processed = preprocess_image(image)
        severity_result = calculate_severity(image)

        infection_percentage = severity_result["infection_percentage"]

        severity = severity_result["severity"]

        # --------------------------------------------------
        # Disease Severity Estimation (Module 6)
        # --------------------------------------------------

        severity_result = calculate_severity(image)

        infection_percentage = severity_result["infection_percentage"]

        severity_level = severity_result["severity"]

        # --------------------------------------------------
        # Disease Detection (Module 5)
        # --------------------------------------------------

        model = request.app.state.model

        class_names = request.app.state.class_names

        predictions = model.predict(processed)

        predicted_index = np.argmax(predictions[0])

        confidence = float(np.max(predictions[0]))

        predicted_class = class_names[predicted_index]
        
        print("PREDICTED CLASS:", predicted_class)

        # --------------------------------------------------
        # Disease Information
        # --------------------------------------------------

        disease_info = disease_marathi_data.get(
            predicted_class,
            {}
        )

        marathi_disease = disease_info.get(
            "marathi_name",
            predicted_class
        )

        treatment = disease_info.get(
            "treatment",
            "Treatment information not available."
        )

        symptoms = disease_info.get(
            "symptoms",
            "Symptoms information not available."
        )

        prevention = disease_info.get(
            "prevention",
            "Prevention information not available."
        )

        status = disease_info.get(
            "status",
            "Unknown"
        )

        # --------------------------------------------------
        # Response
        # --------------------------------------------------
        # -----------------------------
# Save Scan History
# -----------------------------

        db = SessionLocal()

        try:

            if farmer_id is not None:

                history = ScanHistory(

                    farmer_id=farmer_id,

                    filename=file.filename,

                    preview=None,

                    disease=predicted_class,

                    marathi_disease=marathi_disease,

                    confidence=round(confidence,3),

                    severity=severity,

                    infection_percentage=infection_percentage,

                    symptoms=symptoms,

                    treatment=treatment,

                    prevention=prevention,

                    status=status

                )

                db.add(history)

                db.commit()

                db.refresh(history)

        finally:

            db.close()
        return {

            "disease": predicted_class,

            "marathi_disease": marathi_disease,

            "confidence": round(confidence, 3),

            "status": status,

            "severity": severity_level,

            "infection_percentage": infection_percentage,

            "leaf_pixels": severity_result["leaf_pixels"],

            "disease_pixels": severity_result["disease_pixels"],

            "symptoms": symptoms,

            "treatment": treatment,

            "prevention": prevention

        }

    except HTTPException:
        raise

    except Exception as e:

        print(f"Prediction Error: {str(e)}")

        raise HTTPException(

            status_code=500,

            detail=f"Error processing image: {str(e)}"

        )
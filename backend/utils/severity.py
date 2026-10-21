import cv2
import numpy as np
from PIL import Image


def calculate_severity(image: Image.Image):
    """
    Calculate infection percentage using HSV segmentation.
    Returns:
        infection_percentage
        severity
        leaf_pixels
        disease_pixels
    """

    img = np.array(image).astype(np.uint8)

    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)

    else:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    img = cv2.resize(img, (512, 512))

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    lower_green = np.array([25, 40, 40])
    upper_green = np.array([95, 255, 255])

    leaf_mask = cv2.inRange(
        hsv,
        lower_green,
        upper_green
    )

    lower_disease = np.array([5, 40, 40])
    upper_disease = np.array([35, 255, 255])

    disease_mask = cv2.inRange(
        hsv,
        lower_disease,
        upper_disease
    )

    leaf_pixels = cv2.countNonZero(leaf_mask)

    disease_pixels = cv2.countNonZero(disease_mask)

    if leaf_pixels == 0:
        infection = 0

    else:
        infection = (disease_pixels / leaf_pixels) * 100

    infection = round(float(infection), 2)

    if infection < 20:
        severity = "Mild"

    elif infection < 50:
        severity = "Moderate"

    else:
        severity = "Severe"

    return {

        "infection_percentage": infection,

        "severity": severity,

        "leaf_pixels": int(leaf_pixels),

        "disease_pixels": int(disease_pixels)

    }


def estimate_severity(confidence):
    """
    Fallback severity estimation from model confidence.
    Used when image segmentation cannot be applied.
    """

    if confidence >= 0.90:
        return "Severe"

    elif confidence >= 0.70:
        return "Moderate"

    return "Mild"
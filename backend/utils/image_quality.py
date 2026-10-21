import cv2
import numpy as np
from PIL import Image


def check_image_quality(image: Image.Image):
    """
    Validate uploaded image quality.

    Returns:
        {
            "valid": True/False,
            "message": "Reason"
        }
    """

    img = np.array(image)

    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    height, width = img.shape[:2]

    # -----------------------------
    # Resolution Check
    # -----------------------------

    if width < 300 or height < 300:
        return {
            "valid": False,
            "message": "Image resolution is too low. Minimum size should be 300x300 pixels."
        }

    # -----------------------------
    # Blur Detection
    # -----------------------------

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    if blur_score < 100:
        return {
            "valid": False,
            "message": "Image is blurry. Please upload a clearer image."
        }

    # -----------------------------
    # Brightness Check
    # -----------------------------

    brightness = np.mean(gray)

    if brightness < 45:
        return {
            "valid": False,
            "message": "Image is too dark."
        }

    if brightness > 220:
        return {
            "valid": False,
            "message": "Image is too bright."
        }

    return {
        "valid": True,
        "message": "Image quality is good."
    }
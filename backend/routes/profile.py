from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Farmer, ScanHistory, get_db

router = APIRouter(tags=["Profile"])


class UpdateProfile(BaseModel):
    username: str
    email: str
    village: str = ""
    mobile: str = ""


@router.get("/profile/{farmer_id}")
def get_profile(farmer_id: int, db: Session = Depends(get_db)):

    farmer = db.query(Farmer).filter(
        Farmer.id == farmer_id
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    total_scans = db.query(ScanHistory).filter(
        ScanHistory.farmer_id == farmer.id
    ).count()

    return {
        "id": farmer.id,
        "username": farmer.username,
        "email": farmer.email,
        "mobile": farmer.mobile,
        "village": farmer.village,
        "profile_image": farmer.profile_image,
        "joined": farmer.created_at,
        "total_scans": total_scans
    }


@router.put("/profile/{farmer_id}")
def update_profile(
    farmer_id: int,
    data: UpdateProfile,
    db: Session = Depends(get_db)
):

    farmer = db.query(Farmer).filter(
        Farmer.id == farmer_id
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    farmer.username = data.username
    farmer.email = data.email
    farmer.mobile = data.mobile
    farmer.village = data.village

    db.commit()

    return {
        "message": "Profile Updated Successfully"
    }
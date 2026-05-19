from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from models import Case, LoginRequest, SMSReport
from ai_engine import (
    detect_anomaly,
    get_hotspots,
    get_trend,
    get_district_risk,
    predict_outbreak,
)
from uganda_data import UGANDA_DISTRICTS, REGIONS, UGANDA_GEOJSON
from auth import (
    users_db,
    verify_password,
    create_access_token,
    get_current_user,
    hash_password,
    ROLES,
)
from datetime import datetime
from collections import defaultdict
import random

app = FastAPI(title="NEEWRS - National Epidemic Early Warning & Response System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

cases_db = []
next_id = 1
sms_log = []


@app.get("/")
def home():
    return {
        "message": "NEEWRS - National Epidemic Early Warning & Response System",
        "version": "1.0.0",
        "total_cases": len(cases_db),
        "status": "operational",
    }


# ─── AUTH ────────────────────────────────────────────────────────────

@app.post("/auth/login")
def login(req: LoginRequest):
    user = users_db.get(req.username)
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": user["username"],
        "role": user["role"],
        "name": user["name"],
        "district": user["district"],
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "role": user["role"],
            "name": user["name"],
            "district": user["district"],
        },
    }


@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


# ─── CASE REPORTING ──────────────────────────────────────────────────

@app.post("/report-case")
def report_case(
    case: Case,
    current_user: dict = Depends(get_current_user),
):
    global next_id

    risk = detect_anomaly(cases_db + [case.dict()])

    entry = case.dict()
    entry["id"] = next_id
    entry["risk_level"] = risk
    entry["reported_at"] = datetime.utcnow().isoformat()
    entry["reported_by"] = current_user.get("name", "anonymous")
    cases_db.append(entry)
    next_id += 1

    return {
        "status": "received",
        "case_id": entry["id"],
        "total_cases": len(cases_db),
        "risk_level": risk,
    }


@app.post("/report-case/public")
def report_case_public(case: Case):
    global next_id

    risk = detect_anomaly(cases_db + [case.dict()])

    entry = case.dict()
    entry["id"] = next_id
    entry["risk_level"] = risk
    entry["reported_at"] = datetime.utcnow().isoformat()
    entry["reported_by"] = case.reported_by or "public"
    cases_db.append(entry)
    next_id += 1

    return {
        "status": "received",
        "case_id": entry["id"],
        "total_cases": len(cases_db),
        "risk_level": risk,
    }


@app.get("/cases")
def get_cases(current_user: dict = Depends(get_current_user)):
    return cases_db


@app.get("/my-cases")
def get_my_cases(current_user: dict = Depends(get_current_user)):
    name = current_user.get("name", "")
    return [c for c in cases_db if c.get("reported_by") == name]


# ─── DASHBOARD DATA ─────────────────────────────────────────────────

@app.get("/hotspots")
def hotspots(current_user: dict = Depends(get_current_user)):
    return get_hotspots(cases_db)


@app.get("/trend")
def trend(current_user: dict = Depends(get_current_user)):
    return get_trend(cases_db)


@app.get("/stats")
def stats(current_user: dict = Depends(get_current_user)):
    if not cases_db:
        return {"total": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0}
    levels = [c["risk_level"] for c in cases_db]
    return {
        "total": len(cases_db),
        "high_risk": levels.count("HIGH_RISK"),
        "medium_risk": levels.count("MEDIUM_RISK"),
        "low_risk": levels.count("LOW"),
    }


# ─── UGANDA DISTRICT DATA ────────────────────────────────────────────

@app.get("/uganda/districts")
def get_districts(current_user: dict = Depends(get_current_user)):
    return UGANDA_DISTRICTS


@app.get("/uganda/regions")
def get_regions(current_user: dict = Depends(get_current_user)):
    return REGIONS


@app.get("/uganda/geojson")
def get_geojson(current_user: dict = Depends(get_current_user)):
    return UGANDA_GEOJSON


@app.get("/uganda/district-cases")
def district_cases(current_user: dict = Depends(get_current_user)):
    return get_district_risk(cases_db, UGANDA_DISTRICTS)


@app.get("/uganda/region-stats")
def region_stats(current_user: dict = Depends(get_current_user)):
    dr = get_district_risk(cases_db, UGANDA_DISTRICTS)
    region_data = defaultdict(lambda: {"total": 0, "high": 0, "medium": 0, "low": 0, "districts": []})

    for d in dr:
        name = d["district"]
        region = None
        for r_name, districts in REGIONS.items():
            if name in districts or any(name.lower() in dist.lower() for dist in districts):
                region = r_name
                break
        if not region:
            dist_info = UGANDA_DISTRICTS.get(name, {})
            region = dist_info.get("region", "Unknown")

        region_data[region]["total"] += d["total_cases"]
        region_data[region]["high"] += d["high_risk"]
        region_data[region]["medium"] += d["medium_risk"]
        region_data[region]["low"] += d["low_risk"]
        region_data[region]["districts"].append(name)

    return dict(region_data)


# ─── AI / INTELLIGENCE ───────────────────────────────────────────────

@app.get("/ai/predict-outbreak")
def outbreak_prediction(current_user: dict = Depends(get_current_user)):
    return predict_outbreak(cases_db)


@app.get("/ai/district-risk")
def district_risk_analysis(current_user: dict = Depends(get_current_user)):
    dr = get_district_risk(cases_db, UGANDA_DISTRICTS)
    sorted_dr = sorted(dr, key=lambda x: x["risk_score"], reverse=True)
    return {
        "districts": sorted_dr,
        "hotspot_count": sum(1 for d in sorted_dr if d["risk_level"] == "HIGH_RISK"),
        "total_districts_affected": len(dr),
    }


@app.get("/ai/overview")
def ai_overview(current_user: dict = Depends(get_current_user)):
    return {
        "outbreak": predict_outbreak(cases_db),
        "district_risk": get_district_risk(cases_db, UGANDA_DISTRICTS),
        "stats": {
            "total_cases": len(cases_db),
            "active_hotspots": len(get_hotspots(cases_db)),
            "ml_model": "Isolation Forest + Logistic Regression",
            "model_trained": len(cases_db) >= 10,
        },
    }


# ─── SMS SIMULATION ──────────────────────────────────────────────────

@app.post("/sms/receive")
def receive_sms(report: SMSReport):
    global next_id

    message_lower = report.message.lower()
    symptoms = []
    temp = 36.5

    symptom_keywords = {
        "fever": 38.5, "hot": 38.0, "high temperature": 38.5,
        "cough": 36.5, "headache": 36.5, "vomiting": 36.5,
        "diarrhea": 36.5, "rash": 36.5, "bleeding": 37.0,
        "difficulty breathing": 37.5, "chest pain": 37.0,
    }

    for kw, kw_temp in symptom_keywords.items():
        if kw in message_lower:
            symptoms.append(kw)
            if kw_temp > temp:
                temp = kw_temp

    if not symptoms:
        symptoms.append("general-illness")

    loc = report.location or "Unknown"

    risk = detect_anomaly(cases_db + [{
        "location": loc,
        "symptoms": symptoms,
        "temperature": temp,
        "lat": None,
        "lng": None,
    }])

    entry = {
        "id": next_id,
        "location": loc,
        "symptoms": symptoms,
        "temperature": temp,
        "risk_level": risk,
        "reported_at": datetime.utcnow().isoformat(),
        "reported_by": f"SMS:{report.sender}",
        "source": "sms",
        "lat": None,
        "lng": None,
        "raw_message": report.message,
    }
    cases_db.append(entry)
    next_id += 1

    sms_log.append({
        "sender": report.sender,
        "message": report.message,
        "location": loc,
        "processed_at": datetime.utcnow().isoformat(),
        "risk_level": risk,
    })

    return {
        "status": "processed",
        "case_id": entry["id"],
        "risk_level": risk,
        "detected_symptoms": symptoms,
        "estimated_temperature": temp,
    }


@app.get("/sms/log")
def sms_log_endpoint(current_user: dict = Depends(get_current_user)):
    return sms_log


# ─── SIMULATE OUTBREAK ──────────────────────────────────────────────

@app.post("/simulate/outbreak")
def simulate_outbreak(
    district: str = Query("Kampala"),
    count: int = Query(10),
    current_user: dict = Depends(get_current_user),
):
    global next_id
    dist = UGANDA_DISTRICTS.get(district)
    if not dist:
        raise HTTPException(status_code=404, detail="District not found")

    created = []
    symptom_pool = [
        ["fever", "cough", "fatigue"],
        ["fever", "headache", "body aches"],
        ["fever", "cough", "difficulty breathing"],
        ["cough", "sore throat"],
        ["fever", "vomiting", "diarrhea"],
        ["headache", "body aches"],
    ]

    for _ in range(count):
        symptoms = random.choice(symptom_pool)
        temp = round(random.uniform(37.5, 41.0), 1)
        lat = dist["lat"] + random.uniform(-0.05, 0.05)
        lng = dist["lng"] + random.uniform(-0.05, 0.05)

        risk = detect_anomaly(cases_db + [{
            "location": district,
            "symptoms": symptoms,
            "temperature": temp,
            "lat": lat,
            "lng": lng,
        }])

        entry = {
            "id": next_id,
            "location": district,
            "symptoms": symptoms,
            "temperature": temp,
            "lat": lat,
            "lng": lng,
            "risk_level": risk,
            "reported_at": datetime.utcnow().isoformat(),
            "reported_by": "system:outbreak-simulation",
            "source": "simulation",
        }
        cases_db.append(entry)
        next_id += 1
        created.append(entry["id"])

    return {
        "status": "simulation_complete",
        "district": district,
        "cases_created": count,
        "case_ids": created,
        "total_cases": len(cases_db),
    }


# ─── ADMIN ───────────────────────────────────────────────────────────

@app.post("/admin/reset")
def reset_data(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "ministry":
        raise HTTPException(status_code=403, detail="Only ministry can reset data")
    global cases_db, next_id, sms_log
    cases_db = []
    sms_log = []
    next_id = 1
    return {"status": "reset", "message": "All case data cleared"}

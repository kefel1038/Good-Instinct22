import numpy as np
from collections import Counter, defaultdict
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression


_anomaly_model = None
_risk_model = None
_model_trained = False


def _train_models(cases: list[dict]):
    global _anomaly_model, _risk_model, _model_trained

    if len(cases) < 10:
        return

    X = []
    y = []
    for c in cases:
        fever = 1 if c["temperature"] >= 38 else 0
        has_fever_symptom = 1 if "fever" in c["symptoms"] else 0
        cough = 1 if "cough" in c["symptoms"] else 0
        breathing = 1 if "difficulty breathing" in c["symptoms"] or "shortness of breath" in c["symptoms"] else 0
        symptom_count = len(c["symptoms"])
        X.append([c["temperature"], fever, has_fever_symptom, cough, breathing, symptom_count])

        risk = c.get("risk_level", "LOW")
        y.append(0 if risk == "LOW" else (1 if risk == "MEDIUM_RISK" else 2))

    X = np.array(X)
    y = np.array(y)

    _anomaly_model = IsolationForest(contamination=0.2, random_state=42)
    _anomaly_model.fit(X)

    if len(set(y)) >= 2:
        _risk_model = LogisticRegression(multi_class="auto", max_iter=1000, random_state=42)
        _risk_model.fit(X, y)

    _model_trained = True


def detect_anomaly(cases: list[dict]) -> str:
    if len(cases) < 5:
        return "LOW"

    _train_models(cases)
    last = cases[-1]

    fever = 1 if last["temperature"] >= 38 else 0
    has_fever_symptom = 1 if "fever" in last["symptoms"] else 0
    cough = 1 if "cough" in last["symptoms"] else 0
    breathing = 1 if "difficulty breathing" in last["symptoms"] or "shortness of breath" in last["symptoms"] else 0
    symptom_count = len(last["symptoms"])

    features = np.array([[last["temperature"], fever, has_fever_symptom, cough, breathing, symptom_count]])

    if _anomaly_model is not None:
        anomaly_score = _anomaly_model.score_samples(features)[0]
        anomaly_pred = _anomaly_model.predict(features)[0]

        if anomaly_pred == -1:
            if _risk_model is not None:
                risk_pred = _risk_model.predict(features)[0]
                if risk_pred == 2:
                    return "HIGH_RISK"
                elif risk_pred == 1:
                    return "MEDIUM_RISK"

    fever_cases = sum(1 for c in cases if c["temperature"] >= 38 or "fever" in c["symptoms"])
    cough_cases = sum(1 for c in cases if "cough" in c["symptoms"])
    ratio = fever_cases / len(cases)
    cough_ratio = cough_cases / len(cases)

    if ratio > 0.6 or (ratio > 0.4 and cough_ratio > 0.3):
        return "HIGH_RISK"
    elif ratio > 0.3 or cough_ratio > 0.4:
        return "MEDIUM_RISK"
    else:
        return "LOW"


def get_hotspots(cases: list[dict]) -> list[dict]:
    locations = Counter()
    for c in cases:
        key = (c.get("lat"), c.get("lng"), c["location"])
        if key[0] is not None:
            locations[key] += 1

    hotspots = []
    for (lat, lng, name), count in locations.most_common():
        hotspots.append({
            "lat": lat,
            "lng": lng,
            "location": name,
            "case_count": count,
            "intensity": min(count / max(1, len(cases)) * 100, 100),
        })
    return hotspots


def get_trend(cases: list[dict]) -> dict:
    if not cases:
        return {"daily": [], "total": 0}

    daily = defaultdict(int)
    for c in cases:
        day = c.get("reported_at", "")[:10]
        if day:
            daily[day] += 1

    sorted_days = sorted(daily.keys())
    return {
        "daily": [{"date": d, "count": daily[d]} for d in sorted_days],
        "total": len(cases),
    }


def get_district_risk(cases: list[dict], districts: dict) -> list[dict]:
    district_cases = defaultdict(list)
    for c in cases:
        loc = c["location"]
        for dist_name, dist_data in districts.items():
            if loc.lower() == dist_name.lower() or loc.lower() in dist_name.lower():
                district_cases[dist_name].append(c)
                break
        else:
            district_cases[loc].append(c)

    result = []
    for name, dc in district_cases.items():
        levels = [c["risk_level"] for c in dc]
        high = levels.count("HIGH_RISK")
        medium = levels.count("MEDIUM_RISK")
        low = levels.count("LOW")
        total = len(dc)
        score = (high * 3 + medium * 2 + low * 1) / max(total, 1)
        result.append({
            "district": name,
            "total_cases": total,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
            "risk_score": round(score, 2),
            "risk_level": "HIGH_RISK" if score > 2 else "MEDIUM_RISK" if score > 1.5 else "LOW",
        })

    return result


def predict_outbreak(cases: list[dict]) -> dict:
    if len(cases) < 3:
        return {"outbreak_predicted": False, "confidence": 0, "message": "Insufficient data"}

    daily = defaultdict(int)
    for c in cases:
        day = c.get("reported_at", "")[:10]
        if day:
            daily[day] += 1

    if len(daily) < 3:
        return {"outbreak_predicted": False, "confidence": 0, "message": "Insufficient days"}

    counts = [daily[d] for d in sorted(daily.keys())]
    recent = counts[-3:]
    avg = np.mean(counts[:-3]) if len(counts) > 3 else 1
    recent_avg = np.mean(recent)

    if avg == 0:
        avg = 0.5

    ratio = recent_avg / avg
    confidence = min((ratio - 1) / 2, 1.0) if ratio > 1 else 0

    return {
        "outbreak_predicted": ratio > 1.5,
        "confidence": round(confidence * 100, 1),
        "recent_daily_avg": round(recent_avg, 1),
        "baseline_avg": round(avg, 1),
        "surge_ratio": round(ratio, 2),
        "message": "Outbreak likely" if ratio > 1.5 else "Normal pattern",
    }

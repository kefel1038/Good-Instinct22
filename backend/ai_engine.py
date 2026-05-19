import math
import statistics
from collections import Counter, defaultdict


def _compute_z_score(value, mean, std):
    if std == 0:
        return 0
    return (value - mean) / std


def _anomaly_score(features, history):
    if len(history) < 5:
        return 0, False

    scores = []
    for i in range(len(features)):
        col = [row[i] for row in history]
        mean = statistics.mean(col)
        std = statistics.stdev(col) if len(col) > 1 else 0
        z = abs(_compute_z_score(features[i], mean, std))
        scores.append(z)

    max_z = max(scores) if scores else 0
    return max_z, max_z > 2.5


def _risk_score(features):
    temp, fever, has_fever, cough, breathing, symptom_count = features
    score = 0

    if temp >= 40:
        score += 4
    elif temp >= 39:
        score += 3
    elif temp >= 38:
        score += 2
    elif temp >= 37.5:
        score += 1

    if has_fever or fever:
        score += 2
    if cough:
        score += 1
    if breathing:
        score += 3
    score += symptom_count * 0.5

    return score


def detect_anomaly(cases: list[dict]) -> str:
    if len(cases) < 5:
        return "LOW"

    history = []
    for c in cases[:-1]:
        history.append([
            c["temperature"],
            1 if c["temperature"] >= 38 else 0,
            1 if "fever" in c["symptoms"] else 0,
            1 if "cough" in c["symptoms"] else 0,
            1 if "difficulty breathing" in c["symptoms"] or "shortness of breath" in c["symptoms"] else 0,
            len(c["symptoms"]),
        ])

    last = cases[-1]
    features = [
        last["temperature"],
        1 if last["temperature"] >= 38 else 0,
        1 if "fever" in last["symptoms"] else 0,
        1 if "cough" in last["symptoms"] else 0,
        1 if "difficulty breathing" in last["symptoms"] or "shortness of breath" in last["symptoms"] else 0,
        len(last["symptoms"]),
    ]

    z, is_anomaly = _anomaly_score(features, history)
    score = _risk_score(features)

    if is_anomaly and score >= 6:
        return "HIGH_RISK"
    if is_anomaly or score >= 5:
        return "MEDIUM_RISK"
    if score >= 3:
        return "MEDIUM_RISK"

    fever_ratio = sum(
        1 for c in cases
        if c["temperature"] >= 38 or "fever" in c["symptoms"]
    ) / len(cases)
    cough_ratio = sum(
        1 for c in cases if "cough" in c["symptoms"]
    ) / len(cases)

    if fever_ratio > 0.6 or (fever_ratio > 0.4 and cough_ratio > 0.3):
        return "HIGH_RISK"
    if fever_ratio > 0.3 or cough_ratio > 0.4:
        return "MEDIUM_RISK"

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
        matched = False
        for dist_name in districts:
            if loc.lower() == dist_name.lower() or loc.lower() in dist_name.lower():
                district_cases[dist_name].append(c)
                matched = True
                break
        if not matched:
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
    avg = statistics.mean(counts[:-3]) if len(counts) > 3 else 1
    recent_avg = statistics.mean(recent)

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

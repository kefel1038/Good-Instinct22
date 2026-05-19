# NEEWRS — National Epidemic Early Warning & Response System

## Submission for Government Innovation Call (gdr.go.ug)

---

### What It Is

NEEWRS is an AI-powered, multi-stakeholder epidemic surveillance and response platform designed for Uganda's Ministry of Health. It integrates real-time disease case reporting, AI-driven outbreak detection, geographic hotspot mapping, and automated alerting into a single unified dashboard.

---

### Why It Matters

Uganda faces recurrent epidemics — Ebola, cholera, malaria, and emerging respiratory threats. Current systems are fragmented: surveillance data lives in spreadsheets, reporting is paper-based, and outbreak detection is reactive rather than predictive.

**NEEWRS solves this** by creating a single platform where:

- Field health workers submit cases via SMS or mobile
- AI detects anomalies and predicts outbreaks before they spread
- District officers see real-time risk maps
- Ministry officials get nationwide intelligence
- Hospitals receive early warnings for resource planning

---

### System Architecture

```
┌─────────────────────────────────────────────┐
│           React Dashboard (PWA)              │
│  Ministry · District · Hospital · Field      │
├─────────────────────────────────────────────┤
│           FastAPI Backend (REST API)          │
├──────────┬──────────┬──────────┬────────────┤
│  Auth &  │  Case    │  AI/ML   │  SMS &     │
│  Roles   │  Engine  │  Engine  │  Gateway   │
├──────────┴──────────┴──────────┴────────────┤
│         PostgreSQL / In-Memory DB            │
└─────────────────────────────────────────────┘
```

---

### Key Features (Working Prototype)

| Feature | Status | Details |
|---------|--------|---------|
| Role-based login | ✅ | 4 roles: Ministry, District, Hospital, Field Worker |
| Case reporting | ✅ | Web form + Quick-add + SMS simulation |
| AI risk detection | ✅ | Isolation Forest + Logistic Regression models |
| Uganda hotspot map | ✅ | Leaflet with district-level risk circles |
| Case trend timeline | ✅ | Daily line chart with Recharts |
| Outbreak prediction | ✅ | Time-series surge detection |
| District risk analysis | ✅ | Ranked table with risk scores |
| SMS reporting | ✅ | Simulated SMS gateway with symptom parsing |
| Outbreak simulation | ✅ | Generate test data for demos |
| Real-time polling | ✅ | Dashboard refreshes every 5-8 seconds |

---

### AI Capabilities

1. **Anomaly Detection** — Isolation Forest model scores each case against baseline patterns
2. **Outbreak Prediction** — Compares recent case surge against historical baseline
3. **Risk Classification** — Logistic Regression scores cases as HIGH/MEDIUM/LOW
4. **Heuristic Fallback** — Rule-based detection when ML models lack training data

The AI engine is designed for progressive enhancement: starts with rules, graduates to ML as data accumulates.

---

### Technology Stack

**Frontend:** React 19 + Vite + Leaflet + Recharts + Axios
**Backend:** Python FastAPI + scikit-learn + JWT auth
**Database:** In-memory (upgradeable to PostgreSQL)
**AI:** Isolation Forest, Logistic Regression (scikit-learn)
**SMS:** Simulation layer (upgradeable to Africa's Talking API)

---

### Demo Access

| Role | Username | Password |
|------|----------|----------|
| Ministry | admin | admin123 |
| District Officer | district | district123 |
| Hospital | hospital | hospital123 |
| Field Worker | worker | worker123 |

---

### How to Run

```bash
# Backend
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# Frontend
cd frontend
npm run dev
```

Backend runs on `http://127.0.0.1:8000`  
Frontend runs on `http://localhost:5173`

---

### Roadmap

**Phase 1 (Current MVP)** ✅
- Case reporting + AI risk detection + Dashboard with map

**Phase 2 (Next)** 🔄
- PostgreSQL persistence
- Africa's Talking SMS API integration
- WhatsApp Business API chatbot
- Real Uganda GeoJSON boundary map

**Phase 3** 📋
- Contact tracing graph
- Hospital bed/PPE resource tracking
- Mobile-first PWA with offline support
- Public health alert broadcast system

---

### Contact

Built as a submission for the Government of Uganda Innovation Call.

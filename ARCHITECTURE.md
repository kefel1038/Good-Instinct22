# NEEWRS Technical Architecture

## National Epidemic Early Warning & Response System

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Ministry │  │ District │  │ Hospital │  │  Field   │   │
│  │Dashboard │  │Dashboard │  │Dashboard │  │  Worker  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                     React 19 + Vite + Leaflet              │
├─────────────────────────────────────────────────────────────┤
│                     API LAYER (FastAPI)                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Auth &  │  Case    │   AI/ML  │  Uganda  │   SMS    │  │
│  │  Roles   │  Engine  │  Engine  │  GeoData │ Gateway  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     DATA LAYER                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            In-Memory Store (PostgreSQL ready)         │  │
│  │  Cases DB · Users DB · SMS Log · District Data       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Tech Stack
- **React 19** with hooks (useState, useEffect, useCallback)
- **Vite 8** for build tooling
- **Leaflet + react-leaflet** for interactive maps
- **Recharts** for time-series and pie charts
- **Axios** with JWT interceptor for API calls

### Component Tree
```
App
├── LoginPage (public)
└── Dashboard (authenticated)
    ├── Header (user info + logout)
    └── Role-based views
        ├── MinistryDashboard (full access)
        │   ├── StatsCards
        │   ├── OutbreakAlert
        │   ├── TrendChart
        │   ├── UgandaMap
        │   ├── DistrictTable
        │   ├── CaseForm
        │   ├── SMSPanel
        │   └── SimulationPanel
        ├── HospitalDashboard (clinical view)
        │   ├── StatsCards
        │   ├── TrendChart
        │   ├── DistrictTable
        │   └── CaseForm
        └── FieldWorkerDashboard (simple form)
            ├── QuickReportForm
            ├── StatsCards
            └── MyReports
```

### Polling & Real-Time
- Dashboard polls every 5-8 seconds
- Stats, hotspots, trends, and outbreak predictions update live
- SMS panel shows incoming reports instantly

---

## Backend Architecture

### Tech Stack
- **Python FastAPI** with async support
- **JWT authentication** (python-jose)
- **scikit-learn** (Isolation Forest + Logistic Regression)
- **NumPy/Pandas** for numerical processing

### API Endpoints

#### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Login with username/password |
| GET | `/auth/me` | Yes | Get current user info |

#### Case Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/report-case` | Yes | Submit new case |
| POST | `/report-case/public` | No | Public case submission |
| GET | `/cases` | Yes | Get all cases |
| GET | `/my-cases` | Yes | Get current user's cases |

#### Dashboard Data
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | Yes | Case statistics |
| GET | `/trend` | Yes | Daily case trend |
| GET | `/hotspots` | Yes | Geo hotspot clusters |

#### Uganda Geo Intelligence
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/uganda/districts` | Yes | District list with coordinates |
| GET | `/uganda/regions` | Yes | Region groupings |
| GET | `/uganda/district-cases` | Yes | Cases per district with risk scores |
| GET | `/uganda/region-stats` | Yes | Aggregated region statistics |

#### AI / ML
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ai/predict-outbreak` | Yes | Outbreak surge detection |
| GET | `/ai/district-risk` | Yes | Ranked district risk analysis |
| GET | `/ai/overview` | Yes | Combined AI intelligence |

#### SMS Gateway
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/sms/receive` | No | Process incoming SMS |
| GET | `/sms/log` | Yes | SMS transaction log |

#### Simulation & Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/simulate/outbreak` | Yes | Generate test outbreak cases |
| POST | `/admin/reset` | Yes | Clear all data (Ministry only) |

---

## AI Engine Design

### Detection Pipeline

```
Incoming Case
    │
    ▼
┌──────────────────┐
│  Heuristic Check  │  (if < 10 total cases)
│  - Fever ratio    │
│  - Cough ratio    │
│  - Rule-based     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Isolation Forest │  (if >= 10 cases)
│  - Anomaly score  │
│  - Outlier detect │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Logistic Regress. │  (if classified anomalous)
│  Risk prediction  │
│  HIGH/MEDIUM/LOW  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Outbreak Surge   │
│  Detection        │
│  (time-series)    │
└──────────────────┘
```

### Model Training
- Models train automatically when >= 10 cases exist
- Feature vector: [temperature, fever_flag, fever_symptom, cough, breathing_difficulty, symptom_count]
- Models persist in memory; retrain on each new case
- Fallback to rule-based when ML is unavailable

---

## Security & Authorization

### JWT Token
- Signed with HS256 algorithm
- 7-day expiry
- Payload: username, role, name, district
- Required on all protected endpoints except:
  - `/auth/login`
  - `/report-case/public`
  - `/sms/receive`

### Role-Based Access
| Role | Access Level |
|------|-------------|
| ministry | Full access, data reset capability |
| district_officer | Full dashboard access |
| hospital | Clinical dashboard, case reporting |
| field_worker | Simplified reporting, own cases |

---

## Data Flow Example

```
1. Field worker sends SMS: "fever cough high temperature Kampala"
2. SMS gateway receives at POST /sms/receive
3. AI Engine parses message, extracts symptoms
4. anomaly detected → HIGH_RISK classification
5. Case stored in database
6. Ministry dashboard polls → new case appears in real-time
7. Hotspot map updates → Kampala circle grows
8. Outbreak predictor recalculates → alert if surge detected
9. Trend chart updates → new data point for today
```

---

## Deployment Ready

- **Frontend**: Static build → deploy to any CDN (Vercel, Netlify)
- **Backend**: ASGI server → deploy to Render, Railway, or VPS
- **Database**: Replace in-memory dict with PostgreSQL using SQLAlchemy
- **SMS**: Replace simulation with Africa's Talking / Twilio API

# NEEWRS Demo Script — For Judges

## Duration: 5-7 minutes

---

### Setup (Pre-Demo)

1. Open backend terminal: `python -m uvicorn main:app --host 127.0.0.1 --port 8000`
2. Open frontend terminal: `npm run dev`
3. Open browser at `http://localhost:5173`

---

### 1. Login Screen (30 seconds)

> *"Welcome to NEEWRS — the National Epidemic Early Warning and Response System. This platform serves four types of users across Uganda's health system."*

- Show the login screen with the 4 demo accounts
- Log in as **admin / admin123** (Ministry of Health role)

---

### 2. Ministry Dashboard — National Overview (1 minute)

> *"The Ministry dashboard gives a nationwide view of disease activity in real time."*

- Point to the **stat cards**: Total cases, High/Medium/Low breakdown
- Point to the **case trend chart**: Shows daily case counts
- Point to the **risk distribution pie chart**: Visual breakdown
- Highlight the **live SMS feed** showing incoming reports

---

### 3. Outbreak Map & Districts (1 minute)

> *"This is our outbreak intelligence map. Each circle represents a district outbreak cluster."*

- Click on **"Map & Districts"** tab
- Show Uganda map with hotspot circles
- Hover over a district circle to show the popup with case data
- Scroll down to the **District Risk Analysis** table
- Point out the risk scores and color-coded badges

---

### 4. Simulate an Outbreak (1 minute)

> *"Let me show you how the system detects an outbreak in real time."*

- Click on **"Simulation"** tab
- Select "Gulu" district, set count to 15
- Click **"Simulate 15 Cases"**
- Immediately switch back to **"Overview"** tab
- Watch the stats update live
- *"The AI has detected this surge and flagged an outbreak alert at the top of the dashboard."*

---

### 5. SMS Gateway (1 minute)

> *"Field workers can report cases via SMS, even from areas without internet."*

- Click on **"SMS Gateway"** tab
- Type a message: `"fever cough high temperature difficulty breathing"`
- Click **"Send SMS"**
- Show the parsed result with AI risk assessment
- *"The AI extracts symptoms, estimates temperature, and assesses risk automatically."*

---

### 6. Role-Based Access (1 minute)

> *"Different users see different views tailored to their responsibilities."*

- **Logout** and log in as **hospital / hospital123**
- Show the **Hospital Dashboard**: Clinical overview, district table, case reporting form
- **Logout** and log in as **worker / worker123**
- Show the **Field Worker Dashboard**: Simple quick-report form, my recent reports
- *"Field workers get the simplest interface — perfect for low-literacy users on basic phones."*

---

### 7. AI Intelligence (30 seconds)

> *"Behind the scenes, our AI engine uses Isolation Forest for anomaly detection and Logistic Regression for risk classification. As more data flows in, the models improve automatically."*

---

### Closing (30 seconds)

> *"NEEWRS is not just a dashboard — it's a complete epidemic intelligence ecosystem. It's working now, it's expandable, and it's ready for Uganda. Thank you."*

---

## Key Talking Points

- **Working prototype** — not just slides or mockups
- **Multi-stakeholder** — 4 distinct user roles
- **AI-powered** — real ML models, not just rules
- **Offline-capable** — SMS reporting for rural areas
- **Uganda-specific** — district-level data, local context
- **Expandable** — modular architecture for Phase 2 & 3

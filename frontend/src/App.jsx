import { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Popup,
  GeoJSON,
} from "react-leaflet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  login,
  getMe,
  reportCase,
  reportCasePublic,
  getCases,
  getMyCases,
  getHotspots,
  getTrend,
  getStats,
  getDistricts,
  getDistrictCases,
  getRegionStats,
  predictOutbreak,
  getSMSLog,
  receiveSMS,
  simulateOutbreak,
  resetData,
} from "./api";

const api = { getRegionStats };
import "./App.css";

const COLORS = { HIGH_RISK: "#ef4444", MEDIUM_RISK: "#f59e0b", LOW: "#22c55e" };

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await login(username, password);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError("Invalid credentials. Try: admin/admin123, district/district123, hospital/hospital123, worker/worker123");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">N</div>
          <h1>NEEWRS</h1>
          <p>National Epidemic Early Warning &amp; Response System</p>
        </div>
        <div className="login-form">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button onClick={handleLogin} disabled={loading || !username || !password}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
          {error && <div className="login-error">{error}</div>}
        </div>
        <div className="login-roles">
          <strong>Demo Accounts:</strong>
          <div>admin / admin123 (Ministry)</div>
          <div>district / district123 (District Officer)</div>
          <div>hospital / hospital123 (Hospital)</div>
          <div>worker / worker123 (Field Worker)</div>
        </div>
      </div>
    </div>
  );
}

function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      <div className="stat-box total">
        <div className="number">{stats.total}</div>
        <div className="label">Total Cases</div>
      </div>
      <div className="stat-box high">
        <div className="number">{stats.high_risk}</div>
        <div className="label">High Risk</div>
      </div>
      <div className="stat-box medium">
        <div className="number">{stats.medium_risk}</div>
        <div className="label">Medium Risk</div>
      </div>
      <div className="stat-box low">
        <div className="number">{stats.low_risk}</div>
        <div className="label">Low Risk</div>
      </div>
    </div>
  );
}

function UgandaMap({ hotspots, districtCases }) {
  const center = [1.3733, 32.2903];

  const getColor = (risk) => {
    if (risk === "HIGH_RISK") return "#ef4444";
    if (risk === "MEDIUM_RISK") return "#f59e0b";
    return "#22c55e";
  };

  const getOpacity = (risk) => {
    if (risk === "HIGH_RISK") return 0.6;
    if (risk === "MEDIUM_RISK") return 0.4;
    return 0.25;
  };

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hotspots.map((h, i) => (
          <Circle
            key={i}
            center={[h.lat, h.lng]}
            radius={Math.max(h.case_count * 8000, 25000)}
            pathOptions={{
              color: h.intensity > 60 ? "#ef4444" : h.intensity > 30 ? "#f59e0b" : "#22c55e",
              fillOpacity: 0.35 + h.intensity / 200,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{h.location}</strong><br />
              Cases: {h.case_count}<br />
              Intensity: {Math.round(h.intensity)}%
            </Popup>
          </Circle>
        ))}
        {districtCases
          .filter((d) => d.total_cases > 0)
          .map((d, i) => (
            <Circle
              key={`dc-${i}`}
              center={[
                { Kampala: 0.3136, Wakiso: 0.404, Gulu: 2.7725, Mbarara: -0.6057, Mbale: 1.0803, Jinja: 0.439, Lira: 2.2354, Arua: 3.0189, Kabale: -1.2486, Masaka: -0.3333, Soroti: 1.715, FortPortal: 0.671, Hoima: 1.435, Kasese: 0.1833, Moroto: 2.5333, Kotido: 3.0167, Tororo: 0.693, Busia: 0.464, Mukono: 0.3533 }[d.district.replace(/\s/g, "")] || 1.0,
                { Kampala: 32.5811, Wakiso: 32.4589, Gulu: 32.299, Mbarara: 30.6541, Mbale: 34.175, Jinja: 33.203, Lira: 32.8897, Arua: 30.9109, Kabale: 29.9899, Masaka: 31.7333, Soroti: 33.61, FortPortal: 30.275, Hoima: 31.345, Kasese: 30.0833, Moroto: 34.6667, Kotido: 34.1167, Tororo: 34.181, Busia: 34.114, Mukono: 32.7553 }[d.district.replace(/\s/g, "")] || 32.5,
              ]}
              radius={Math.max(d.total_cases * 6000, 20000)}
              pathOptions={{
                color: getColor(d.risk_level),
                fillOpacity: getOpacity(d.risk_level),
                weight: 3,
              }}
            >
              <Popup>
                <strong>{d.district}</strong><br />
                Total Cases: {d.total_cases}<br />
                High: {d.high_risk} | Medium: {d.medium_risk} | Low: {d.low_risk}<br />
                Risk Score: {d.risk_score}
              </Popup>
            </Circle>
          ))}
      </MapContainer>
    </div>
  );
}

function TrendChart({ trend }) {
  if (!trend.daily || trend.daily.length === 0) {
    return <p className="empty-state">No data yet</p>;
  }
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trend.daily}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6 }} />
          <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} dot={{ fill: "#38bdf8", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DistrictTable({ districtCases }) {
  const sorted = [...districtCases].sort((a, b) => b.risk_score - a.risk_score);
  return (
    <div className="district-table">
      <table>
        <thead>
          <tr>
            <th>District</th>
            <th>Total</th>
            <th>High</th>
            <th>Medium</th>
            <th>Low</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => (
            <tr key={i}>
              <td>{d.district}</td>
              <td>{d.total_cases}</td>
              <td style={{ color: COLORS.HIGH_RISK }}>{d.high_risk}</td>
              <td style={{ color: COLORS.MEDIUM_RISK }}>{d.medium_risk}</td>
              <td style={{ color: COLORS.LOW }}>{d.low_risk}</td>
              <td>
                <span className={`risk-badge ${d.risk_level}`}>{d.risk_level.replace("_", " ")}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CaseForm({ onCaseReported }) {
  const [location, setLocation] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        location,
        temperature: parseFloat(temperature) || 36.5,
        symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (lat && lng) {
        payload.lat = parseFloat(lat);
        payload.lng = parseFloat(lng);
      }
      const res = await reportCase(payload);
      setResult(res.data);
      setLocation("");
      setTemperature("");
      setSymptoms("");
      setLat("");
      setLng("");
      if (onCaseReported) onCaseReported();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="form-grid">
        <input className="full-width" placeholder="District / Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input placeholder="Temperature (°C)" type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
        <input placeholder="Latitude" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
        <input placeholder="Longitude" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
        <input className="full-width" placeholder="Symptoms (fever, cough, headache...)" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        <button onClick={submit} disabled={loading || !location}>
          {loading ? "Submitting..." : "Report Case"}
        </button>
      </div>
      {result && (
        <div className={`result-banner ${result.risk_level}`}>
          AI Assessment: {result.risk_level} — Total: {result.total_cases}
        </div>
      )}
    </div>
  );
}

function SMSPanel({ onRefresh }) {
  const [smsLog, setSmsLog] = useState([]);
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSMSLog()
      .then((r) => setSmsLog(r.data.slice(-10).reverse()))
      .catch(() => {});
  }, []);

  const send = async () => {
    setLoading(true);
    try {
      await receiveSMS({ sender: sender || "2567XXXXXX", message, location: location || "Unknown" });
      setMessage("");
      const r = await getSMSLog();
      setSmsLog(r.data.slice(-10).reverse());
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="sms-input">
        <input placeholder="Phone (e.g. 256701234567)" value={sender} onChange={(e) => setSender(e.target.value)} />
        <input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <div className="sms-message-row">
          <input placeholder="Type SMS message... (e.g. 'fever cough high temperature')" value={message} onChange={(e) => setMessage(e.target.value)} className="flex-1" />
          <button onClick={send} disabled={loading || !message}>Send SMS</button>
        </div>
      </div>
      <div className="sms-templates">
        <button onClick={() => setMessage("fever cough high temperature difficulty breathing")}>Fever Alert</button>
        <button onClick={() => setMessage("cough headache general weakness")}>Cough Report</button>
        <button onClick={() => setMessage("vomiting diarrhea severe abdominal pain")}>GI Outbreak</button>
      </div>
      <div className="sms-feed">
        {smsLog.map((s, i) => (
          <div key={i} className={`sms-item ${s.risk_level === "HIGH_RISK" ? "high" : s.risk_level === "MEDIUM_RISK" ? "medium" : "low"}`}>
            <div className="sms-header">
              <span className="sms-sender">{s.sender}</span>
              <span className={`risk-badge ${s.risk_level}`}>{s.risk_level.replace("_", " ")}</span>
            </div>
            <div className="sms-body">{s.message}</div>
            <div className="sms-meta">{s.location} — {s.processed_at?.slice(11, 19)}</div>
          </div>
        ))}
        {smsLog.length === 0 && <p className="empty-state">No SMS reports yet</p>}
      </div>
    </div>
  );
}

function SimulationPanel({ onRefresh }) {
  const [district, setDistrict] = useState("Kampala");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const districts = ["Kampala", "Wakiso", "Gulu", "Mbarara", "Mbale", "Jinja", "Lira", "Arua", "Kabale", "Masaka", "Soroti", "Hoima", "Kasese", "Tororo", "Busia", "Mukono"];

  const run = async () => {
    setLoading(true);
    try {
      await simulateOutbreak(district, count);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sim-panel">
      <div className="sim-row">
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 10)} />
        <button onClick={run} disabled={loading}>
          {loading ? "Simulating..." : `Simulate ${count} Cases`}
        </button>
      </div>
    </div>
  );
}

function OutbreakAlert({ outbreak }) {
  if (!outbreak || !outbreak.outbreak_predicted) return null;
  return (
    <div className="outbreak-alert">
      <div className="alert-icon">⚠️</div>
      <div>
        <strong>Outbreak Alert</strong> — Confidence: {outbreak.confidence}%
        <br />
        <small>Recent avg: {outbreak.recent_daily_avg}/day vs baseline: {outbreak.baseline_avg}/day (Surge: {outbreak.surge_ratio}x)</small>
      </div>
    </div>
  );
}

function MinistryDashboard() {
  const [stats, setStats] = useState({ total: 0, high_risk: 0, medium_risk: 0, low_risk: 0 });
  const [trend, setTrend] = useState({ daily: [], total: 0 });
  const [hotspots, setHotspots] = useState([]);
  const [districtCases, setDistrictCases] = useState([]);
  const [outbreak, setOutbreak] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [regionStats, setRegionStats] = useState({});
  const [smsLog, setSmsLog] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [s, t, h, dc, o, rs, sms] = await Promise.all([
        getStats(),
        getTrend(),
        getHotspots(),
        getDistrictCases(),
        predictOutbreak(),
        (async () => {
          try {
            const res = await getRegionStats();
            return res.data;
          } catch { return {}; }
        })(),
        getSMSLog(),
      ]);
      setStats(s.data);
      setTrend(t.data);
      setHotspots(h.data);
      setDistrictCases(dc.data || []);
      setOutbreak(o.data);
      setSmsLog(sms.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 8000); return () => clearInterval(i); }, [fetchAll]);

  const pieData = [
    { name: "High", value: stats.high_risk, color: COLORS.HIGH_RISK },
    { name: "Medium", value: stats.medium_risk, color: COLORS.MEDIUM_RISK },
    { name: "Low", value: stats.low_risk, color: COLORS.LOW },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <OutbreakAlert outbreak={outbreak} />

      <div className="dashboard-tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={activeTab === "map" ? "active" : ""} onClick={() => setActiveTab("map")}>Map &amp; Districts</button>
        <button className={activeTab === "report" ? "active" : ""} onClick={() => setActiveTab("report")}>Report Case</button>
        <button className={activeTab === "sms" ? "active" : ""} onClick={() => setActiveTab("sms")}>SMS Gateway</button>
        <button className={activeTab === "simulate" ? "active" : ""} onClick={() => setActiveTab("simulate")}>Simulation</button>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="card full-width">
            <h2>National Overview</h2>
            <StatsCards stats={stats} />
          </div>
          <div className="card">
            <h2>Case Trend</h2>
            <TrendChart trend={trend} />
          </div>
          <div className="card">
            <h2>Risk Distribution</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="empty-state">No data</p>}
          </div>
          <div className="card full-width">
            <h2>Latest SMS Reports</h2>
            <div className="sms-feed">
              {smsLog.slice(-5).reverse().map((s, i) => (
                <div key={i} className={`sms-item ${s.risk_level === "HIGH_RISK" ? "high" : s.risk_level === "MEDIUM_RISK" ? "medium" : "low"}`}>
                  <div className="sms-header">
                    <span className="sms-sender">{s.sender}</span>
                    <span className={`risk-badge ${s.risk_level}`}>{s.risk_level.replace("_", " ")}</span>
                  </div>
                  <div className="sms-body">{s.message}</div>
                </div>
              ))}
              {smsLog.length === 0 && <p className="empty-state">No SMS reports yet</p>}
            </div>
          </div>
        </>
      )}

      {activeTab === "map" && (
        <>
          <div className="card full-width">
            <h2>Uganda Outbreak Map</h2>
            <UgandaMap hotspots={hotspots} districtCases={districtCases} />
            <div className="heatmap-legend">
              <span>Low</span>
              <div className="legend-gradient" />
              <span>High</span>
            </div>
          </div>
          <div className="card full-width">
            <h2>District Risk Analysis</h2>
            <DistrictTable districtCases={districtCases} />
          </div>
        </>
      )}

      {activeTab === "report" && (
        <div className="card full-width">
          <h2>Report New Case (Ministry Level)</h2>
          <CaseForm onCaseReported={fetchAll} />
        </div>
      )}

      {activeTab === "sms" && (
        <div className="card full-width">
          <h2>SMS Gateway Simulation</h2>
          <SMSPanel onRefresh={fetchAll} />
        </div>
      )}

      {activeTab === "simulate" && (
        <div className="card full-width">
          <h2>Outbreak Simulation</h2>
          <SimulationPanel onRefresh={fetchAll} />
          <p className="hint">Generates realistic outbreak cases in a district for demo purposes.</p>
        </div>
      )}
    </div>
  );
}

function HospitalDashboard() {
  const [stats, setStats] = useState({ total: 0, high_risk: 0, medium_risk: 0, low_risk: 0 });
  const [trend, setTrend] = useState({ daily: [], total: 0 });
  const [hotspots, setHotspots] = useState([]);
  const [districtCases, setDistrictCases] = useState([]);
  const [outbreak, setOutbreak] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [s, t, h, dc, o] = await Promise.all([
        getStats(), getTrend(), getHotspots(), getDistrictCases(), predictOutbreak(),
      ]);
      setStats(s.data);
      setTrend(t.data);
      setHotspots(h.data);
      setDistrictCases(dc.data || []);
      setOutbreak(o.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 10000); return () => clearInterval(i); }, [fetchAll]);

  return (
    <div>
      <OutbreakAlert outbreak={outbreak} />
      <div className="card full-width">
        <h2>Hospital Dashboard — Clinical Overview</h2>
        <StatsCards stats={stats} />
      </div>
      <div className="card">
        <h2>Case Trend (Clinical)</h2>
        <TrendChart trend={trend} />
      </div>
      <div className="card full-width">
        <h2>District Cases</h2>
        <DistrictTable districtCases={districtCases} />
      </div>
      <div className="card full-width">
        <h2>Report Case</h2>
        <CaseForm onCaseReported={fetchAll} />
      </div>
    </div>
  );
}

function FieldWorkerDashboard() {
  const [myCases, setMyCases] = useState([]);
  const [stats, setStats] = useState({ total: 0, high_risk: 0, medium_risk: 0, low_risk: 0 });
  const [location, setLocation] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mc, s] = await Promise.all([getMyCases(), getStats()]);
      setMyCases(mc.data || []);
      setStats(s.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

  const submitSimple = async () => {
    setLoading(true);
    try {
      const res = await reportCasePublic({
        location: location || "Unknown",
        temperature: parseFloat(temperature) || 36.5,
        symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
        reported_by: "field-worker",
      });
      setResult(res.data);
      setLocation("");
      setTemperature("");
      setSymptoms("");
      await fetchData();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="card full-width">
        <h2>Field Worker — Quick Report</h2>
        <div className="form-grid">
          <input className="full-width" placeholder="Village / District" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input placeholder="Temperature" type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          <input className="full-width" placeholder="Symptoms (fever, cough...)" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
          <button onClick={submitSimple} disabled={loading}>
            {loading ? "Sending..." : "Submit Report"}
          </button>
        </div>
        {result && <div className={`result-banner ${result.risk_level}`}>AI Risk: {result.risk_level}</div>}
      </div>
      <div className="card">
        <h2>National Stats</h2>
        <StatsCards stats={stats} />
      </div>
      <div className="card full-width">
        <h2>My Recent Reports ({myCases.length})</h2>
        <div className="report-list">
          {myCases.slice(-10).reverse().map((c, i) => (
            <div key={i} className={`report-item ${c.risk_level}`}>
              <div className="report-location">{c.location}</div>
              <div className="report-symptoms">{c.symptoms?.join(", ")}</div>
              <div className="report-temp">{c.temperature}°C</div>
              <span className={`risk-badge ${c.risk_level}`}>{c.risk_level.replace("_", " ")}</span>
            </div>
          ))}
          {myCases.length === 0 && <p className="empty-state">No reports yet</p>}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading NEEWRS...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const role = user.role || "field_worker";
  const roleLabels = {
    ministry: "Ministry of Health",
    district_officer: "District Health Officer",
    hospital: "Hospital Admin",
    field_worker: "Field Health Worker",
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>NEEWRS</h1>
          <span className="header-subtitle">Epidemic Early Warning System</span>
        </div>
        <div className="header-right">
          <span className="user-role">{roleLabels[role] || role}</span>
          <span className="user-name">{user.name || user.sub}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <div className="dashboard">
        {role === "ministry" && <MinistryDashboard />}
        {role === "district_officer" && <MinistryDashboard />}
        {role === "hospital" && <HospitalDashboard />}
        {role === "field_worker" && <FieldWorkerDashboard />}
      </div>
    </div>
  );
}

export default App;

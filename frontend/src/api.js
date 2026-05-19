import axios from "axios";

const API = "/api";

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (username, password) =>
  api.post("/auth/login", { username, password });

export const getMe = () => api.get("/auth/me");

export const reportCase = (data) => api.post("/report-case", data);

export const reportCasePublic = (data) => api.post("/report-case/public", data);

export const getCases = () => api.get("/cases");

export const getMyCases = () => api.get("/my-cases");

export const getHotspots = () => api.get("/hotspots");

export const getTrend = () => api.get("/trend");

export const getStats = () => api.get("/stats");

export const getDistricts = () => api.get("/uganda/districts");

export const getRegions = () => api.get("/uganda/regions");

export const getDistrictCases = () => api.get("/uganda/district-cases");

export const getRegionStats = () => api.get("/uganda/region-stats");

export const getGeoJSON = () => api.get("/uganda/geojson");

export const predictOutbreak = () => api.get("/ai/predict-outbreak");

export const getDistrictRisk = () => api.get("/ai/district-risk");

export const getAIOverview = () => api.get("/ai/overview");

export const receiveSMS = (data) => api.post("/sms/receive", data);

export const getSMSLog = () => api.get("/sms/log");

export const simulateOutbreak = (district, count) =>
  api.post(`/simulate/outbreak?district=${district}&count=${count}`);

export const resetData = () => api.post("/admin/reset");

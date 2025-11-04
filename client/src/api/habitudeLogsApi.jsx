import axios from "axios";

const API_URL = "http://localhost:5000/api/habitude-logs";

// ✅ 1. GET_ALL_LOGS - Récupérer tous les logs
export const getAllLogs = () => {
  console.log("🔍 GET_ALL_LOGS - Récupération de tous les logs");
  return axios.get(API_URL);
};

// ✅ 2. CREATE_LOG - Créer un nouveau log
export const createLog = (logData) => {
  console.log("➕ CREATE_LOG - Création d'un log:", logData);
  return axios.post(API_URL, logData);
};

// ✅ 3. UPDATE_LOG - Mettre à jour un log existant
export const updateLog = (id, logData) => {
  console.log("✏️ UPDATE_LOG - Mise à jour log ID:", id, logData);
  return axios.put(`${API_URL}/${id}`, logData);
};

// ✅ 4. DELETE_LOG - Supprimer un log
export const deleteLog = (id) => {
  console.log("🗑️ DELETE_LOG - Suppression log ID:", id);
  return axios.delete(`${API_URL}/${id}`);
};
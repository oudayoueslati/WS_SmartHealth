import axios from "axios";

const API_URL = "http://localhost:5000/api/habitudes";

// ✅ 1. GET_ALL_HABITUDES - Récupérer toutes les habitudes
export const getAllHabitudes = () => {
  console.log("🔍 GET_ALL_HABITUDES - Récupération de toutes les habitudes");
  return axios.get(API_URL);
};

// ✅ 2. CREATE_HABITUDE - Créer une nouvelle habitude
export const createHabitude = (habitudeData) => {
  console.log("➕ CREATE_HABITUDE - Création d'une habitude:", habitudeData);
  return axios.post(API_URL, habitudeData);
};

// ✅ 3. UPDATE_HABITUDE - Mettre à jour une habitude existante
export const updateHabitude = (id, habitudeData) => {
  console.log("✏️ UPDATE_HABITUDE - Mise à jour habitude ID:", id, habitudeData);
  return axios.put(`${API_URL}/${id}`, habitudeData);
};

// ✅ 4. DELETE_HABITUDE - Supprimer une habitude
export const deleteHabitude = (id) => {
  console.log("🗑️ DELETE_HABITUDE - Suppression habitude ID:", id);
  return axios.delete(`${API_URL}/${id}`);
};
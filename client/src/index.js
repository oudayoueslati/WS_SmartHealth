import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ✅ Styles
import "assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/scss/argon-dashboard-react.scss";

// ✅ Composants
import HabitudeList from "./components/Habitude/HabitudeList";
import HabitudeLogList from "./components/HabitudeLogs/HabitudeLogList";
import AdminLayout from "layouts/Admin.js";
import AuthLayout from "layouts/Auth.js";
import { AuthProvider } from "./context/AuthContext";
import SaifAIChat from './components/Habitude/SaifAIChat';

// ✅ Point d'entrée
const root = ReactDOM.createRoot(document.getElementById("root"));


root.render(
  
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Layouts principaux */}
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/auth/*" element={<AuthLayout />} />

        {/* Modules CRUD */}
        <Route path="/admin/habitudes" element={<HabitudeList />} />
        <Route path="/habitude-logs" element={<HabitudeLogList />} />
        <Route path="/aichat" element={<SaifAIChat />} />



        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

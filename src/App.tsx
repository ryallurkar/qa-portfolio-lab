import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import KudosWallPage from "./pages/KudosWallPage";
import { useAuthStore } from "./store";

// Simple protected route component — redirects to login if there's no token
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = useAuthStore((s) => s.token);
  return token ? element : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/kudos"
          element={<ProtectedRoute element={<KudosWallPage />} />}
        />
        {/* Fallback — send unknown paths to the login page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

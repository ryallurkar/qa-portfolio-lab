import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api-client";
import { useAuthStore, useKudosStore, Kudo } from "../store";
import KudosModal from "../components/KudosModal";

const KudosWallPage: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const kudos = useKudosStore((s) => s.kudos);
  const setKudos = useKudosStore((s) => s.setKudos);

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Guard: redirect to login if there's no token in the store
  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  // Load the initial kudos feed
  useEffect(() => {
    apiClient
      .get<Kudo[]>("/kudos")
      .then(({ data }) => setKudos(data))
      .catch(() => {
        // If the request fails (e.g. expired token), fall back to empty list
        setKudos([]);
      })
      .finally(() => setLoading(false));
  }, [setKudos]);

  const handleSignOut = () => {
    clearAuth();
    navigate("/");
  };

  if (!token) return null;

  return (
    <div
      data-testid="kudos-wall-page"
      className="min-h-screen bg-gray-50"
    >
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">Kudos Wall</h1>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600">
                Signed in as{" "}
                <span className="font-medium">{user.username}</span>
              </span>
            )}
            <button
              data-testid="create-kudos-btn"
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Give Kudos
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Kudos feed */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-400 mt-16">Loading…</p>
        ) : kudos.length === 0 ? (
          <p className="text-center text-gray-400 mt-16">
            No kudos yet — be the first to give one!
          </p>
        ) : (
          <ul className="space-y-4">
            {kudos.map((kudo) => (
              <li
                key={kudo.id}
                data-testid="kudos-item"
                className="bg-white shadow-sm rounded-xl p-5"
              >
                <p className="text-gray-800 mb-3">{kudo.message}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-indigo-600">
                    {kudo.author.username}
                  </span>{" "}
                  →{" "}
                  <span className="font-medium text-indigo-600">
                    {kudo.receiver.username}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Give Kudos modal */}
      {modalOpen && <KudosModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default KudosWallPage;

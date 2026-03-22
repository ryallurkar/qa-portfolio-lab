import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api-client";
import { useAuthStore, AuthUser } from "../store";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Obtain an access token
      const { data: tokenData } = await apiClient.post<{ accessToken: string }>(
        "/auth/sign-in",
        { username, password }
      );

      // Fetch the full user profile to populate the store
      const { data: user } = await apiClient.get<AuthUser>("/auth/me", {
        headers: { Authorization: `Bearer ${tokenData.accessToken}` },
      });

      setAuth(tokenData.accessToken, user);
      navigate("/kudos");
    } catch {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="sign-in-page"
      className="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div className="w-full max-w-sm bg-white shadow-md rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">
          Kudos App
        </h1>

        <form data-testid="login-form" onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              data-testid="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoComplete="username"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p
              data-testid="login-error"
              className="text-red-600 text-sm mb-4"
            >
              {error}
            </p>
          )}

          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

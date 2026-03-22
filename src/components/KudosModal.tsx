import React, { useEffect, useState } from "react";
import apiClient from "../api-client";
import { useAuthStore, useKudosStore, Kudo } from "../store";

interface User {
  id: number;
  username: string;
}

interface KudosModalProps {
  onClose: () => void;
}

const KudosModal: React.FC<KudosModalProps> = ({ onClose }) => {
  const currentUser = useAuthStore((s) => s.user);
  const prependKudo = useKudosStore((s) => s.prependKudo);

  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [receiverId, setReceiverId] = useState<string>("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch the user list once the modal mounts and filter out the logged-in user
  useEffect(() => {
    apiClient
      .get<User[]>("/auth/users")
      .then(({ data }) => {
        // Always iterate the filtered list — never the raw unfiltered one
        const others = data.filter((u) => u.id !== currentUser?.id);
        setUsers(others);
        if (others.length > 0) {
          setReceiverId(String(others[0].id));
        }
      })
      .catch(() => setError("Failed to load users."));
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("Message is required.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: kudo } = await apiClient.post<Kudo>("/kudos", {
        message,
        receiverId: Number(receiverId),
      });
      prependKudo(kudo);
      onClose();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message ?? "Failed to submit kudo. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        data-testid="kudos-modal"
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Give Kudos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="kudos-message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message
            </label>
            <textarea
              id="kudos-message"
              data-testid="kudos-message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Write something kind…"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="kudos-receiver"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Send to
            </label>
            <select
              id="kudos-receiver"
              data-testid="kudos-receiver-select"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p data-testid="kudos-create-error" className="text-red-600 text-sm mb-4">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid="kudos-submit-btn"
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Sending…" : "Send Kudos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KudosModal;

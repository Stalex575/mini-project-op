import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://mini-project-op.onrender.com";

export default function AdminPanel() {
  const [secret, setSecret] = useState("");
  const [confirmed, setConfirmed] = useState([]);
  const [unconfirmed, setUnconfirmed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [obstacleToDelete, setObstacleToDelete] = useState(null);

  const fetchObstacles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/get-obstacles`, {
        headers: { ADMIN_SECRET: secret },
      });
      setConfirmed(res.data.confirmed);
      setUnconfirmed(res.data.unconfirmed);
    } catch (err) {
      setError("Failed to load. Check your secret or the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id, fromConfirmed) => {
    if (fromConfirmed) {
      const obstacle = confirmed.find((o) => o.id === id);
      setConfirmed(confirmed.filter((o) => o.id !== id));
      setUnconfirmed([...unconfirmed, obstacle]);
    } else {
      const obstacle = unconfirmed.find((o) => o.id === id);
      setUnconfirmed(unconfirmed.filter((o) => o.id !== id));
      setConfirmed([...confirmed, obstacle]);
    }
  };

  const submitChanges = async () => {
    try {
      const allIds = [
        ...confirmed.map((o) => o.id),
        ...unconfirmed.map((o) => o.id),
      ];
      await axios.post(
        `${API_URL}/confirm-obstacles`,
        {
          confirmed_ids: confirmed.map((o) => o.id),
          all_ids: allIds,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ADMIN_SECRET: secret,
          },
        }
      );
      fetchObstacles();
      alert("Changes updated successfully!");
    } catch (err) {
      alert("Failed to update changes!");
    }
  };

  const promptDelete = (id) => {
    setObstacleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const deleteObstacle = async () => {
    try {
      await axios.post(
        `${API_URL}/delete-obstacle`,
        { node_id: obstacleToDelete },
        {
          headers: { ADMIN_SECRET: secret },
        }
      );
      fetchObstacles();
    } catch (err) {
      alert("Failed to delete obstacle!");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      {/* Secret input and fetch button */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter ADMIN_SECRET"
          className="border p-2 rounded"
        />
        <button
          onClick={fetchObstacles}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {/* Error message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading ? (
        <p>Loading data...</p>
      ) : (
        secret && (
          <div className="space-y-6">
            {/* Confirmed obstacles list */}
            <div>
              <h2 className="text-xl font-semibold mb-2">
                ✅ Confirmed Obstacles
              </h2>
              <ul className="space-y-1">
                {confirmed.map((obs) => (
                  <li key={obs.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked
                      onChange={() => handleToggle(obs.id, true)}
                      className="cursor-pointer"
                    />
                    <span>
                      #{obs.id} ({obs.lat.toFixed(5)}, {obs.lon.toFixed(5)})
                    </span>
                    <button
                      onClick={() => promptDelete(obs.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                      title="Delete obstacle"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Unconfirmed obstacles list */}
            <div>
              <h2 className="text-xl font-semibold mb-2">
                ❌ Unconfirmed Obstacles
              </h2>
              <ul className="space-y-1">
                {unconfirmed.map((obs) => (
                  <li key={obs.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleToggle(obs.id, false)}
                      className="cursor-pointer"
                    />
                    <span>
                      #{obs.id} ({obs.lat.toFixed(5)}, {obs.lon.toFixed(5)})
                    </span>
                    <button
                      onClick={() => promptDelete(obs.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                      title="Delete obstacle"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Submit button */}
            <div>
              <button
                onClick={submitChanges}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Update Confirmed Status
              </button>
            </div>
          </div>
        )
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete obstacle #{obstacleToDelete}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteObstacle}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function AdminPanel() {
  const [secret, setSecret] = useState('');
  const [confirmed, setConfirmed] = useState([]);
  const [unconfirmed, setUnconfirmed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchObstacles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/get-obstacles`, {
        headers: { 'ADMIN_SECRET': secret }
      });
      setConfirmed(res.data.confirmed);
      setUnconfirmed(res.data.unconfirmed);
    } catch (err) {
      setError('Failed to load. Check your secret or the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id, fromConfirmed) => {
    if (fromConfirmed) {
      const obstacle = confirmed.find(o => o.id === id);
      setConfirmed(confirmed.filter(o => o.id !== id));
      setUnconfirmed([...unconfirmed, obstacle]);
    } else {
      const obstacle = unconfirmed.find(o => o.id === id);
      setUnconfirmed(unconfirmed.filter(o => o.id !== id));
      setConfirmed([...confirmed, obstacle]);
    }
  };

  const submitChanges = async () => {
    try {
      const allIds = [...confirmed.map(o => o.id), ...unconfirmed.map(o => o.id)];
      await axios.post(`${API_URL}/confirm-obstacles`, {
        confirmed_ids: confirmed.map(o => o.id),
        all_ids: allIds
      }, {
        headers: {
          'Content-Type': 'application/json',
          'ADMIN_SECRET': secret
        }
      });
      fetchObstacles();
      alert('Updated!');
    } catch (err) {
      alert('Failed to update!');
    }
  };

  const deleteObstacle = async (id) => {
    if (!window.confirm(`Are you sure you want to delete obstacle #${id}?`)) return;
    try {
      await axios.post(`${API_URL}/delete-obstacle`, 
        { node_id: id }, 
        {
          headers: { 'ADMIN_SECRET': secret }
        }
      );
      fetchObstacles();
    } catch (err) {
      alert('Failed to delete!');
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
          onChange={e => setSecret(e.target.value)}
          placeholder="Enter ADMIN_SECRET"
          className="border p-2 rounded"
        />
        <button
          onClick={fetchObstacles}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Load
        </button>
      </div>

      {/* Error message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        secret && (
          <div className="space-y-6">
            {/* Confirmed obstacles list */}
            <div>
              <h2 className="text-xl font-semibold mb-2">✅ Confirmed</h2>
              <ul className="space-y-1">
                {confirmed.map(obs => (
                  <li key={obs.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked
                      onChange={() => handleToggle(obs.id, true)}
                    />
                    <span>#{obs.id} ({obs.lat.toFixed(5)}, {obs.lon.toFixed(5)})</span>
                    <button
                      onClick={() => deleteObstacle(obs.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Unconfirmed obstacles list */}
            <div>
              <h2 className="text-xl font-semibold mb-2">❌ Unconfirmed</h2>
              <ul className="space-y-1">
                {unconfirmed.map(obs => (
                  <li key={obs.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleToggle(obs.id, false)}
                    />
                    <span>#{obs.id} ({obs.lat.toFixed(5)}, {obs.lon.toFixed(5)})</span>
                    <button
                      onClick={() => deleteObstacle(obs.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
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
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Update Confirmed
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
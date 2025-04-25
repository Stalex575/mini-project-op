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
      setError('Помилка завантаження. Перевірте секрет або сервер.');
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
      alert('Оновлено!');
    } catch (err) {
      alert('Помилка при оновленні!');
    }
  };

  const deleteObstacle = async (id) => {
    if (!window.confirm(`Ви впевнені, що хочете видалити перешкоду #${id}?`)) return;
    try {
      await axios.post(`${API_URL}/delete-obstacle`, 
        { node_id: id }, 
        {
          headers: { 'ADMIN_SECRET': secret }
        }
      );
      fetchObstacles();
    } catch (err) {
      alert('Помилка при видаленні!');
    }
  };
  

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Панель адміністратора</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          placeholder="Введіть ADMIN_SECRET"
          className="border p-2 rounded"
        />
        <button
          onClick={fetchObstacles}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Завантажити
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading ? (
        <p>Завантаження...</p>
      ) : (
        secret && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">✅ Підтверджені</h2>
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

            <div>
              <h2 className="text-xl font-semibold mb-2">❌ Непідтверджені</h2>
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

            <div>
              <button
                onClick={submitChanges}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Оновити підтверджені
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

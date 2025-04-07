import React, { useState } from "react";
import MapComponent from "./MapComponent";

export default function MapPage() {
  const [route, setRoute] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [obstacleMode, setObstacleMode] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");

  const handleGetRoute = () => {
    fetch("http://localhost:8000/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: markers[0], end: markers[1] }),
    })
      .then((res) => res.json())
      .then((data) => {
        setRoute(data.route);
        setObstacleMode(true);
      });
  };

  const handleAddObstacle = (obstacle) => {
    setObstacles([...obstacles, obstacle]);
  };

  const validateCoordinates = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < 44.38 || lat > 52.38) {
      setError("Latitude must be between 44.38 and 52.38 (Ukraine territory).");
      return false;
    }

    if (isNaN(lng) || lng < 22.14 || lng > 40.23) {
      setError(
        "Longitude must be between 22.14 and 40.23 (Ukraine territory)."
      );
      return false;
    }

    setError("");
    return true;
  };

  const handleAddMarker = () => {
    if (validateCoordinates()) {
      const newMarker = [parseFloat(latitude), parseFloat(longitude)];
      setMarkers([...markers, newMarker]); // Update markers state
      setLatitude("");
      setLongitude("");
    }
  };

  return (
    <section>
      <div className="searchbar-container">
        <input placeholder="Search on map" className="searchbar"></input>
      </div>
      <div className="toolbar-container">
        <div className="toolbar">
          {error && <p className="error-message">{error}</p>}
          <div className="toolbar-features">
            <input
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <input
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
            <button
              className="action-button add-marker-btn"
              onClick={handleAddMarker}
              disabled={!longitude || !latitude || markers.length === 2}
            >
              Add
              <br />
              marker
            </button>
            <button disabled={route} className="action-button blockade-btn">
              Add blockade
            </button>
            <button
              className="action-button route-btn"
              disabled={markers.length !== 2}
              onClick={handleGetRoute}
            >
              Get route
            </button>
          </div>
        </div>
      </div>
      <MapComponent
        route={route}
        onAddObstacle={handleAddObstacle}
        obstacleMode={obstacleMode}
        onMarkersChange={setMarkers}
        markers={markers}
      />
    </section>
  );
}

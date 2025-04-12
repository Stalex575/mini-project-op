import React, { useState, useEffect } from "react";
import MapComponent from "./MapComponent";

export default function MapPage() {
  const [route, setRoute] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [obstacleMode, setObstacleMode] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const [boxCoords, setBoxCoords] = useState([]);
  const [boxMargin, setBoxMargin] = useState(0.2);

  useEffect(() => {
    fetch("http://localhost:8000/obstacles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setObstacles(data.obstacles);
        }
      });
  }, []);

  const handleSaveObstacles = () => {
    fetch("http://localhost:8000/obstacles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obstacles }),
    })
      .then((res) => res.json())
      .then((data) => {
        setObstacles(data.obstacles);
        setObstacleMode(false);
      });
  };

  const handleGetRoute = () => {
    fetch("http://localhost:8000/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: markers[0],
        end: markers[1],
        margin: parseFloat(boxMargin),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.route.length === 0) {
          setError("No route found. Increase search area and try again.");
          return;
        }
        setError("");
        setRoute(data.route);
        setBoxCoords(data.bounding_box);
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
      setMarkers([...markers, newMarker]);
      setLatitude("");
      setLongitude("");
    }
  };

  return (
    <section>
      <div className="searchbar-container">
        <input placeholder="Search on map" className="searchbar"></input>
      </div>
      <div className="bounding-box-controller-wrapper">
        <div className="hover-text-container">
          <h1 className="hover-text">
            Search area
            <br />
            control
          </h1>
        </div>
        <div className="bounding-box-controller-container">
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={boxMargin}
            onChange={(e) => setBoxMargin(e.target.value)}
            className="bounding-box-controller"
          ></input>
          <label className="bounding-box-label">{boxMargin}</label>
        </div>
      </div>

      <div className="toolbar-container">
        <div className="toolbar">
          {error && <p className="error-message">{error}</p>}
          <div className="toolbar-features">
            <div className="toolbar-inputs">
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
            </div>
            <button
              className="action-button add-marker-btn"
              onClick={handleAddMarker}
              disabled={
                !longitude || !latitude || markers.length === 2 || obstacleMode
              }
            >
              Add
              <br />
              marker
            </button>
            <div className="toolbar-buttons">
              <button
                onClick={setObstacleMode}
                className="action-button blockade-btn"
              >
                Add blockade
              </button>
              {!obstacleMode ? (
                <button
                  className="action-button route-btn"
                  disabled={markers.length !== 2 || !!route?.length}
                  onClick={handleGetRoute}
                >
                  Get route
                </button>
              ) : (
                <button
                  className="action-button obstacle-btn"
                  disabled={!obstacles}
                  onClick={handleSaveObstacles}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <MapComponent
        route={route}
        onAddObstacle={handleAddObstacle}
        obstacleMode={obstacleMode}
        onMarkersChange={setMarkers}
        markers={markers}
        obstacles={obstacles}
        onRouteChange={setRoute}
      />
    </section>
  );
}

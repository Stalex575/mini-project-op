import React, { useEffect } from "react";
import MapComponent from "./MapComponent";
import { useMap } from "./MapContext";
const API_URL = "https://mini-project-op.onrender.com";
export default function MapPage() {
  const {
    route,
    setRoute,
    obstacles,
    setObstacles,
    obstacleMode,
    setObstacleMode,
    markers,
    setMarkers,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    error,
    setError,
    setBoxCoords,
    boxMargin,
    setBoxMargin,
    searchQuery,
    setSearchQuery,
    map,
    validateCoordinates,
    selectedAlgorithm,
    setSelectedAlgorithm,
    routeBtnDisabled,
    setRouteBtnDisabled,
  } = useMap();

  useEffect(() => {
    handleSetBtnState();
  }, [markers, obstacleMode]);
  const handleSetBtnState = () => {
    if (markers.length === 2 && route.length === 0) {
      setRouteBtnDisabled(false);
    } else if (route.length > 0 && !obstacleMode) {
      setRouteBtnDisabled(false);
    } else {
      setRouteBtnDisabled(true);
    }
  };
  useEffect(() => {
    fetch(`${API_URL}/obstacles`, {
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

  const handleSearch = async () => {
    if (searchQuery) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&addressdetails=1&bounded=1&viewbox=22.14,52.38,40.23,44.38`
        );
        const data = await response.json();

        if (data.length > 0) {
          const location = data[0];
          const lat = parseFloat(location.lat);
          const lon = parseFloat(location.lon);
          map.setView([lat, lon], 13);
        } else {
          setError("Location not found in Ukraine.");
        }
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSaveObstacles = () => {
    fetch(`${API_URL}/obstacles`, {
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
    fetch(`${API_URL}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: markers[0],
        end: markers[1],
        margin: parseFloat(boxMargin),
        algorithm: selectedAlgorithm,
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
        setRouteBtnDisabled(true);
      });
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
      <div className="map-header-container">
        <a href="/" className="project-name">
          EXODUS
        </a>
      </div>
      <div className="searchbar-container">
        <input
          placeholder="Search on map"
          className="searchbar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
        ></input>
      </div>
      <div className="alg-controller-container">
        <p className="nomargin">Select algorithm:</p>
        <label>
          <input
            type="radio"
            name="alg-picker"
            checked={selectedAlgorithm === "A-star"}
            onChange={(e) => {
              setSelectedAlgorithm(e.target.value);
              handleSetBtnState();
            }}
            value="A-star"
          />
          A-star
        </label>
        <label>
          <input
            type="radio"
            name="alg-picker"
            value="Ant colony"
            checked={selectedAlgorithm === "Ant colony"}
            onChange={(e) => {
              setSelectedAlgorithm(e.target.value);
              handleSetBtnState();
            }}
          />
          Ant colony
        </label>
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
            onChange={(e) => {
              setBoxMargin(e.target.value);
              handleSetBtnState();
            }}
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
                  disabled={routeBtnDisabled}
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
      <MapComponent />
    </section>
  );
}

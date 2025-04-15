import React, { createContext, useContext, useState } from "react";

const MapContext = createContext();

export const useMap = () => useContext(MapContext);

export const MapProvider = ({ children }) => {
  const [route, setRoute] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [obstacleMode, setObstacleMode] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const [boxCoords, setBoxCoords] = useState([]);
  const [boxMargin, setBoxMargin] = useState(0.2);
  const [searchQuery, setSearchQuery] = useState("");
  const [map, setMap] = useState(null);
  const validateCoordinates = (
    lat = parseFloat(latitude),
    lng = parseFloat(longitude)
  ) => {
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
  return (
    <MapContext.Provider
      value={{
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
        boxCoords,
        setBoxCoords,
        boxMargin,
        setBoxMargin,
        searchQuery,
        setSearchQuery,
        map,
        setMap,
        validateCoordinates,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

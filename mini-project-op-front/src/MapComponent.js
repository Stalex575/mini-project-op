import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useMap } from "./MapContext";

const MapComponent = () => {
  const {
    markers,
    setMarkers,
    obstacles,
    route,
    setRoute,
    setObstacles,
    obstacleMode,
    setMap,
    validateCoordinates,
  } = useMap();

  const customIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const obstacleIcon = L.divIcon({
    html: `<div style="width: 12px; height: 12px; background: crimson; transform: rotate(45deg); border-radius: 2px;"></div>`,
    className: "",
    iconSize: [12, 12],
  });
  const MapClickHandler = () => {
    const map = useMapEvents({
      click: (e) => {
        if (
          !obstacleMode &&
          markers.length < 2 &&
          validateCoordinates(e.latlng.lat, e.latlng.lng)
        ) {
          const newMarkers = [...markers, [e.latlng.lat, e.latlng.lng]];
          setMarkers(newMarkers);
        } else if (
          obstacleMode &&
          validateCoordinates(e.latlng.lat, e.latlng.lng)
        ) {
          setObstacles([...obstacles, [e.latlng.lat, e.latlng.lng]]);
        }
      },
    });

    useEffect(() => {
      setMap(map);
    }, [map]);

    return null;
  };

  const handleRemoveMarker = (idx) => {
    const updatedMarkers = markers.filter((_, i) => i !== idx);
    setMarkers(updatedMarkers);
    setRoute([]);
  };

  return (
    <MapContainer
      center={[49.8397, 24.0297]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler />

      {markers.map((position, idx) => (
        <Marker
          key={idx}
          position={position}
          icon={customIcon}
          eventHandlers={{
            click: () => handleRemoveMarker(idx),
          }}
        />
      ))}

      {route.length > 0 && (
        <>
          <Polyline positions={route} color="#955ADE" />
          {route.map((pos, idx) => (
            <CircleMarker
              key={`route-node-${idx}`}
              center={pos}
              radius={5}
              pathOptions={{
                color: "#955ADE",
                fillColor: "#955ADE",
                fillOpacity: 1,
              }}
            />
          ))}
        </>
      )}

      {obstacles.map((pos, idx) => (
        <Marker key={`obstacle-${idx}`} position={pos} icon={obstacleIcon} />
      ))}
    </MapContainer>
  );
};

export default MapComponent;

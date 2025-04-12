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

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapComponent = ({
  route,
  onAddObstacle,
  obstacleMode,
  onMarkersChange,
  markers,
  obstacles,
  onRouteChange,
}) => {
  const obstacleIcon = L.divIcon({
    html: `<div style="width: 12px; height: 12px; background: crimson; transform: rotate(45deg); border-radius: 2px;"></div>`,
    className: "",
    iconSize: [12, 12],
  });

  const validateMarker = (marker) => {
    const lat = marker.lat;
    const lng = marker.lng;
    if (isNaN(lat) || lat < 44.38 || lat > 52.38) {
      return false;
    }
    if (isNaN(lng) || lng < 22.14 || lng > 40.23) {
      return false;
    }
    return true;
  };
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (!obstacleMode && markers.length < 2 && validateMarker(e.latlng)) {
          const newMarkers = [...markers, [e.latlng.lat, e.latlng.lng]];
          onMarkersChange(newMarkers);
        } else if (obstacleMode) {
          onAddObstacle([e.latlng.lat, e.latlng.lng]);
        }
      },
    });
    return null;
  };

  const handleRemoveMarker = (idx) => {
    const updatedMarkers = markers.filter((_, i) => i !== idx);
    onMarkersChange(updatedMarkers);
    onRouteChange([]);
  };

  return (
    <MapContainer
      center={[49.8397, 24.0297]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
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

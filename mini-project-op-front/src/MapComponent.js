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
}) => {
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

  // Remove marker on right-click
  const handleRightClick = (idx) => {
    const updatedMarkers = markers.filter((_, i) => i !== idx);
    onMarkersChange(updatedMarkers); // Notify parent of marker changes
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
            contextmenu: () => handleRightClick(idx),
          }}
        />
      ))}

      {route.length > 0 && <Polyline positions={route} color="#955ADE" />}

      {obstacleMode &&
        route.map((pos, idx) => (
          <CircleMarker key={idx} center={pos} radius={2} color="royalblue" />
        ))}
    </MapContainer>
  );
};

export default MapComponent;

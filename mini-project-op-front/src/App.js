import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import MapPage from "./MapPage";
import "./App.css";
import "./media.css";
import { MapProvider } from "./MapContext";

function App() {
  return (
    <MapProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </Router>
    </MapProvider>
  );
}

export default App;

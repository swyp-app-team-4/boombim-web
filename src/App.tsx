import { Routes, Route, useLocation } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Map from "./pages/Map";
import "./App.css";
import OauthFinish from "./pages/OauthFinish";

export default function App() {
  const location = useLocation();
  const isMap =
    location.pathname.startsWith("/map") || location.pathname === "/";
  return (
    <div className="app-root">
      <main
        className={isMap ? undefined : "container py-4"}
        style={isMap ? { padding: 0, margin: 0 } : undefined}
      >
        <Routes>
          <Route path="/" element={<Map />} />
          <Route path="/map" element={<Map />} />
          <Route path="/oauth/finish" element={<OauthFinish />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

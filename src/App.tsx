import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import TopNav from "./components/TopNav";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Map from "./pages/Map";
import OauthFinish from "./pages/OauthFinish";
import "./App.css";

export default function App() {
  const location = useLocation();
  const isMap = location.pathname.startsWith("/map");

  return (
    <AuthProvider>
      <div className="app-root">
        <TopNav />
        <main
          className={isMap ? undefined : "container py-4"}
          style={
            isMap
              ? { padding: 0, margin: 0, marginTop: "64px" }
              : { paddingTop: "64px" }
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/oauth/finish" element={<OauthFinish />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

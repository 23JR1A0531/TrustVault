import { useEffect, useState } from "react";
import { checkBackendHealth } from "./api";
import "./App.css";

function App() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        setStatus(
          data.status === "ok" && data.database === "connected"
            ? "Backend and database connected"
            : "Service unavailable"
        );
      })
      .catch(() => setStatus("Backend connection failed"));
  }, []);

  return (
    <main>
      <h1>TrustVault</h1>
      <p>Secure Document Sharing Platform</p>
      <div className="status">{status}</div>
    </main>
  );
}

export default App;
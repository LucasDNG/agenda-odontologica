import { StrictMode } from "react";
import {
  createRoot,
} from "react-dom/client";

import "./index.css";

import App from "./App.jsx";
import TurnosApp from "./TurnosApp.jsx";

const pathname =
  window.location.pathname;

const isPatientApp =
  pathname === "/turnos" ||
  pathname.startsWith(
    "/turnos/",
  );

createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    {isPatientApp ? (
      <TurnosApp />
    ) : (
      <App />
    )}
  </StrictMode>,
);
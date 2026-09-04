import { StrictMode } from "react";
import {
  createRoot,
} from "react-dom/client";

import "./index.css";

import App from "./App.jsx";
import TurnosApp from "./TurnosApp.jsx";

const pathname =
  window.location.pathname;

const isDentistApp =
  pathname === "/odontologo" ||
  pathname.startsWith(
    "/odontologo/",
  );

createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    {isDentistApp ? (
      <App />
    ) : (
      <TurnosApp />
    )}
  </StrictMode>,
);
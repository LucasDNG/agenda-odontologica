import { StrictMode } from "react";
import {
  createRoot,
} from "react-dom/client";

import "./index.css";

import App from "./App.jsx";
import TurnosApp from "./TurnosApp.jsx";
import "./design.css";

const pathname =
  window.location.pathname;

const isDentistApp =
  pathname === "/odontologo" ||
  pathname.startsWith(
    "/odontologo/",
  );

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {});
  });
}

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
import {
  useEffect,
} from "react";

import BrandMark from "./BrandMark";
import InstallOffer from "./InstallOffer";

function InstallPanel() {
  useEffect(() => {
    const standalone =
      window.matchMedia(
        "(display-mode: standalone)",
      ).matches ||
      window.navigator.standalone ===
        true;

    if (standalone) {
      window.location.replace(
        "/odontologo",
      );
    }
  }, []);

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-identity">
          <BrandMark className="login-mark" />

          <h1>
            Panel del consultorio
          </h1>

          <p>
            Instalá esta aplicación en el celular.
            Abre directo el panel.
          </p>
        </div>

        <InstallOffer variant="panel" />
      </section>
    </main>
  );
}

export default InstallPanel;

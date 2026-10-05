import {
  useEffect,
  useState,
} from "react";

const isStandalone = () =>
  window.matchMedia(
    "(display-mode: standalone)",
  ).matches ||
  window.navigator.standalone ===
    true;

function InstallOffer({
  variant = "patient",
}) {
  const [promptEvent, setPromptEvent] =
    useState(null);

  const [hidden, setHidden] =
    useState(isStandalone);

  const [iosHint, setIosHint] =
    useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setHidden(true);
      return;
    }

    const onPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onPrompt,
    );

    const userAgent =
      window.navigator.userAgent ||
      "";

    setIosHint(
      /iphone|ipad|ipod/i.test(
        userAgent,
      ),
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onPrompt,
      );
    };
  }, []);

  if (hidden) {
    return null;
  }

  const install = async () => {
    if (!promptEvent) {
      return;
    }

    promptEvent.prompt();

    const choice =
      await promptEvent.userChoice;

    setPromptEvent(null);

    if (choice.outcome === "accepted") {
      setHidden(true);
    }
  };

  const isPanel =
    variant === "panel";

  return (
    <div
      className={
        isPanel
          ? "install-offer install-offer-panel"
          : "install-offer"
      }
    >
      {promptEvent ? (
        <button
          type="button"
          className={
            isPanel
              ? "patient-primary-button"
              : "install-offer-button"
          }
          onClick={install}
        >
          {isPanel
            ? "Instalar panel"
            : "Instalar la aplicación"}
        </button>
      ) : (
        <p>
          {iosHint
            ? "Tocá Compartir y después Agregar a inicio."
            : "Abrí el menú del navegador y elegí Agregar a la pantalla principal."}
        </p>
      )}
    </div>
  );
}

export default InstallOffer;

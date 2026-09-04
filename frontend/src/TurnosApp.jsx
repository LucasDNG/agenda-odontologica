import {
  useEffect,
  useState,
} from "react";

import ReservaTurno from "./ReservaTurno";
import "./TurnosApp.css";

const API_URL =
  "http://localhost:3000/api";

const formatTime = (time) => {
  if (!time) return "";

  return String(time).slice(0, 5);
};

function TurnosApp() {
  const [user, setUser] =
    useState(null);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [mode, setMode] =
    useState("signin");

  const [name, setName] =
    useState("");

  const [lastname, setLastname] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [authError, setAuthError] =
    useState("");

  const [loadingAuth, setLoadingAuth] =
    useState(false);

  const [
    upcomingAppointments,
    setUpcomingAppointments,
  ] = useState([]);

  const [history, setHistory] =
    useState([]);

  const [
    loadingAppointments,
    setLoadingAppointments,
  ] = useState(false);

  const [
    appointmentError,
    setAppointmentError,
  ] = useState("");

  const [section, setSection] =
    useState("booking");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          `${API_URL}/profile`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (
          data.user?.role ===
          "patient"
        ) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(
          "Error comprobando sesión:",
          error,
        );
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (
      !user ||
      user.role !== "patient"
    ) {
      return;
    }

    loadAppointments();
  }, [user]);

  const clearAuthForm = () => {
    setName("");
    setLastname("");
    setPhone("");
    setEmail("");
    setPassword("");
    setAuthError("");
  };

  const changeMode = (
    nextMode,
  ) => {
    setMode(nextMode);
    clearAuthForm();
  };

  const handleSignIn = async (
    event,
  ) => {
    event.preventDefault();

    setLoadingAuth(true);
    setAuthError("");

    try {
      const response = await fetch(
        `${API_URL}/signin`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudo iniciar sesión",
        );
      }

      if (
        data.user?.role !==
        "patient"
      ) {
        await fetch(
          `${API_URL}/signout`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        throw new Error(
          "Este acceso es exclusivo para pacientes.",
        );
      }

      setUser(data.user);
      clearAuthForm();
    } catch (error) {
      console.error(error);

      setAuthError(
        error.message,
      );
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignUp = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !lastname.trim() ||
      !email.trim() ||
      !password
    ) {
      setAuthError(
        "Completá nombre, apellido, email y contraseña.",
      );

      return;
    }

    if (password.length < 6) {
      setAuthError(
        "La contraseña debe tener al menos 6 caracteres.",
      );

      return;
    }

    setLoadingAuth(true);
    setAuthError("");

    try {
      const response = await fetch(
        `${API_URL}/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: name.trim(),
            lastname:
              lastname.trim(),
            email:
              email
                .trim()
                .toLowerCase(),
            password,
            phone:
              phone.trim() ||
              null,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudo crear la cuenta",
        );
      }

      setUser(data.user);
      clearAuthForm();
    } catch (error) {
      console.error(error);

      setAuthError(
        error.message,
      );
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(
        `${API_URL}/signout`,
        {
          method: "POST",
          credentials: "include",
        },
      );
    } catch (error) {
      console.error(error);
    }

    setUser(null);
    setUpcomingAppointments([]);
    setHistory([]);
    setSection("booking");
  };

  const loadAppointments =
    async () => {
      setLoadingAppointments(
        true,
      );

      setAppointmentError("");

      try {
        const response = await fetch(
          `${API_URL}/appointments`,
          {
            credentials: "include",
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudieron cargar tus turnos",
          );
        }

        setUpcomingAppointments(
          data.upcomingAppointments ||
            [],
        );

        setHistory(
          data.history || [],
        );
      } catch (error) {
        console.error(error);

        setAppointmentError(
          error.message,
        );
      } finally {
        setLoadingAppointments(
          false,
        );
      }
    };

  const handleAppointmentCreated =
    async () => {
      await loadAppointments();
      setSection("appointments");
    };

  if (checkingSession) {
    return (
      <main className="patient-loading-page">
        <div className="patient-loading-card">
          <span>🦷</span>
          <p>
            Cargando agenda...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="patient-auth-page">
        <section className="patient-auth-card">
          <div className="patient-auth-brand">
            <div className="patient-auth-icon">
              🦷
            </div>

            <div>
              <p className="patient-eyebrow">
                Agenda odontológica
              </p>

              <h1>
                Turnos online
              </h1>

              <p>
                Reservá y consultá tus
                próximos turnos.
              </p>
            </div>
          </div>

          <div className="patient-auth-tabs">
            <button
              type="button"
              className={
                mode === "signin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeMode("signin")
              }
            >
              Ingresar
            </button>

            <button
              type="button"
              className={
                mode === "signup"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeMode("signup")
              }
            >
              Crear cuenta
            </button>
          </div>

          {mode === "signin" ? (
            <form
              className="patient-auth-form"
              onSubmit={
                handleSignIn
              }
            >
              <label>
                Email

                <input
                  type="email"
                  value={email}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Contraseña

                <input
                  type="password"
                  value={password}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  required
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              {authError && (
                <p className="patient-auth-error">
                  {authError}
                </p>
              )}

              <button
                className="patient-primary-button"
                type="submit"
                disabled={
                  loadingAuth
                }
              >
                {loadingAuth
                  ? "Ingresando..."
                  : "Ingresar"}
              </button>
            </form>
          ) : (
            <form
              className="patient-auth-form"
              onSubmit={
                handleSignUp
              }
            >
              <div className="patient-form-row">
                <label>
                  Nombre

                  <input
                    type="text"
                    value={name}
                    required
                    onChange={(
                      event,
                    ) =>
                      setName(
                        event.target
                          .value,
                      )
                    }
                  />
                </label>

                <label>
                  Apellido

                  <input
                    type="text"
                    value={
                      lastname
                    }
                    required
                    onChange={(
                      event,
                    ) =>
                      setLastname(
                        event.target
                          .value,
                      )
                    }
                  />
                </label>
              </div>

              <label>
                Teléfono

                <input
                  type="tel"
                  value={phone}
                  placeholder="Opcional"
                  autoComplete="tel"
                  onChange={(
                    event,
                  ) =>
                    setPhone(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  required
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Contraseña

                <input
                  type="password"
                  value={password}
                  minLength="6"
                  autoComplete="new-password"
                  required
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <p className="patient-password-help">
                Mínimo 6 caracteres.
              </p>

              {authError && (
                <p className="patient-auth-error">
                  {authError}
                </p>
              )}

              <button
                className="patient-primary-button"
                type="submit"
                disabled={
                  loadingAuth
                }
              >
                {loadingAuth
                  ? "Creando cuenta..."
                  : "Crear cuenta"}
              </button>
            </form>
          )}

          <a
            className="patient-admin-link"
            href="/"
          >
            Soy profesional
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="patient-app">
      <header className="patient-header">
        <div className="patient-header-brand">
          <span>🦷</span>

          <div>
            <p className="patient-eyebrow">
              Consultorio odontológico
            </p>

            <strong>
              Turnos online
            </strong>
          </div>
        </div>

        <div className="patient-user-area">
          <span>
            Hola, {user.name}
          </span>

          <button
            type="button"
            onClick={handleLogout}
          >
            Salir
          </button>
        </div>
      </header>

      <nav className="patient-nav">
        <button
          type="button"
          className={
            section === "booking"
              ? "active"
              : ""
          }
          onClick={() =>
            setSection("booking")
          }
        >
          + Reservar turno
        </button>

        <button
          type="button"
          className={
            section ===
            "appointments"
              ? "active"
              : ""
          }
          onClick={() => {
            setSection(
              "appointments",
            );

            loadAppointments();
          }}
        >
          Mis turnos
        </button>
      </nav>

      {section === "booking" && (
        <ReservaTurno
          onAppointmentCreated={
            handleAppointmentCreated
          }
        />
      )}

      {section ===
        "appointments" && (
        <section className="patient-appointments-page">
          <div className="patient-page-heading">
            <p className="patient-eyebrow">
              Mi agenda
            </p>

            <h1>
              Mis turnos
            </h1>

            <p>
              Consultá tus próximos
              turnos y tu historial.
            </p>
          </div>

          {appointmentError && (
            <p className="patient-appointments-error">
              {appointmentError}
            </p>
          )}

          {loadingAppointments ? (
            <div className="patient-empty-state">
              Cargando turnos...
            </div>
          ) : (
            <>
              <section className="patient-appointment-section">
                <div className="patient-section-heading">
                  <h2>
                    Próximos turnos
                  </h2>

                  <span>
                    {
                      upcomingAppointments.length
                    }
                  </span>
                </div>

                {upcomingAppointments.length ===
                0 ? (
                  <div className="patient-empty-state">
                    No tenés próximos
                    turnos.
                  </div>
                ) : (
                  <div className="patient-appointment-list">
                    {upcomingAppointments.map(
                      (
                        appointment,
                      ) => (
                        <article
                          className="patient-appointment-card"
                          key={
                            appointment.id
                          }
                        >
                          <div className="patient-appointment-date">
                            <strong>
                              {
                                appointment.appointment_date
                              }
                            </strong>

                            <span>
                              {formatTime(
                                appointment.start_time,
                              )}
                            </span>
                          </div>

                          <div className="patient-appointment-info">
                            <h3>
                              {
                                appointment.service
                              }
                            </h3>

                            {appointment.professional_name && (
                              <p>
                                🦷{" "}
                                {
                                  appointment.professional_name
                                }{" "}
                                {
                                  appointment.professional_lastname
                                }
                              </p>
                            )}

                            <span>
                              Duración:{" "}
                              {
                                appointment.duration_minutes
                              }{" "}
                              min
                            </span>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </section>

              <section className="patient-appointment-section history">
                <div className="patient-section-heading">
                  <h2>
                    Historial
                  </h2>

                  <span>
                    {
                      history.length
                    }
                  </span>
                </div>

                {history.length ===
                0 ? (
                  <div className="patient-empty-state">
                    Todavía no hay
                    historial.
                  </div>
                ) : (
                  <div className="patient-appointment-list">
                    {history.map(
                      (
                        appointment,
                      ) => (
                        <article
                          className="patient-appointment-card history"
                          key={
                            appointment.id
                          }
                        >
                          <div className="patient-appointment-date">
                            <strong>
                              {
                                appointment.appointment_date
                              }
                            </strong>

                            <span>
                              {formatTime(
                                appointment.start_time,
                              )}
                            </span>
                          </div>

                          <div className="patient-appointment-info">
                            <h3>
                              {
                                appointment.service
                              }
                            </h3>

                            {appointment.professional_name && (
                              <p>
                                🦷{" "}
                                {
                                  appointment.professional_name
                                }{" "}
                                {
                                  appointment.professional_lastname
                                }
                              </p>
                            )}

                            <span>
                              Estado:{" "}
                              {
                                appointment.status
                              }
                            </span>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default TurnosApp;
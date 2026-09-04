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

const formatDate = (date) => {
  if (!date) return "";

  const value =
    String(date).slice(0, 10);

  const [
    year,
    month,
    day,
  ] = value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return date;
  }

  return `${day}/${month}/${year}`;
};

const getStatusLabel = (
  status,
) => {
  const labels = {
    scheduled: "Programado",
    confirmed: "Confirmado",
    completed: "Atendido",
    absent: "Ausente",
    cancelled: "Cancelado",
  };

  return (
    labels[status] ||
    status
  );
};

function TurnosApp() {
  const [user, setUser] =
    useState(null);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [mode, setMode] =
    useState("signin");

  const [name, setName] =
    useState("");

  const [
    lastname,
    setLastname,
  ] = useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    authError,
    setAuthError,
  ] = useState("");

  const [
    loadingAuth,
    setLoadingAuth,
  ] = useState(false);

  const [
    upcomingAppointments,
    setUpcomingAppointments,
  ] = useState([]);

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    loadingAppointments,
    setLoadingAppointments,
  ] = useState(false);

  const [
    appointmentError,
    setAppointmentError,
  ] = useState("");

  const [
    appointmentMessage,
    setAppointmentMessage,
  ] = useState("");

  const [
    cancellingAppointmentId,
    setCancellingAppointmentId,
  ] = useState(null);

  const [
    appointmentToCancel,
    setAppointmentToCancel,
  ] = useState(null);

  const [
    section,
    setSection,
  ] = useState("booking");

  useEffect(() => {
    const checkSession =
      async () => {
        try {
          const response =
            await fetch(
              `${API_URL}/profile`,
              {
                credentials:
                  "include",
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
          setCheckingSession(
            false,
          );
        }
      };

    checkSession();
  }, []);

  useEffect(() => {
    if (
      !user ||
      user.role !==
        "patient"
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

  const handleSignIn =
    async (event) => {
      event.preventDefault();

      setLoadingAuth(true);
      setAuthError("");

      try {
        const response =
          await fetch(
            `${API_URL}/signin`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  email:
                    email
                      .trim()
                      .toLowerCase(),

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
              credentials:
                "include",
            },
          );

          throw new Error(
            "Este acceso es exclusivo para pacientes.",
          );
        }

        setUser(data.user);
        clearAuthForm();
        setSection(
          "booking",
        );
      } catch (error) {
        console.error(error);

        setAuthError(
          error.message,
        );
      } finally {
        setLoadingAuth(
          false,
        );
      }
    };

  const handleSignUp =
    async (event) => {
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

      if (
        password.length < 6
      ) {
        setAuthError(
          "La contraseña debe tener al menos 6 caracteres.",
        );

        return;
      }

      setLoadingAuth(true);
      setAuthError("");

      try {
        const response =
          await fetch(
            `${API_URL}/signup`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  name:
                    name.trim(),

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

        setSection(
          "booking",
        );
      } catch (error) {
        console.error(error);

        setAuthError(
          error.message,
        );
      } finally {
        setLoadingAuth(
          false,
        );
      }
    };

  const handleLogout =
    async () => {
      try {
        await fetch(
          `${API_URL}/signout`,
          {
            method: "POST",
            credentials:
              "include",
          },
        );
      } catch (error) {
        console.error(error);
      }

      setUser(null);

      setUpcomingAppointments(
        [],
      );

      setHistory([]);

      setAppointmentMessage(
        "",
      );

      setAppointmentError(
        "",
      );

      setAppointmentToCancel(
        null,
      );

      setSection(
        "booking",
      );
    };

  const loadAppointments =
    async () => {
      setLoadingAppointments(
        true,
      );

      setAppointmentError(
        "",
      );

      try {
        const response =
          await fetch(
            `${API_URL}/appointments`,
            {
              credentials:
                "include",
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
          data.history ||
            [],
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
      setAppointmentMessage(
        "Turno reservado correctamente.",
      );

      await loadAppointments();

      setSection(
        "appointments",
      );
    };

  const openCancelModal = (
    appointment,
  ) => {
    setAppointmentError(
      "",
    );

    setAppointmentMessage(
      "",
    );

    setAppointmentToCancel(
      appointment,
    );
  };

  const closeCancelModal =
    () => {
      if (
        cancellingAppointmentId
      ) {
        return;
      }

      setAppointmentToCancel(
        null,
      );
    };

  const confirmCancellation =
    async () => {
      if (
        !appointmentToCancel
      ) {
        return;
      }

      const appointmentId =
        appointmentToCancel.id;

      setCancellingAppointmentId(
        appointmentId,
      );

      setAppointmentError(
        "",
      );

      setAppointmentMessage(
        "",
      );

      try {
        const response =
          await fetch(
            `${API_URL}/appointments/${appointmentId}/cancel`,
            {
              method: "PATCH",

              credentials:
                "include",
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo cancelar el turno",
          );
        }

        setAppointmentToCancel(
          null,
        );

        setAppointmentMessage(
          "Turno cancelado correctamente. El horario volvió a quedar disponible.",
        );

        await loadAppointments();
      } catch (error) {
        console.error(error);

        setAppointmentError(
          error.message,
        );
      } finally {
        setCancellingAppointmentId(
          null,
        );
      }
    };

  const goToBooking = () => {
    setAppointmentMessage(
      "",
    );

    setAppointmentError(
      "",
    );

    setSection(
      "booking",
    );
  };

  const goToAppointments =
    async () => {
      setSection(
        "appointments",
      );

      setAppointmentMessage(
        "",
      );

      await loadAppointments();
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
                turnos desde acá.
              </p>
            </div>
          </div>

          <div className="patient-auth-tabs">
            <button
              type="button"
              className={
                mode ===
                "signin"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeMode(
                  "signin",
                )
              }
            >
              Ingresar
            </button>

            <button
              type="button"
              className={
                mode ===
                "signup"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeMode(
                  "signup",
                )
              }
            >
              Crear cuenta
            </button>
          </div>

          {mode ===
          "signin" ? (
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
                  value={
                    email
                  }
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Contraseña

                <input
                  type="password"
                  value={
                    password
                  }
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  required
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event
                        .target
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
                    value={
                      name
                    }
                    autoComplete="given-name"
                    required
                    onChange={(
                      event,
                    ) =>
                      setName(
                        event
                          .target
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
                    autoComplete="family-name"
                    required
                    onChange={(
                      event,
                    ) =>
                      setLastname(
                        event
                          .target
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
                  value={
                    phone
                  }
                  placeholder="Ej: 11 1234 5678"
                  autoComplete="tel"
                  onChange={(
                    event,
                  ) =>
                    setPhone(
                      event
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  value={
                    email
                  }
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Contraseña

                <input
                  type="password"
                  value={
                    password
                  }
                  minLength="6"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event
                        .target
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
                  ? "Creando cuenta..."
                  : "Crear cuenta"}
              </button>
            </form>
          )}

          <div className="patient-professional-access">
            <span>
              ¿Sos odontólogo?
            </span>

            <a href="/odontologo">
              Ingresar al panel profesional
            </a>
          </div>
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
              Agenda odontológica
            </p>

            <strong>
              Turnos online
            </strong>
          </div>
        </div>

        <div className="patient-user-area">
          <div className="patient-user-name">
            <small>
              Paciente
            </small>

            <span>
              {user.name}{" "}
              {user.lastname}
            </span>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
          >
            Salir
          </button>
        </div>
      </header>

      <nav className="patient-nav">
        <button
          type="button"
          className={
            section ===
            "booking"
              ? "active"
              : ""
          }
          onClick={
            goToBooking
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
          onClick={
            goToAppointments
          }
        >
          Mis turnos

          {upcomingAppointments.length >
            0 && (
            <span className="patient-nav-count">
              {
                upcomingAppointments.length
              }
            </span>
          )}
        </button>
      </nav>

      {section ===
        "booking" && (
        <ReservaTurno
          onAppointmentCreated={
            handleAppointmentCreated
          }
        />
      )}

      {section ===
        "appointments" && (
        <section className="patient-appointments-page">
          <div className="patient-page-heading patient-page-heading-row">
            <div>
              <p className="patient-eyebrow">
                Mi agenda
              </p>

              <h1>
                Mis turnos
              </h1>

              <p>
                Revisá tus próximos
                turnos y tu historial.
              </p>
            </div>

            <button
              type="button"
              className="patient-refresh-button"
              onClick={
                loadAppointments
              }
              disabled={
                loadingAppointments
              }
            >
              {loadingAppointments
                ? "Actualizando..."
                : "Actualizar"}
            </button>
          </div>

          {appointmentMessage && (
            <p className="patient-appointments-success">
              {
                appointmentMessage
              }
            </p>
          )}

          {appointmentError && (
            <p className="patient-appointments-error">
              {
                appointmentError
              }
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
                    <strong>
                      No tenés próximos
                      turnos.
                    </strong>

                    <p>
                      Podés reservar uno
                      desde la agenda
                      online.
                    </p>

                    <button
                      type="button"
                      className="patient-empty-action"
                      onClick={
                        goToBooking
                      }
                    >
                      Reservar turno
                    </button>
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
                              {formatDate(
                                appointment.appointment_date,
                              )}
                            </strong>

                            <span>
                              {formatTime(
                                appointment.start_time,
                              )}
                            </span>
                          </div>

                          <div className="patient-appointment-info">
                            <div className="patient-appointment-title-row">
                              <h3>
                                {
                                  appointment.service
                                }
                              </h3>

                              <span
                                className={`patient-status ${appointment.status}`}
                              >
                                {getStatusLabel(
                                  appointment.status,
                                )}
                              </span>
                            </div>

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

                            {appointment.professional_specialty && (
                              <p>
                                {
                                  appointment.professional_specialty
                                }
                              </p>
                            )}

                            {appointment.duration_minutes && (
                              <span>
                                Duración:{" "}
                                {
                                  appointment.duration_minutes
                                }{" "}
                                min
                              </span>
                            )}

                            {appointment.notes && (
                              <div className="patient-appointment-notes">
                                {
                                  appointment.notes
                                }
                              </div>
                            )}

                            <div className="patient-appointment-actions">
                              <button
                                type="button"
                                className="patient-cancel-button"
                                disabled={
                                  cancellingAppointmentId ===
                                  appointment.id
                                }
                                onClick={() =>
                                  openCancelModal(
                                    appointment,
                                  )
                                }
                              >
                                Cancelar turno
                              </button>
                            </div>
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
                    turnos anteriores.
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
                              {formatDate(
                                appointment.appointment_date,
                              )}
                            </strong>

                            <span>
                              {formatTime(
                                appointment.start_time,
                              )}
                            </span>
                          </div>

                          <div className="patient-appointment-info">
                            <div className="patient-appointment-title-row">
                              <h3>
                                {
                                  appointment.service
                                }
                              </h3>

                              <span
                                className={`patient-status ${appointment.status}`}
                              >
                                {getStatusLabel(
                                  appointment.status,
                                )}
                              </span>
                            </div>

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

                            {appointment.professional_specialty && (
                              <p>
                                {
                                  appointment.professional_specialty
                                }
                              </p>
                            )}
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

      {appointmentToCancel && (
        <div
          className="patient-modal-overlay"
          onMouseDown={
            closeCancelModal
          }
        >
          <section
            className="patient-cancel-modal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="patient-cancel-modal-icon">
              !
            </div>

            <h2>
              Cancelar turno
            </h2>

            <p>
              Vas a cancelar tu turno de{" "}
              <strong>
                {
                  appointmentToCancel.service
                }
              </strong>
              .
            </p>

            <div className="patient-cancel-summary">
              <span>
                {formatDate(
                  appointmentToCancel.appointment_date,
                )}
              </span>

              <strong>
                {formatTime(
                  appointmentToCancel.start_time,
                )}
              </strong>

              {appointmentToCancel.professional_name && (
                <span>
                  {
                    appointmentToCancel.professional_name
                  }{" "}
                  {
                    appointmentToCancel.professional_lastname
                  }
                </span>
              )}
            </div>

            <p className="patient-cancel-warning">
              Al confirmar, el horario
              quedará disponible para
              otro paciente.
            </p>

            <div className="patient-cancel-modal-actions">
              <button
                type="button"
                className="patient-modal-secondary"
                onClick={
                  closeCancelModal
                }
                disabled={
                  Boolean(
                    cancellingAppointmentId,
                  )
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="patient-modal-danger"
                onClick={
                  confirmCancellation
                }
                disabled={
                  Boolean(
                    cancellingAppointmentId,
                  )
                }
              >
                {cancellingAppointmentId
                  ? "Cancelando..."
                  : "Sí, cancelar turno"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default TurnosApp;
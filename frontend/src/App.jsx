import {
  useEffect,
  useState,
} from "react";

import AgendaView from "./AgendaView";
import CancelledAppointments from "./CancelledAppointments";
import Configuration from "./Configuration";
import OverbookedAppointment from "./OverbookedAppointment";
import "./App.css";

const API_URL =
  "http://localhost:3000/api";

function App() {
  const [user, setUser] =
    useState(null);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    loginError,
    setLoginError,
  ] = useState("");

  const [
    loadingLogin,
    setLoadingLogin,
  ] = useState(false);

  const [section, setSection] =
    useState("agenda");

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    loadingAppointments,
    setLoadingAppointments,
  ] = useState(false);

  const [
    appointmentMessage,
    setAppointmentMessage,
  ] = useState("");

  const [
    updatingAppointmentId,
    setUpdatingAppointmentId,
  ] = useState(null);

  const [
    showOverbookedModal,
    setShowOverbookedModal,
  ] = useState(false);

  const [
    consultations,
    setConsultations,
  ] = useState([]);

  const [
    consultationStatus,
    setConsultationStatus,
  ] = useState("pending");

  const [
    loadingConsultations,
    setLoadingConsultations,
  ] = useState(false);

  const [
    replyTexts,
    setReplyTexts,
  ] = useState({});

  const [
    sendingId,
    setSendingId,
  ] = useState(null);

  const [
    consultationMessage,
    setConsultationMessage,
  ] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (
      !user ||
      user.role !== "dentist"
    ) {
      return;
    }

    if (
      section === "agenda" ||
      section === "cancelled"
    ) {
      loadAppointments();
    }

    if (
      section ===
      "consultations"
    ) {
      loadConsultations(
        consultationStatus,
      );
    }
  }, [
    user,
    section,
    consultationStatus,
  ]);

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
          "dentist"
        ) {
          setUser(
            data.user,
          );
        }
      } catch (error) {
        console.error(
          "Error comprobando sesión:",
          error,
        );
      }
    };

  const handleLogin =
    async (event) => {
      event.preventDefault();

      setLoadingLogin(
        true,
      );

      setLoginError("");

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
                  email,
                  password,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          setLoginError(
            data.message ||
              "No se pudo iniciar sesión",
          );

          return;
        }

        if (
          data.user.role !==
          "dentist"
        ) {
          setLoginError(
            "Este panel es exclusivo para odontólogos",
          );

          return;
        }

        setUser(
          data.user,
        );

        setEmail("");
        setPassword("");
      } catch (error) {
        console.error(
          error,
        );

        setLoginError(
          "No se pudo conectar con el servidor",
        );
      } finally {
        setLoadingLogin(
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
        console.error(
          error,
        );
      }

      setUser(null);
      setAppointments([]);
      setConsultations([]);

      setShowOverbookedModal(
        false,
      );
    };

  const loadAppointments =
    async () => {
      setLoadingAppointments(
        true,
      );

      setAppointmentMessage(
        "",
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/appointments`,
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
              "Error obteniendo turnos",
          );
        }

        setAppointments(
          data.appointments ||
            [],
        );
      } catch (error) {
        console.error(
          error,
        );

        setAppointmentMessage(
          "No se pudieron cargar los turnos.",
        );
      } finally {
        setLoadingAppointments(
          false,
        );
      }
    };

  const handleOverbookedCreated =
    async () => {
      setAppointmentMessage(
        "Sobreturno creado correctamente.",
      );

      await loadAppointments();
    };

  const updateAppointmentStatus =
    async (
      id,
      status,
    ) => {
      setUpdatingAppointmentId(
        id,
      );

      setAppointmentMessage(
        "",
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/appointments/${id}/status`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  status,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo actualizar el turno",
          );
        }

        await loadAppointments();
      } catch (error) {
        console.error(
          error,
        );

        setAppointmentMessage(
          error.message,
        );
      } finally {
        setUpdatingAppointmentId(
          null,
        );
      }
    };

  const loadConsultations =
    async (
      selectedStatus,
    ) => {
      setLoadingConsultations(
        true,
      );

      setConsultationMessage(
        "",
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/whatsapp-consultations?status=${selectedStatus}`,
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
              "Error obteniendo consultas",
          );
        }

        setConsultations(
          data.consultations ||
            [],
        );
      } catch (error) {
        console.error(
          error,
        );

        setConsultationMessage(
          "No se pudieron cargar las consultas.",
        );
      } finally {
        setLoadingConsultations(
          false,
        );
      }
    };

  const handleReplyChange = (
    id,
    value,
  ) => {
    setReplyTexts(
      (previous) => ({
        ...previous,
        [id]: value,
      }),
    );
  };

  const handleReply =
    async (
      consultationId,
    ) => {
      const reply =
        replyTexts[
          consultationId
        ]?.trim();

      if (!reply) {
        setConsultationMessage(
          "Escribí una respuesta antes de enviar.",
        );

        return;
      }

      setSendingId(
        consultationId,
      );

      setConsultationMessage(
        "",
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/whatsapp-consultations/${consultationId}/reply`,
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
                  message:
                    reply,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo enviar la respuesta",
          );
        }

        setReplyTexts(
          (previous) => ({
            ...previous,

            [consultationId]:
              "",
          }),
        );

        setConsultationMessage(
          "Respuesta enviada correctamente.",
        );

        await loadConsultations(
          consultationStatus,
        );
      } catch (error) {
        console.error(
          error,
        );

        setConsultationMessage(
          error.message,
        );
      } finally {
        setSendingId(
          null,
        );
      }
    };

  const formatWhatsappDate = (
    date,
  ) => {
    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "es-AR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(
      new Date(date),
    );
  };

  if (!user) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="brand">
            <span className="brand-icon">
              🦷
            </span>

            <div>
              <h1>
                Agenda Odontológica
              </h1>

              <p>
                Panel del consultorio
              </p>
            </div>
          </div>

          <form
            onSubmit={
              handleLogin
            }
            className="login-form"
          >
            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={(
                  event,
                ) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
                placeholder="Email"
                required
              />
            </label>

            <label>
              Contraseña

              <input
                type="password"
                value={
                  password
                }
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Contraseña"
                required
              />
            </label>

            {loginError && (
              <p className="error-message">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={
                loadingLogin
              }
            >
              {loadingLogin
                ? "Ingresando..."
                : "Ingresar"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">
            Consultorio odontológico
          </p>

          <h1>
            Panel de administración
          </h1>
        </div>

        <div className="user-area">
          <span>
            {user.name}{" "}
            {user.lastname}
          </span>

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Salir
          </button>
        </div>
      </header>

      <nav className="main-nav">
        <button
          className={
            section === "agenda"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setSection(
              "agenda",
            )
          }
        >
          📅 Agenda
        </button>

        <button
          className={
            section ===
            "cancelled"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setSection(
              "cancelled",
            )
          }
        >
          🗂️ Cancelados
        </button>

        <button
          className={
            section ===
            "consultations"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setSection(
              "consultations",
            )
          }
        >
          💬 Consultas
        </button>

        <button
          className={
            section ===
            "configuration"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setSection(
              "configuration",
            )
          }
        >
          ⚙️ Configuración
        </button>
      </nav>

      <section className="content">
        {section ===
          "agenda" && (
          <>
            <AgendaView
              appointments={
                appointments
              }
              loading={
                loadingAppointments
              }
              message={
                appointmentMessage
              }
              updatingAppointmentId={
                updatingAppointmentId
              }
              onUpdateStatus={
                updateAppointmentStatus
              }
              onRefresh={
                loadAppointments
              }
              onCreateOverbooked={() =>
                setShowOverbookedModal(
                  true,
                )
              }
            />

            <OverbookedAppointment
              open={
                showOverbookedModal
              }
              onClose={() =>
                setShowOverbookedModal(
                  false,
                )
              }
              onCreated={
                handleOverbookedCreated
              }
            />
          </>
        )}

        {section ===
          "cancelled" && (
          <CancelledAppointments
            appointments={
              appointments
            }
            onRefresh={
              loadAppointments
            }
          />
        )}

        {section ===
          "consultations" && (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  WhatsApp
                </p>

                <h2>
                  Consultas
                </h2>
              </div>
            </div>

            <div className="tabs">
              <button
                className={
                  consultationStatus ===
                  "pending"
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setConsultationStatus(
                    "pending",
                  )
                }
              >
                Pendientes
              </button>

              <button
                className={
                  consultationStatus ===
                  "answered"
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setConsultationStatus(
                    "answered",
                  )
                }
              >
                Respondidas
              </button>
            </div>

            {consultationMessage && (
              <div className="status-message">
                {
                  consultationMessage
                }
              </div>
            )}

            {loadingConsultations ? (
              <div className="empty-state">
                Cargando consultas...
              </div>
            ) : consultations.length ===
              0 ? (
              <div className="empty-state">
                {consultationStatus ===
                "pending"
                  ? "No hay consultas pendientes."
                  : "No hay consultas respondidas."}
              </div>
            ) : (
              <div className="consultations-list">
                {consultations.map(
                  (
                    consultation,
                  ) => (
                    <article
                      className="consultation-card"
                      key={
                        consultation.id
                      }
                    >
                      <div className="consultation-top">
                        <div>
                          <span className="phone">
                            📱{" "}
                            {
                              consultation.phone
                            }
                          </span>

                          <p className="date">
                            {formatWhatsappDate(
                              consultation.created_at,
                            )}
                          </p>
                        </div>

                        <span
                          className={
                            consultation.status ===
                            "pending"
                              ? "badge pending"
                              : "badge answered"
                          }
                        >
                          {consultation.status ===
                          "pending"
                            ? "Pendiente"
                            : "Respondida"}
                        </span>
                      </div>

                      <div className="patient-message">
                        <p>
                          {
                            consultation.message
                          }
                        </p>
                      </div>

                      {consultation.status ===
                        "pending" && (
                        <div className="reply-area">
                          <textarea
                            rows="4"
                            placeholder="Escribir respuesta para el paciente..."
                            value={
                              replyTexts[
                                consultation
                                  .id
                              ] || ""
                            }
                            onChange={(
                              event,
                            ) =>
                              handleReplyChange(
                                consultation.id,
                                event.target
                                  .value,
                              )
                            }
                          />

                          <button
                            onClick={() =>
                              handleReply(
                                consultation.id,
                              )
                            }
                            disabled={
                              sendingId ===
                              consultation.id
                            }
                          >
                            {sendingId ===
                            consultation.id
                              ? "Enviando..."
                              : "Responder por WhatsApp"}
                          </button>
                        </div>
                      )}

                      {consultation.answered_at && (
                        <p className="answered-date">
                          Respondida:{" "}
                          {formatWhatsappDate(
                            consultation.answered_at,
                          )}
                        </p>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}
          </>
        )}

        {section ===
          "configuration" && (
          <Configuration />
        )}
      </section>
    </main>
  );
}

export default App;
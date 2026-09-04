import {
  useMemo,
  useState,
} from "react";

import "./CancelledAppointments.css";

const API_URL =
  "http://localhost:3000/api";

const formatTime = (
  value,
) =>
  String(
    value || "",
  ).slice(
    0,
    5,
  );

function CancelledAppointments({
  appointments = [],
  onRefresh,
}) {
  const [
    restoringId,
    setRestoringId,
  ] = useState(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const cancelledAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              appointment.status ===
              "cancelled",
          )
          .sort(
            (a, b) => {
              const [
                dayA,
                monthA,
                yearA,
              ] =
                a.appointment_date
                  .split("/")
                  .map(Number);

              const [
                dayB,
                monthB,
                yearB,
              ] =
                b.appointment_date
                  .split("/")
                  .map(Number);

              const dateA =
                new Date(
                  yearA,
                  monthA - 1,
                  dayA,
                );

              const dateB =
                new Date(
                  yearB,
                  monthB - 1,
                  dayB,
                );

              return (
                dateB -
                  dateA ||
                String(
                  b.start_time,
                ).localeCompare(
                  String(
                    a.start_time,
                  ),
                )
              );
            },
          ),
      [
        appointments,
      ],
    );

  const restoreAppointment =
    async (
      appointment,
    ) => {
      const confirmed =
        window.confirm(
          `¿Restaurar el turno de ${appointment.patient_name} ${appointment.patient_lastname} del ${appointment.appointment_date} a las ${formatTime(
            appointment.start_time,
          )}?`,
        );

      if (!confirmed) {
        return;
      }

      setRestoringId(
        appointment.id,
      );

      setMessage("");
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/admin/appointments/${appointment.id}/restore`,
            {
              method:
                "PATCH",

              credentials:
                "include",
            },
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "No se pudo restaurar el turno",
          );
        }

        setMessage(
          data.message ||
            "Turno restaurado correctamente.",
        );

        await onRefresh();
      } catch (
        currentError
      ) {
        console.error(
          currentError,
        );

        setError(
          currentError.message,
        );
      } finally {
        setRestoringId(
          null,
        );
      }
    };

  return (
    <div className="cancelled-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            Historial
          </p>

          <h2>
            Turnos cancelados
          </h2>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={
            onRefresh
          }
        >
          Actualizar
        </button>
      </div>

      <div className="cancelled-info">
        Los turnos cancelados
        permanecen guardados.
        Al restaurarlos se intenta
        primero el horario original,
        luego otro horario libre del
        mismo día y, si no hay
        disponibilidad, se crea un
        sobreturno.
      </div>

      {message && (
        <div className="status-message">
          {message}
        </div>
      )}

      {error && (
        <div className="cancelled-error">
          {error}
        </div>
      )}

      {cancelledAppointments.length ===
      0 ? (
        <div className="empty-state">
          No hay turnos cancelados.
        </div>
      ) : (
        <div className="cancelled-list">
          {cancelledAppointments.map(
            (
              appointment,
            ) => (
              <article
                className="cancelled-card"
                key={
                  appointment.id
                }
              >
                <div className="cancelled-date">
                  <strong>
                    {
                      appointment.appointment_date
                    }
                  </strong>

                  <span>
                    {formatTime(
                      appointment.start_time,
                    )}{" "}
                    a{" "}
                    {formatTime(
                      appointment.end_time,
                    )}
                  </span>

                  {appointment.is_overbooked && (
                    <span className="cancelled-overbooked">
                      SOBRETURNO
                    </span>
                  )}
                </div>

                <div className="cancelled-main">
                  <h3>
                    {
                      appointment.patient_name
                    }{" "}
                    {
                      appointment.patient_lastname
                    }
                  </h3>

                  <p className="cancelled-service">
                    {
                      appointment.service
                    }
                  </p>

                  <p>
                    🦷{" "}
                    {
                      appointment.professional_name
                    }{" "}
                    {
                      appointment.professional_lastname
                    }
                  </p>

                  {appointment.patient_phone && (
                    <p>
                      📱{" "}
                      {
                        appointment.patient_phone
                      }
                    </p>
                  )}

                  {appointment.notes && (
                    <div className="cancelled-notes">
                      Nota:{" "}
                      {
                        appointment.notes
                      }
                    </div>
                  )}
                </div>

                <div className="cancelled-actions">
                  <span className="cancelled-badge">
                    Cancelado
                  </span>

                  <button
                    type="button"
                    className="restore-button"
                    disabled={
                      restoringId ===
                      appointment.id
                    }
                    onClick={() =>
                      restoreAppointment(
                        appointment,
                      )
                    }
                  >
                    {restoringId ===
                    appointment.id
                      ? "Restaurando..."
                      : "Restaurar turno"}
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default CancelledAppointments;
import {
  useEffect,
  useState,
} from "react";

import "./ReprogramAppointment.css";

const API_URL =
  "http://localhost:3000/api";

const displayToInputDate = (
  value,
) => {
  const match =
    value?.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
    );

  if (!match) {
    return "";
  }

  const [
    ,
    day,
    month,
    year,
  ] = match;

  return `${year}-${month}-${day}`;
};

const inputToDisplayDate = (
  value,
) => {
  const match =
    value?.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (!match) {
    return "";
  }

  const [
    ,
    year,
    month,
    day,
  ] = match;

  return `${day}/${month}/${year}`;
};

function ReprogramAppointment({
  appointment,
  onClose,
  onUpdated,
}) {
  const [date, setDate] =
    useState("");

  const [
    startTime,
    setStartTime,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!appointment) {
      return;
    }

    setDate(
      displayToInputDate(
        appointment.appointment_date,
      ),
    );

    setStartTime(
      String(
        appointment.start_time ||
          "",
      ).slice(0, 5),
    );

    setError("");
  }, [appointment]);

  if (!appointment) {
    return null;
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !date ||
        !startTime
      ) {
        setError(
          "Ingresá fecha y horario.",
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/admin/appointments/${appointment.id}/reschedule`,
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
                  date,
                  startTime,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo reprogramar el turno",
          );
        }

        await onUpdated(
          data.appointment,
        );

        onClose();
      } catch (currentError) {
        console.error(
          currentError,
        );

        setError(
          currentError.message,
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div
      className="reprogram-overlay"
      onMouseDown={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <section
        className="reprogram-modal"
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >
        <div className="reprogram-header">
          <div className="reprogram-icon">
            📅
          </div>

          <div>
            <p className="eyebrow">
              Agenda
            </p>

            <h2>
              Reprogramar turno
            </h2>
          </div>
        </div>

        <div className="reprogram-appointment-info">
          <strong>
            {
              appointment.patient_name
            }{" "}
            {
              appointment.patient_lastname
            }
          </strong>

          <span>
            {appointment.service}
          </span>

          <span>
            🦷{" "}
            {
              appointment.professional_name
            }{" "}
            {
              appointment.professional_lastname
            }
          </span>

          {appointment.is_overbooked && (
            <span className="reprogram-overbooked">
              Sobreturno
            </span>
          )}
        </div>

        <div className="reprogram-current">
          <span>
            Turno actual
          </span>

          <strong>
            {
              appointment.appointment_date
            }{" "}
            ·{" "}
            {String(
              appointment.start_time,
            ).slice(0, 5)}
          </strong>
        </div>

        <form
          className="reprogram-form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            Nueva fecha

            <input
              type="date"
              value={date}
              required
              onChange={(
                event,
              ) =>
                setDate(
                  event.target
                    .value,
                )
              }
            />

            {date && (
              <small>
                {inputToDisplayDate(
                  date,
                )}
              </small>
            )}
          </label>

          <label>
            Nueva hora

            <input
              type="time"
              value={
                startTime
              }
              required
              onChange={(
                event,
              ) =>
                setStartTime(
                  event.target
                    .value,
                )
              }
            />
          </label>

          {!appointment.is_overbooked ? (
            <div className="reprogram-note">
              El nuevo horario debe
              estar dentro de la
              disponibilidad del
              profesional y no puede
              superponerse con otro
              turno.
            </div>
          ) : (
            <div className="reprogram-note overbooked">
              Este turno es un
              sobreturno y puede
              superponerse con la
              agenda normal.
            </div>
          )}

          {error && (
            <div className="reprogram-error">
              {error}
            </div>
          )}

          <div className="reprogram-actions">
            <button
              type="button"
              className="reprogram-cancel-button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
            >
              Volver
            </button>

            <button
              type="submit"
              className="reprogram-save-button"
              disabled={
                saving
              }
            >
              {saving
                ? "Reprogramando..."
                : "Confirmar nueva fecha"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ReprogramAppointment;
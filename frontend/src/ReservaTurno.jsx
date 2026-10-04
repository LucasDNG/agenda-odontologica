import {
  useEffect,
  useState,
} from "react";

import "./ReservaTurno.css";

const API_URL = "/api";

const WEEKDAY_LABELS = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

const formatDate = (date) => {
  if (!date) return "";

  const [year, month, day] =
    date.split("-");

  return `${day}/${month}/${year}`;
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const mondayOf = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const difference =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + difference,
  );
  result.setHours(12, 0, 0, 0);

  return result;
};

const addDays = (date, count) => {
  const result = new Date(date);

  result.setDate(
    result.getDate() + count,
  );

  return result;
};

const initialWeekOffset = () => {
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  const currentMonday = mondayOf(now);
  const day = now.getDay();
  const target = new Date(now);

  if (day === 6) {
    target.setDate(now.getDate() + 2);
  } else if (day === 0) {
    target.setDate(now.getDate() + 1);
  }

  const targetMonday = mondayOf(target);
  const difference = Math.round(
    (targetMonday.getTime() -
      currentMonday.getTime()) /
      86400000,
  );

  return Math.max(
    0,
    Math.round(difference / 7),
  );
};

function ReservaTurno({
  onAppointmentCreated,
}) {
  const [
    appointmentTypes,
    setAppointmentTypes,
  ] = useState([]);

  const [
    professionals,
    setProfessionals,
  ] = useState([]);

  const [
    availableSlots,
    setAvailableSlots,
  ] = useState([]);

  const [
    appointmentTypeId,
    setAppointmentTypeId,
  ] = useState("");

  const [
    professionalId,
    setProfessionalId,
  ] = useState("");

  const [date, setDate] =
    useState("");

  const [
    startTime,
    setStartTime,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    loadingProfessionals,
    setLoadingProfessionals,
  ] = useState(false);

  const [
    loadingSlots,
    setLoadingSlots,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [weekOffset, setWeekOffset] =
    useState(initialWeekOffset);

  const [weekDays, setWeekDays] =
    useState([]);

  const [loadingWeek, setLoadingWeek] =
    useState(false);

  useEffect(() => {
    const loadAppointmentTypes =
      async () => {
        try {
          const response = await fetch(
            `${API_URL}/appointment-types`,
            {
              credentials: "include",
            },
          );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "No se pudieron cargar los servicios",
            );
          }

          setAppointmentTypes(
            data.appointmentTypes || [],
          );
        } catch (requestError) {
          console.error(requestError);

          setError(
            requestError.message,
          );
        }
      };

    loadAppointmentTypes();
  }, []);

  useEffect(() => {
    if (!appointmentTypeId) {
      setProfessionals([]);
      setProfessionalId("");
      return;
    }

    const loadProfessionals =
      async () => {
        setLoadingProfessionals(true);
        setProfessionalId("");
        setDate("");
        setStartTime("");
        setAvailableSlots([]);
        setWeekOffset(
          initialWeekOffset(),
        );
        setWeekDays([]);
        setError("");

        try {
          const response = await fetch(
            `${API_URL}/professionals?appointmentTypeId=${appointmentTypeId}`,
            {
              credentials: "include",
            },
          );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "No se pudieron cargar los profesionales",
            );
          }

          setProfessionals(
            data.professionals || [],
          );
        } catch (requestError) {
          console.error(requestError);

          setError(
            requestError.message,
          );
        } finally {
          setLoadingProfessionals(false);
        }
      };

    loadProfessionals();
  }, [appointmentTypeId]);

  const currentMonday = mondayOf(
    new Date(),
  );

  const visibleMonday = addDays(
    currentMonday,
    weekOffset * 7,
  );

  const today = toIsoDate(new Date());
  const weekFrom = toIsoDate(
    visibleMonday,
  );

  useEffect(() => {
    if (
      !appointmentTypeId ||
      !professionalId
    ) {
      setWeekDays([]);
      return;
    }

    const loadWeek = async () => {
      setLoadingWeek(true);

      try {
        const params =
          new URLSearchParams({
            from: weekFrom,
            appointmentTypeId,
            professionalId,
          });

        const response = await fetch(
          `${API_URL}/available-week?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo cargar la semana",
          );
        }

        setWeekDays(
          data.days || [],
        );
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError.message,
        );
      } finally {
        setLoadingWeek(false);
      }
    };

    loadWeek();
  }, [
    appointmentTypeId,
    professionalId,
    weekFrom,
  ]);

  useEffect(() => {
    if (
      !appointmentTypeId ||
      !professionalId ||
      !date
    ) {
      setAvailableSlots([]);
      setStartTime("");
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      setAvailableSlots([]);
      setStartTime("");
      setError("");

      try {
        const params =
          new URLSearchParams({
            date,
            appointmentTypeId,
            professionalId,
          });

        const response = await fetch(
          `${API_URL}/available-slots?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudieron cargar los horarios",
          );
        }

        if (data.blocked) {
          setError(
            data.reason ||
              "La fecha seleccionada no está disponible",
          );

          return;
        }

        setAvailableSlots(
          data.availableSlots || [],
        );
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError.message,
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [
    appointmentTypeId,
    professionalId,
    date,
  ]);

  const selectedService =
    appointmentTypes.find(
      (service) =>
        String(service.id) ===
        String(appointmentTypeId),
    );

  const selectedProfessional =
    professionals.find(
      (professional) =>
        String(professional.id) ===
        String(professionalId),
    );

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !appointmentTypeId ||
      !professionalId ||
      !date ||
      !startTime
    ) {
      setError(
        "Completá servicio, profesional, fecha y horario.",
      );

      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/appointments`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            appointmentTypeId:
              Number(
                appointmentTypeId,
              ),
            professionalId:
              Number(
                professionalId,
              ),
            date,
            startTime,
            notes,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudo reservar el turno",
        );
      }

      setMessage(
        "Turno reservado correctamente.",
      );

      setStartTime("");
      setDate("");
      setNotes("");
      setAvailableSlots([]);

      if (onAppointmentCreated) {
        onAppointmentCreated(
          data.appointment,
        );
      }
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const weekEnd = addDays(
    visibleMonday,
    6,
  );

  return (
    <section className="booking-page">
      <div className="booking-header">
        <p className="booking-eyebrow">
          Turnos online
        </p>

        <h1>
          Reservá tu turno
        </h1>

        <p>
          Elegí el servicio, profesional,
          fecha y horario.
        </p>
      </div>

      <form
        className="booking-card"
        onSubmit={handleSubmit}
      >
        <div className="booking-step">
          <div className="booking-step-title">
            <span>1</span>

            <div>
              <h2>
                Servicio
              </h2>

              <p>
                ¿Qué tratamiento necesitás?
              </p>
            </div>
          </div>

          <div className="booking-options">
            {appointmentTypes.map(
              (service) => (
                <button
                  type="button"
                  key={service.id}
                  className={
                    String(
                      appointmentTypeId,
                    ) ===
                    String(service.id)
                      ? "booking-option selected"
                      : "booking-option"
                  }
                  onClick={() =>
                    setAppointmentTypeId(
                      String(
                        service.id,
                      ),
                    )
                  }
                >
                  <strong>
                    {service.name}
                  </strong>

                  <span>
                    {
                      service.duration_minutes
                    }{" "}
                    min
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        {appointmentTypeId && (
          <div className="booking-step">
            <div className="booking-step-title">
              <span>2</span>

              <div>
                <h2>
                  Profesional
                </h2>

                <p>
                  Elegí quién realizará
                  el tratamiento.
                </p>
              </div>
            </div>

            {loadingProfessionals ? (
              <p className="booking-muted">
                Cargando profesionales...
              </p>
            ) : (
              <div className="booking-options">
                {professionals.map(
                  (professional) => (
                    <button
                      type="button"
                      key={
                        professional.id
                      }
                      className={
                        String(
                          professionalId,
                        ) ===
                        String(
                          professional.id,
                        )
                          ? "booking-option selected"
                          : "booking-option"
                      }
                      onClick={() => {
                        setProfessionalId(
                          String(
                            professional.id,
                          ),
                        );

                        setDate("");
                        setStartTime("");
                        setAvailableSlots(
                          [],
                        );
                      }}
                    >
                      <strong>
                        {
                          professional.name
                        }{" "}
                        {
                          professional.lastname
                        }
                      </strong>

                      <span>
                        {professional.specialty ||
                          "Odontología"}
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}

            {!loadingProfessionals &&
              professionals.length ===
                0 && (
                <p className="booking-muted">
                  No hay profesionales
                  disponibles para este
                  servicio.
                </p>
              )}
          </div>
        )}

        {professionalId && (
          <div className="booking-step">
            <div className="booking-step-title">
              <span>3</span>

              <div>
                <h2>
                  Fecha
                </h2>

                <p>
                  Seleccioná el día del
                  turno.
                </p>
              </div>
            </div>

            <div className="booking-week">
              <div className="booking-week-nav">
                <button
                  type="button"
                  aria-label="Semana anterior"
                  disabled={
                    weekOffset === 0
                  }
                  onClick={() =>
                    setWeekOffset(
                      (current) =>
                        Math.max(
                          0,
                          current - 1,
                        ),
                    )
                  }
                >
                  ‹
                </button>

                <strong>
                  {formatDate(
                    toIsoDate(
                      visibleMonday,
                    ),
                  ).slice(0, 5)}
                  {" – "}
                  {formatDate(
                    toIsoDate(weekEnd),
                  ).slice(0, 5)}
                </strong>

                <button
                  type="button"
                  aria-label="Semana siguiente"
                  onClick={() =>
                    setWeekOffset(
                      (current) =>
                        current + 1,
                    )
                  }
                >
                  ›
                </button>
              </div>

              <div className="booking-week-days">
                {(loadingWeek
                  ? WEEKDAY_LABELS.map(
                      (
                        label,
                        index,
                      ) => ({
                        date: `placeholder-${index}`,
                        status:
                          "loading",
                        label,
                      }),
                    )
                  : weekDays
                ).map(
                  (day, index) => {
                    const isPast =
                      day.status !==
                        "loading" &&
                      day.date < today;
                    const status =
                      day.status;
                    const canSelect =
                      status === "open" &&
                      !isPast;

                    return (
                      <button
                        type="button"
                        key={day.date}
                        className={`booking-day ${status}${
                          isPast
                            ? " past"
                            : ""
                        }${
                          date ===
                          day.date
                            ? " selected"
                            : ""
                        }`}
                        disabled={
                          !canSelect
                        }
                        onClick={() => {
                          setDate(
                            day.date,
                          );
                          setStartTime(
                            "",
                          );
                        }}
                      >
                        <span>
                          {
                            WEEKDAY_LABELS[
                              index
                            ]
                          }
                        </span>
                        <strong>
                          {day.status ===
                          "loading"
                            ? "·"
                            : day.date.slice(
                                8,
                              )}
                        </strong>
                        {status ===
                          "open" &&
                          !isPast && (
                          <small>
                            Libre
                          </small>
                        )}
                        {status ===
                          "open" &&
                          isPast && (
                          <small>
                            Pasado
                          </small>
                        )}
                        {status ===
                          "full" && (
                          <small>
                            Completo
                          </small>
                        )}
                        {status ===
                          "closed" && (
                          <small>
                            Cerrado
                          </small>
                        )}
                      </button>
                    );
                  },
                )}
              </div>

              <p className="booking-week-help">
                Tocá un día en verde para ver los horarios.
              </p>

              <div className="booking-week-legend">
                <span>
                  Con lugar
                </span>
                <span>
                  Completo
                </span>
                <span>
                  No atiende
                </span>
              </div>
            </div>
          </div>
        )}

        {date && (
          <div className="booking-step">
            <div className="booking-step-title">
              <span>4</span>

              <div>
                <h2>
                  Horario
                </h2>

                <p>
                  Horarios disponibles
                  para{" "}
                  {formatDate(date)}.
                </p>
              </div>
            </div>

            {loadingSlots ? (
              <p className="booking-muted">
                Buscando horarios...
              </p>
            ) : (
              <div className="booking-times">
                {availableSlots.map(
                  (slot) => (
                    <button
                      type="button"
                      key={
                        slot.startTime
                      }
                      className={
                        startTime ===
                        slot.startTime
                          ? "booking-time selected"
                          : "booking-time"
                      }
                      onClick={() =>
                        setStartTime(
                          slot.startTime,
                        )
                      }
                    >
                      {slot.startTime}
                    </button>
                  ),
                )}
              </div>
            )}

            {!loadingSlots &&
              availableSlots.length ===
                0 && (
                <p className="booking-muted">
                  No hay horarios
                  disponibles para esta
                  fecha.
                </p>
              )}
          </div>
        )}

        {startTime && (
          <div className="booking-step">
            <div className="booking-step-title">
              <span>5</span>

              <div>
                <h2>
                  Confirmación
                </h2>

                <p>
                  Revisá los datos antes
                  de reservar.
                </p>
              </div>
            </div>

            <div className="booking-summary">
              <div>
                <span>
                  Servicio
                </span>

                <strong>
                  {
                    selectedService?.name
                  }
                </strong>
              </div>

              <div>
                <span>
                  Profesional
                </span>

                <strong>
                  {
                    selectedProfessional?.name
                  }{" "}
                  {
                    selectedProfessional?.lastname
                  }
                </strong>
              </div>

              <div>
                <span>
                  Fecha
                </span>

                <strong>
                  {formatDate(date)}
                </strong>
              </div>

              <div>
                <span>
                  Horario
                </span>

                <strong>
                  {startTime}
                </strong>
              </div>
            </div>

            <label className="booking-notes">
              Observaciones opcionales

              <textarea
                rows="3"
                value={notes}
                placeholder="Ej: sensibilidad, motivo de consulta..."
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        )}

        {error && (
          <p className="booking-error">
            {error}
          </p>
        )}

        {message && (
          <p className="booking-success">
            {message}
          </p>
        )}

        {startTime && (
          <button
            className="booking-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Reservando..."
              : "Confirmar turno"}
          </button>
        )}
      </form>
    </section>
  );
}

export default ReservaTurno;
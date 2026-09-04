import {
  useMemo,
  useState,
} from "react";

import "./AgendaView.css";

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const pad = (value) =>
  String(value).padStart(2, "0");

const dateToDisplay = (date) =>
  `${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;

const displayToDate = (value) => {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (!match) {
    return null;
  }

  const [, day, month, year] =
    match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
    0,
    0,
    0,
  );
};

const startOfWeek = (date) => {
  const result =
    new Date(date);

  const day =
    result.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  result.setDate(
    result.getDate() +
      difference,
  );

  result.setHours(
    12,
    0,
    0,
    0,
  );

  return result;
};

const addDays = (
  date,
  days,
) => {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
      days,
  );

  return result;
};

const formatTime = (
  time,
) => {
  if (!time) {
    return "";
  }

  return String(time).slice(
    0,
    5,
  );
};

const getStatusLabel = (
  status,
) => {
  const labels = {
    scheduled:
      "Programado",
    confirmed:
      "Confirmado",
    cancelled:
      "Cancelado",
    completed:
      "Atendido",
    absent:
      "Ausente",
  };

  return (
    labels[status] ||
    status
  );
};

const formatLongDate = (
  date,
) =>
  `${DAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;

function AgendaView({
  appointments = [],
  loading = false,
  message = "",
  updatingAppointmentId,
  onUpdateStatus,
  onRefresh,
  onCreateOverbooked,
}) {
  const [view, setView] =
    useState("day");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(new Date());

  const [
    professionalId,
    setProfessionalId,
  ] = useState("all");

  const professionals =
    useMemo(() => {
      const professionalMap =
        new Map();

      appointments.forEach(
        (appointment) => {
          if (
            !appointment.professional_id
          ) {
            return;
          }

          professionalMap.set(
            Number(
              appointment.professional_id,
            ),
            {
              id: Number(
                appointment.professional_id,
              ),

              name:
                appointment.professional_name ||
                "",

              lastname:
                appointment.professional_lastname ||
                "",
            },
          );
        },
      );

      return Array.from(
        professionalMap.values(),
      ).sort((a, b) =>
        `${a.lastname} ${a.name}`.localeCompare(
          `${b.lastname} ${b.name}`,
          "es",
        ),
      );
    }, [appointments]);

  const activeAppointments =
    useMemo(
      () =>
        appointments.filter(
          (appointment) =>
            appointment.status !==
            "cancelled",
        ),
      [appointments],
    );

  const filteredByProfessional =
    useMemo(() => {
      if (
        professionalId ===
        "all"
      ) {
        return activeAppointments;
      }

      return activeAppointments.filter(
        (appointment) =>
          Number(
            appointment.professional_id,
          ) ===
          Number(
            professionalId,
          ),
      );
    }, [
      activeAppointments,
      professionalId,
    ]);

  const weekStart =
    useMemo(
      () =>
        startOfWeek(
          selectedDate,
        ),
      [selectedDate],
    );

  const weekDays =
    useMemo(
      () =>
        Array.from(
          { length: 7 },
          (_, index) =>
            addDays(
              weekStart,
              index,
            ),
        ),
      [weekStart],
    );

  const appointmentsByDate =
    useMemo(() => {
      const grouped =
        new Map();

      filteredByProfessional.forEach(
        (appointment) => {
          const key =
            appointment.appointment_date;

          if (
            !grouped.has(key)
          ) {
            grouped.set(
              key,
              [],
            );
          }

          grouped
            .get(key)
            .push(
              appointment,
            );
        },
      );

      grouped.forEach(
        (items) => {
          items.sort((a, b) =>
            String(
              a.start_time,
            ).localeCompare(
              String(
                b.start_time,
              ),
            ),
          );
        },
      );

      return grouped;
    }, [
      filteredByProfessional,
    ]);

  const selectedDateDisplay =
    dateToDisplay(
      selectedDate,
    );

  const dayAppointments =
    appointmentsByDate.get(
      selectedDateDisplay,
    ) || [];

  const getDelayForDate = (
    displayDate,
  ) =>
    (
      appointmentsByDate.get(
        displayDate,
      ) || []
    ).reduce(
      (
        total,
        appointment,
      ) => {
        if (
          appointment.is_overbooked !==
          true
        ) {
          return total;
        }

        return (
          total +
          Number(
            appointment.delay_minutes ||
              0,
          )
        );
      },
      0,
    );

  const goPrevious = () => {
    setSelectedDate(
      addDays(
        selectedDate,
        view === "week"
          ? -7
          : -1,
      ),
    );
  };

  const goNext = () => {
    setSelectedDate(
      addDays(
        selectedDate,
        view === "week"
          ? 7
          : 1,
      ),
    );
  };

  const goToday = () => {
    setSelectedDate(
      new Date(),
    );
  };

  const renderAppointment = (
    appointment,
  ) => (
    <article
      className={[
        "agenda-appointment",
        appointment.is_overbooked
          ? "overbooked"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      key={
        appointment.id
      }
    >
      <div className="agenda-appointment-time">
        <strong>
          {formatTime(
            appointment.start_time,
          )}
        </strong>

        <span>
          {formatTime(
            appointment.end_time,
          )}
        </span>

        {appointment.is_overbooked && (
          <span className="agenda-overbooked-badge">
            SOBRETURNO
          </span>
        )}
      </div>

      <div className="agenda-appointment-main">
        <div className="agenda-patient-row">
          <h3>
            {
              appointment.patient_name
            }{" "}
            {
              appointment.patient_lastname
            }
          </h3>

          <span
            className={`appointment-status ${appointment.status}`}
          >
            {getStatusLabel(
              appointment.status,
            )}
          </span>
        </div>

        <p className="agenda-service">
          {
            appointment.service
          }
        </p>

        <p className="agenda-professional">
          🦷{" "}
          {
            appointment.professional_name
          }{" "}
          {
            appointment.professional_lastname
          }
        </p>

        <div className="agenda-contact">
          {appointment.patient_phone && (
            <span>
              📱{" "}
              {
                appointment.patient_phone
              }
            </span>
          )}

          {appointment.patient_email && (
            <span>
              ✉️{" "}
              {
                appointment.patient_email
              }
            </span>
          )}
        </div>

        {appointment.notes && (
          <p className="agenda-notes">
            Nota:{" "}
            {
              appointment.notes
            }
          </p>
        )}
      </div>

      <div className="agenda-appointment-actions">
        {appointment.status !==
          "completed" &&
          appointment.status !==
            "absent" && (
            <>
              <button
                type="button"
                className="action-button completed"
                disabled={
                  updatingAppointmentId ===
                  appointment.id
                }
                onClick={() =>
                  onUpdateStatus(
                    appointment.id,
                    "completed",
                  )
                }
              >
                Atendido
              </button>

              <button
                type="button"
                className="action-button absent"
                disabled={
                  updatingAppointmentId ===
                  appointment.id
                }
                onClick={() =>
                  onUpdateStatus(
                    appointment.id,
                    "absent",
                  )
                }
              >
                Ausente
              </button>

              <button
                type="button"
                className="action-button cancelled"
                disabled={
                  updatingAppointmentId ===
                  appointment.id
                }
                onClick={() =>
                  onUpdateStatus(
                    appointment.id,
                    "cancelled",
                  )
                }
              >
                Cancelar
              </button>
            </>
          )}
      </div>
    </article>
  );

  return (
    <div className="agenda-view">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            Turnos
          </p>

          <h2>
            Agenda
          </h2>
        </div>

        <div className="agenda-heading-actions">
          <button
            type="button"
            className="overbooked-create-button"
            onClick={
              onCreateOverbooked
            }
          >
            + Sobreturno
          </button>

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
      </div>

      <div className="agenda-toolbar">
        <div className="agenda-view-toggle">
          <button
            type="button"
            className={
              view === "day"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("day")
            }
          >
            Día
          </button>

          <button
            type="button"
            className={
              view === "week"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("week")
            }
          >
            Semana
          </button>
        </div>

        <label className="agenda-professional-filter">
          <span>
            Profesional
          </span>

          <select
            value={
              professionalId
            }
            onChange={(
              event,
            ) =>
              setProfessionalId(
                event.target
                  .value,
              )
            }
          >
            <option value="all">
              Todos
            </option>

            {professionals.map(
              (
                professional,
              ) => (
                <option
                  key={
                    professional.id
                  }
                  value={
                    professional.id
                  }
                >
                  {
                    professional.name
                  }{" "}
                  {
                    professional.lastname
                  }
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <div className="agenda-date-navigation">
        <button
          type="button"
          onClick={
            goPrevious
          }
          aria-label={
            view === "week"
              ? "Semana anterior"
              : "Día anterior"
          }
        >
          ←
        </button>

        <div>
          {view === "day" ? (
            <>
              <strong>
                {formatLongDate(
                  selectedDate,
                )}
              </strong>

              <span>
                {
                  selectedDateDisplay
                }
              </span>
            </>
          ) : (
            <>
              <strong>
                Semana del{" "}
                {dateToDisplay(
                  weekStart,
                )}
              </strong>

              <span>
                hasta{" "}
                {dateToDisplay(
                  addDays(
                    weekStart,
                    6,
                  ),
                )}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={
            goNext
          }
          aria-label={
            view === "week"
              ? "Semana siguiente"
              : "Día siguiente"
          }
        >
          →
        </button>

        <button
          type="button"
          className="agenda-today-button"
          onClick={
            goToday
          }
        >
          Hoy
        </button>
      </div>

      {message && (
        <div className="status-message">
          {message}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          Cargando turnos...
        </div>
      ) : view ===
        "day" ? (
        <>
          <div className="agenda-day-summary">
            <div>
              <strong>
                {
                  dayAppointments.length
                }
              </strong>

              <span>
                {dayAppointments.length ===
                1
                  ? "turno"
                  : "turnos"}
              </span>
            </div>

            <div>
              <strong>
                {getDelayForDate(
                  selectedDateDisplay,
                )}
              </strong>

              <span>
                min de retraso
              </span>
            </div>
          </div>

          {dayAppointments.length ===
          0 ? (
            <div className="empty-state">
              No hay turnos para este día.
            </div>
          ) : (
            <div className="agenda-day-list">
              {dayAppointments.map(
                renderAppointment,
              )}
            </div>
          )}
        </>
      ) : (
        <div className="agenda-week-grid">
          {weekDays.map(
            (date) => {
              const displayDate =
                dateToDisplay(
                  date,
                );

              const dayItems =
                appointmentsByDate.get(
                  displayDate,
                ) || [];

              const delay =
                getDelayForDate(
                  displayDate,
                );

              const isToday =
                displayDate ===
                dateToDisplay(
                  new Date(),
                );

              return (
                <section
                  className={[
                    "agenda-week-day",
                    isToday
                      ? "today"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={
                    displayDate
                  }
                >
                  <button
                    type="button"
                    className="agenda-week-day-header"
                    onClick={() => {
                      setSelectedDate(
                        date,
                      );

                      setView(
                        "day",
                      );
                    }}
                  >
                    <span>
                      {
                        DAYS[
                          date.getDay()
                        ]
                      }
                    </span>

                    <strong>
                      {pad(
                        date.getDate(),
                      )}
                    </strong>

                    <small>
                      {
                        displayDate
                      }
                    </small>
                  </button>

                  <div className="agenda-week-day-summary">
                    <span>
                      {
                        dayItems.length
                      }{" "}
                      {dayItems.length ===
                      1
                        ? "turno"
                        : "turnos"}
                    </span>

                    {delay >
                      0 && (
                      <span className="agenda-delay">
                        +{delay} min
                      </span>
                    )}
                  </div>

                  <div className="agenda-week-appointments">
                    {dayItems.length ===
                    0 ? (
                      <p className="agenda-week-empty">
                        Sin turnos
                      </p>
                    ) : (
                      dayItems.map(
                        (
                          appointment,
                        ) => (
                          <button
                            type="button"
                            className={[
                              "agenda-week-appointment",
                              appointment.is_overbooked
                                ? "overbooked"
                                : "",
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                " ",
                              )}
                            key={
                              appointment.id
                            }
                            onClick={() => {
                              setSelectedDate(
                                date,
                              );

                              setView(
                                "day",
                              );
                            }}
                          >
                            <strong>
                              {formatTime(
                                appointment.start_time,
                              )}
                            </strong>

                            <span>
                              {
                                appointment.patient_name
                              }{" "}
                              {
                                appointment.patient_lastname
                              }
                            </span>

                            <small>
                              {
                                appointment.service
                              }
                            </small>
                          </button>
                        ),
                      )
                    )}
                  </div>
                </section>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

export default AgendaView;
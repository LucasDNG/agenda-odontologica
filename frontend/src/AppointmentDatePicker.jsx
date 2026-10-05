import { Fragment, useMemo, useState } from "react";
import "./AppointmentDatePicker.css";

const DAYS = [
  "Dom",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
];

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const pad = (value) =>
  String(value).padStart(2, "0");

const dateToDisplay = (date) => {
  return `${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
};

const displayToDate = (value) => {
  const match = value?.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (!match) return null;

  const [, day, month, year] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  );

  if (
    date.getDate() !== Number(day) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getFullYear() !== Number(year)
  ) {
    return null;
  }

  return date;
};

const startOfWeek = (date) => {
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

const addDays = (date, days) => {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days,
  );

  return result;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(
    time || "",
  )
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(
    minutes / 60,
  );
  const mins = minutes % 60;

  return `${pad(hours)}:${pad(mins)}`;
};

const timeBetween = (
  previous,
  next,
) => {
  const start = timeToMinutes(
    previous.start_time,
  );
  const end = timeToMinutes(
    next.start_time,
  );

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start
  ) {
    return minutesToTime(
      start + 15,
    );
  }

  return minutesToTime(
    start +
      Math.round(
        (end - start) / 2,
      ),
  );
};

const formatDelay = (minutes) => {
  const totalMinutes =
    Number(minutes) || 0;

  if (totalMinutes <= 0) {
    return "0 min";
  }

  const hours = Math.floor(
    totalMinutes / 60,
  );

  const remainingMinutes =
    totalMinutes % 60;

  if (
    hours > 0 &&
    remainingMinutes > 0
  ) {
    return `${hours} h ${remainingMinutes} min`;
  }

  if (hours > 0) {
    return `${hours} h`;
  }

  return `${remainingMinutes} min`;
};

function AppointmentDatePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  availability = [],
  appointments = [],
}) {
  const selectedDateObject =
    displayToDate(selectedDate) ||
    new Date();

  const [weekReference, setWeekReference] =
    useState(
      startOfWeek(selectedDateObject),
    );

  const weekDays = useMemo(() => {
    return Array.from(
      { length: 7 },
      (_, index) =>
        addDays(
          weekReference,
          index,
        ),
    );
  }, [weekReference]);

  const getAppointmentsForDate = (
    date,
  ) => {
    const displayDate =
      dateToDisplay(date);

    return appointments.filter(
      (appointment) =>
        appointment.appointment_date ===
          displayDate &&
        appointment.status !==
          "cancelled",
    );
  };

  const getDelayForDate = (
    date,
  ) => {
    const dayAppointments =
      getAppointmentsForDate(date);

    return dayAppointments.reduce(
      (total, appointment) => {
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
  };

  const professionalWorksOnDate = (
    date,
  ) => {
    const dayOfWeek =
      date.getDay();

    return availability.some(
      (schedule) =>
        Number(
          schedule.day_of_week ??
            schedule.dayOfWeek,
        ) === dayOfWeek &&
        schedule.active !== false,
    );
  };

  const handlePreviousWeek = () => {
    setWeekReference(
      addDays(
        weekReference,
        -7,
      ),
    );
  };

  const handleNextWeek = () => {
    setWeekReference(
      addDays(
        weekReference,
        7,
      ),
    );
  };

  const handleToday = () => {
    const today = new Date();

    setWeekReference(
      startOfWeek(today),
    );

    onDateChange(
      dateToDisplay(today),
    );
  };

  const selectedDay =
    displayToDate(selectedDate);

  const selectedDayAppointments =
    selectedDay
      ? getAppointmentsForDate(
          selectedDay,
        )
          .slice()
          .sort((left, right) =>
            String(
              left.start_time,
            ).localeCompare(
              String(
                right.start_time,
              ),
            ),
          )
      : [];

  return (
    <div className="appointment-date-picker">
      <div className="date-picker-header">
        <div>
          <strong>
            Fecha
          </strong>

          <span>
            Elegí el día del sobreturno
          </span>
        </div>

        <button
          type="button"
          className="date-picker-today"
          onClick={handleToday}
        >
          Hoy
        </button>
      </div>

      <div className="week-navigation">
        <button
          type="button"
          onClick={
            handlePreviousWeek
          }
          aria-label="Semana anterior"
        >
          ←
        </button>

        <strong>
          {MONTHS[
            weekReference.getMonth()
          ]}{" "}
          {weekReference.getFullYear()}
        </strong>

        <button
          type="button"
          onClick={handleNextWeek}
          aria-label="Semana siguiente"
        >
          →
        </button>
      </div>

      <div className="week-days">
        {weekDays.map((date) => {
          const displayDate =
            dateToDisplay(date);

          const dayAppointments =
            getAppointmentsForDate(
              date,
            );

          const dayDelay =
            getDelayForDate(date);

          const works =
            professionalWorksOnDate(
              date,
            );

          const selected =
            selectedDate ===
            displayDate;

          const today =
            dateToDisplay(
              new Date(),
            ) === displayDate;

          return (
            <button
              type="button"
              key={displayDate}
              className={[
                "week-day-card",
                selected
                  ? "selected"
                  : "",
                today
                  ? "today"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                onDateChange(
                  displayDate,
                )
              }
            >
              <span className="week-day-name">
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

              <span className="week-day-month">
                {
                  MONTHS[
                    date.getMonth()
                  ]
                }
              </span>

              <span
                className={
                  works
                    ? "day-work-status works"
                    : "day-work-status"
                }
              >
                {works
                  ? "Atiende"
                  : "Fuera de horario"}
              </span>

              {dayAppointments.length >
                0 && (
                <span className="day-appointments-count">
                  {
                    dayAppointments.length
                  }{" "}
                  {dayAppointments.length ===
                  1
                    ? "turno"
                    : "turnos"}
                </span>
              )}

              <span
                className={[
                  "day-delay",
                  dayDelay > 0
                    ? "has-delay"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                Retraso{" "}
                {dayDelay > 0
                  ? "+"
                  : ""}
                {formatDelay(
                  dayDelay,
                )}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="time-picker-section">
          <div className="time-picker-heading">
            <div>
              <strong>
                Hora
              </strong>

              <span>
                {selectedDate}
              </span>
            </div>

            {selectedTime && (
              <span className="selected-time-label">
                {selectedTime}
              </span>
            )}
          </div>

          <div className="day-timeline">
            {selectedDayAppointments.map(
                (
                  appointment,
                  index,
                  dayAppointments,
                ) => {
                  const next =
                    dayAppointments[
                      index + 1
                    ];
                  const insertTime =
                    next
                      ? timeBetween(
                          appointment,
                          next,
                        )
                      : null;

                  return (
                    <Fragment
                      key={
                        appointment.id
                      }
                    >
                      <article className="timeline-appointment">
                        <strong>
                          {String(
                            appointment.start_time,
                          ).slice(0, 5)}
                        </strong>

                        <div>
                          <p>
                            {
                              appointment.patient_name
                            }{" "}
                            {
                              appointment.patient_lastname
                            }
                          </p>

                          <span>
                            {appointment.service ||
                              "Turno"}
                            {appointment.is_overbooked
                              ? " · Sobreturno"
                              : ""}
                          </span>
                        </div>
                      </article>

                      {insertTime && (
                        <button
                          type="button"
                          className={
                            selectedTime ===
                            insertTime
                              ? "timeline-insert selected"
                              : "timeline-insert"
                          }
                          onClick={() =>
                            onTimeChange(
                              insertTime,
                            )
                          }
                        >
                          <span>
                            +
                          </span>
                          Agregar sobreturno
                          <small>
                            {insertTime}
                          </small>
                        </button>
                      )}
                    </Fragment>
                  );
                },
              )}

            {selectedDayAppointments.length ===
              0 && (
              <p className="timeline-empty">
                Este día no tiene turnos.
              </p>
            )}

            {selectedDayAppointments.length ===
              1 && (
              <p className="timeline-empty">
                Con un solo turno, elegí
                la hora abajo.
              </p>
            )}
          </div>

          <div className="custom-time">
            <label>
              Otra hora

              <input
                type="time"
                value={
                  selectedTime
                }
                onChange={(
                  event,
                ) =>
                  onTimeChange(
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <p>
              El sobreturno se agrega entre
              dos pacientes. También podés
              elegir otra hora.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentDatePicker;
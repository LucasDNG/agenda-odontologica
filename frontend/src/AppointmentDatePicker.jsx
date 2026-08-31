import { useMemo, useState } from "react";
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

const generateTimes = () => {
  const times = [];

  for (
    let minutes = 8 * 60;
    minutes <= 20 * 60;
    minutes += 30
  ) {
    const hours = Math.floor(
      minutes / 60,
    );

    const mins = minutes % 60;

    times.push(
      `${pad(hours)}:${pad(mins)}`,
    );
  }

  return times;
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

  const suggestedTimes = useMemo(
    () => generateTimes(),
    [],
  );

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

  const getAppointmentsAtTime = (
    date,
    time,
  ) => {
    return getAppointmentsForDate(
      date,
    ).filter(
      (appointment) =>
        String(
          appointment.start_time,
        ).slice(0, 5) === time,
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

          <div className="time-grid">
            {suggestedTimes.map(
              (time) => {
                const occupied =
                  getAppointmentsAtTime(
                    selectedDay,
                    time,
                  );

                return (
                  <button
                    type="button"
                    key={time}
                    className={[
                      "time-option",
                      selectedTime ===
                      time
                        ? "selected"
                        : "",
                      occupied.length >
                      0
                        ? "occupied"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      onTimeChange(
                        time,
                      )
                    }
                  >
                    <strong>
                      {time}
                    </strong>

                    {occupied.length >
                      0 && (
                      <span>
                        {occupied.length ===
                        1
                          ? "ocupado"
                          : `${occupied.length} turnos`}
                      </span>
                    )}
                  </button>
                );
              },
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
              Los horarios ocupados siguen
              disponibles porque este es un
              sobreturno.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentDatePicker;
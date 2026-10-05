import { useEffect, useState } from "react";
import "./OverbookedAppointment.css";
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

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const mondayOf = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(12, 0, 0, 0);

  return result;
};

const addDays = (date, count) => {
  const result = new Date(date);

  result.setDate(result.getDate() + count);

  return result;
};

const formatDate = (date) => {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
};

const emptyPatientForm = {
  name: "",
  lastname: "",
  dni: "",
  phone: "",
};

function AssignAppointment({
  open,
  onClose,
  onCreated,
}) {
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [weekDays, setWeekDays] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [savingPatient, setSavingPatient] = useState(false);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = toIsoDate(new Date());
  const visibleMonday = addDays(mondayOf(new Date()), weekOffset * 7);
  const weekFrom = toIsoDate(visibleMonday);
  const weekEnd = addDays(visibleMonday, 6);

  const resetForm = () => {
    setAppointmentTypes([]);
    setProfessionals([]);
    setAvailableSlots([]);
    setWeekDays([]);
    setWeekOffset(0);
    setAppointmentTypeId("");
    setProfessionalId("");
    setDate("");
    setStartTime("");
    setNotes("");
    setPatientSearch("");
    setPatientResults([]);
    setSelectedPatient(null);
    setGuestName("");
    setSearchingPatients(false);
    setShowNewPatient(false);
    setPatientForm(emptyPatientForm);
    setSavingPatient(false);
    setSaving(false);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;

    const loadServices = async () => {
      try {
        const response = await fetch(`${API_URL}/appointment-types`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "No se pudieron cargar los servicios",
          );
        }

        if (!cancelled) {
          setAppointmentTypes(data.appointmentTypes || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      }
    };

    loadServices();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || selectedPatient || guestName || !patientSearch.trim()) {
      return undefined;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      setSearchingPatients(true);

      try {
        const params = new URLSearchParams({
          search: patientSearch.trim(),
        });
        const response = await fetch(
          `${API_URL}/admin/patients?${params.toString()}`,
          { credentials: "include" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "No se pudieron buscar los pacientes",
          );
        }

        if (!cancelled) {
          setPatientResults(data.patients || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setSearchingPatients(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [open, patientSearch, selectedPatient, guestName]);

  useEffect(() => {
    if (!open || !appointmentTypeId) {
      setProfessionals([]);
      setProfessionalId("");
      return undefined;
    }

    let cancelled = false;

    const loadProfessionals = async () => {
      setLoadingProfessionals(true);
      setProfessionalId("");
      setDate("");
      setStartTime("");
      setAvailableSlots([]);
      setWeekDays([]);
      setWeekOffset(0);

      try {
        const response = await fetch(
          `${API_URL}/professionals?appointmentTypeId=${appointmentTypeId}`,
          { credentials: "include" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "No se pudieron cargar los profesionales",
          );
        }

        if (!cancelled) {
          setProfessionals(data.professionals || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfessionals(false);
        }
      }
    };

    loadProfessionals();

    return () => {
      cancelled = true;
    };
  }, [open, appointmentTypeId]);

  useEffect(() => {
    if (!open || !appointmentTypeId || !professionalId) {
      setWeekDays([]);
      return undefined;
    }

    let cancelled = false;

    const loadWeek = async () => {
      setLoadingWeek(true);

      try {
        const params = new URLSearchParams({
          from: weekFrom,
          appointmentTypeId,
          professionalId,
        });
        const response = await fetch(
          `${API_URL}/available-week?${params.toString()}`,
          { credentials: "include" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "No se pudo cargar la semana",
          );
        }

        if (!cancelled) {
          setWeekDays(data.days || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingWeek(false);
        }
      }
    };

    loadWeek();

    return () => {
      cancelled = true;
    };
  }, [open, appointmentTypeId, professionalId, weekFrom]);

  useEffect(() => {
    if (!open || !appointmentTypeId || !professionalId || !date) {
      setAvailableSlots([]);
      setStartTime("");
      return undefined;
    }

    let cancelled = false;

    const loadSlots = async () => {
      setLoadingSlots(true);
      setAvailableSlots([]);
      setStartTime("");

      try {
        const params = new URLSearchParams({
          date,
          appointmentTypeId,
          professionalId,
        });
        const response = await fetch(
          `${API_URL}/available-slots?${params.toString()}`,
          { credentials: "include" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "No se pudieron cargar los horarios",
          );
        }

        if (data.blocked) {
          throw new Error(
            data.reason || "La fecha seleccionada no está disponible",
          );
        }

        const now = new Date();
        const slots = (data.availableSlots || []).filter((slot) => {
          const slotDate = new Date(`${date}T${slot.startTime}:00`);

          return slotDate > now;
        });

        if (!cancelled) {
          setAvailableSlots(slots);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    };

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [open, appointmentTypeId, professionalId, date]);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientResults([]);
    setShowNewPatient(false);
    setError("");
  };

  const createPatient = async () => {
    if (!patientForm.name.trim()) {
      setError("Ingresá al menos el nombre del paciente.");
      return;
    }

    setSavingPatient(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...patientForm,
          profileType: "quick",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.existingPatient) {
          setPatientResults([data.existingPatient]);
          throw new Error(
            `${data.message}. Podés seleccionar el paciente existente.`,
          );
        }

        throw new Error(data.message || "No se pudo crear el paciente");
      }

      setSelectedPatient(data.patient);
      setShowNewPatient(false);
      setPatientForm(emptyPatientForm);
      setPatientResults([]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingPatient(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      (!selectedPatient && !guestName) ||
      !appointmentTypeId ||
      !professionalId ||
      !date ||
      !startTime
    ) {
      setError("Completá el nombre, el servicio, el profesional, la fecha y el horario.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(selectedPatient
            ? { patientId: Number(selectedPatient.id) }
            : { guestName }),
          appointmentTypeId: Number(appointmentTypeId),
          professionalId: Number(professionalId),
          date,
          startTime,
          notes,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo asignar el turno");
      }

      resetForm();
      await onCreated();
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="overbooked-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <section className="overbooked-modal">
        <div className="overbooked-header">
          <div>
            <p className="eyebrow">Agenda</p>
            <h2>Asignar turno</h2>
            <p>
              Escribí un nombre para este turno, o elegí un paciente guardado.
            </p>
          </div>

          <button
            type="button"
            className="overbooked-close"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {error && <div className="overbooked-error">{error}</div>}

        <form className="overbooked-form" onSubmit={handleSubmit}>
          <div className="patient-search-section">
            <label>Paciente *</label>

            {guestName ? (
              <div className="selected-patient">
                <div>
                  <strong>{guestName}</strong>
                  <span>Solo para este turno</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGuestName("");
                    setPatientSearch("");
                  }}
                >
                  Cambiar
                </button>
              </div>
            ) : selectedPatient ? (
              <div className="selected-patient">
                <div>
                  <strong>
                    {selectedPatient.name}{" "}
                    {selectedPatient.lastname || ""}
                  </strong>
                  <span>
                    {selectedPatient.dni
                      ? `DNI ${selectedPatient.dni}`
                      : selectedPatient.phone || "Sin teléfono"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setPatientSearch("");
                  }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <div className="patient-search-input">
                  <span>🔎</span>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(event) => {
                      setPatientSearch(event.target.value);
                      setShowNewPatient(false);
                      setError("");
                    }}
                    placeholder="Nombre, sobrenombre o paciente guardado"
                    autoComplete="off"
                  />
                </div>

                {patientSearch.trim() && (
                  <div className="patient-results">
                    {searchingPatients && (
                      <div className="patient-searching">Buscando...</div>
                    )}

                    {!searchingPatients &&
                      patientResults.map((patient) => (
                        <button
                          type="button"
                          className="patient-result"
                          key={patient.id}
                          onClick={() => selectPatient(patient)}
                        >
                          <div>
                            <strong>
                              {patient.name} {patient.lastname || ""}
                            </strong>
                            <span>
                              {[
                                patient.dni ? `DNI ${patient.dni}` : null,
                                patient.phone || null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Sin datos adicionales"}
                            </span>
                          </div>
                          <span>Seleccionar</span>
                        </button>
                      ))}

                    {!searchingPatients && !showNewPatient && (
                      <button
                        type="button"
                        className="patient-add-result"
                        onClick={() => {
                          setGuestName(patientSearch.trim());
                          setShowNewPatient(false);
                          setPatientResults([]);
                          setError("");
                        }}
                      >
                        <span className="patient-plus">+</span>
                        <span>
                          Usar "{patientSearch.trim()}" solo para este turno
                        </span>
                      </button>
                    )}

                    {!searchingPatients && !showNewPatient && (
                      <button
                        type="button"
                        className="patient-add-result"
                        onClick={() => {
                          const parts = patientSearch.trim().split(/\s+/);
                          setPatientForm({
                            ...emptyPatientForm,
                            name: parts[0] || "",
                            lastname: parts.slice(1).join(" "),
                          });
                          setShowNewPatient(true);
                        }}
                      >
                        <span className="patient-plus">+</span>
                        <span>
                          Agregar "{patientSearch.trim()}" como nuevo paciente
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {showNewPatient && !selectedPatient && (
            <section className="new-patient-card">
              <div className="new-patient-header">
                <div>
                  <h3>Nuevo paciente</h3>
                  <p>Nombre y, si los tenés, apellido, DNI y teléfono.</p>
                </div>
              </div>

              <div className="new-patient-grid">
                <label>
                  Nombre *
                  <input
                    value={patientForm.name}
                    onChange={(event) =>
                      setPatientForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Apellido
                  <input
                    value={patientForm.lastname}
                    onChange={(event) =>
                      setPatientForm((current) => ({
                        ...current,
                        lastname: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  DNI
                  <input
                    value={patientForm.dni}
                    onChange={(event) =>
                      setPatientForm((current) => ({
                        ...current,
                        dni: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    value={patientForm.phone}
                    onChange={(event) =>
                      setPatientForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="new-patient-actions">
                <button
                  type="button"
                  className="overbooked-cancel"
                  onClick={() => setShowNewPatient(false)}
                  disabled={savingPatient}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="overbooked-save"
                  onClick={createPatient}
                  disabled={savingPatient}
                >
                  {savingPatient ? "Guardando..." : "Agregar paciente"}
                </button>
              </div>
            </section>
          )}

          {(selectedPatient || guestName) && (
            <div className="booking-step">
              <div className="booking-step-title">
                <span>1</span>
                <div>
                  <h2>Servicio</h2>
                  <p>El mismo listado que ve el paciente.</p>
                </div>
              </div>

              <div className="booking-options">
                {appointmentTypes.map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    className={
                      String(appointmentTypeId) === String(service.id)
                        ? "booking-option selected"
                        : "booking-option"
                    }
                    onClick={() =>
                      setAppointmentTypeId(String(service.id))
                    }
                  >
                    <strong>{service.name}</strong>
                    <span>{service.duration_minutes} min</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {appointmentTypeId && (
            <div className="booking-step">
              <div className="booking-step-title">
                <span>2</span>
                <div>
                  <h2>Profesional</h2>
                  <p>Quién atiende ese servicio.</p>
                </div>
              </div>

              {loadingProfessionals ? (
                <p className="booking-muted">Cargando profesionales...</p>
              ) : (
                <div className="booking-options">
                  {professionals.map((professional) => (
                    <button
                      type="button"
                      key={professional.id}
                      className={
                        String(professionalId) === String(professional.id)
                          ? "booking-option selected"
                          : "booking-option"
                      }
                      onClick={() => {
                        setProfessionalId(String(professional.id));
                        setDate("");
                        setStartTime("");
                      }}
                    >
                      <strong>
                        {professional.name} {professional.lastname}
                      </strong>
                      <span>
                        {professional.specialty || "Odontología"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {professionalId && (
            <div className="booking-step">
              <div className="booking-step-title">
                <span>3</span>
                <div>
                  <h2>Fecha</h2>
                  <p>Un día con lugar.</p>
                </div>
              </div>

              <div className="booking-week">
                <div className="booking-week-nav">
                  <button
                    type="button"
                    aria-label="Semana anterior"
                    disabled={weekOffset === 0}
                    onClick={() =>
                      setWeekOffset((current) => Math.max(0, current - 1))
                    }
                  >
                    ‹
                  </button>
                  <strong>
                    {formatDate(weekFrom).slice(0, 5)}
                    {" – "}
                    {formatDate(toIsoDate(weekEnd)).slice(0, 5)}
                  </strong>
                  <button
                    type="button"
                    aria-label="Semana siguiente"
                    onClick={() => setWeekOffset((current) => current + 1)}
                  >
                    ›
                  </button>
                </div>

                <div className="booking-week-days">
                  {(loadingWeek
                    ? WEEKDAY_LABELS.map((label, index) => ({
                        date: `placeholder-${index}`,
                        status: "loading",
                        label,
                      }))
                    : weekDays
                  ).map((day, index) => {
                    const isPast =
                      day.status !== "loading" && day.date < today;
                    const canSelect = day.status === "open" && !isPast;

                    return (
                      <button
                        type="button"
                        key={day.date}
                        className={`booking-day ${day.status}${
                          isPast ? " past" : ""
                        }${date === day.date ? " selected" : ""}`}
                        disabled={!canSelect}
                        onClick={() => {
                          setDate(day.date);
                          setStartTime("");
                        }}
                      >
                        <span>{WEEKDAY_LABELS[index]}</span>
                        <strong>
                          {day.status === "loading" ? "·" : day.date.slice(8)}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {date && (
            <div className="booking-step">
              <div className="booking-step-title">
                <span>4</span>
                <div>
                  <h2>Horario</h2>
                  <p>Horarios libres para {formatDate(date)}.</p>
                </div>
              </div>

              {loadingSlots ? (
                <p className="booking-muted">Buscando horarios...</p>
              ) : (
                <div className="booking-times">
                  {availableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.startTime}
                      className={
                        startTime === slot.startTime
                          ? "booking-time selected"
                          : "booking-time"
                      }
                      onClick={() => setStartTime(slot.startTime)}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}

              {!loadingSlots && availableSlots.length === 0 && (
                <p className="booking-muted">
                  No hay horarios libres para esta fecha.
                </p>
              )}
            </div>
          )}

          {startTime && (
            <label>
              Nota
              <textarea
                rows="3"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observación opcional"
              />
            </label>
          )}

          <div className="overbooked-buttons">
            <button
              type="button"
              className="overbooked-cancel"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="overbooked-save"
              disabled={
                saving ||
                (!selectedPatient && !guestName) ||
                !appointmentTypeId ||
                !professionalId ||
                !date ||
                !startTime
              }
            >
              {saving ? "Asignando..." : "Asignar turno"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AssignAppointment;

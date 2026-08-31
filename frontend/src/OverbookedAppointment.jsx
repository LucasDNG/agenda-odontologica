import { useEffect, useState } from "react";
import AppointmentDatePicker from "./AppointmentDatePicker";
import "./OverbookedAppointment.css";

const API_URL = "http://localhost:3000/api";

const emptyPatientForm = {
  name: "",
  lastname: "",
  dni: "",
  birthDate: "",
  phone: "",
  email: "",
  address: "",
  healthInsurance: "",
  healthInsurancePlan: "",
  memberNumber: "",
  allergies: "",
  medications: "",
  medicalHistory: "",
  notes: "",
};

const convertDateToBackend = (value) => {
  const match = value?.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  );

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  const date = new Date(
    yearNumber,
    monthNumber - 1,
    dayNumber,
  );

  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
};

function OverbookedAppointment({
  open,
  onClose,
  onCreated,
}) {
  const [professionals, setProfessionals] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [availability, setAvailability] =
    useState([]);

  const [appointments, setAppointments] =
    useState([]);

  const [patientSearch, setPatientSearch] =
    useState("");

  const [patientResults, setPatientResults] =
    useState([]);

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [searchingPatients, setSearchingPatients] =
    useState(false);

  const [showNewPatient, setShowNewPatient] =
    useState(false);

  const [patientMode, setPatientMode] =
    useState("quick");

  const [patientForm, setPatientForm] =
    useState(emptyPatientForm);

  const [savingPatient, setSavingPatient] =
    useState(false);

  const [form, setForm] = useState({
    professionalId: "",
    appointmentTypeId: "",
    date: "",
    startTime: "",
    notes: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function resetPatientSection() {
    setPatientSearch("");
    setPatientResults([]);
    setSelectedPatient(null);
    setShowNewPatient(false);
    setPatientMode("quick");
    setPatientForm(emptyPatientForm);
  }

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [
        profileResponse,
        professionalsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/profile`, {
          credentials: "include",
        }),

        fetch(
          `${API_URL}/admin/professionals`,
          {
            credentials: "include",
          },
        ),

        fetch(
          `${API_URL}/admin/appointments`,
          {
            credentials: "include",
          },
        ),
      ]);

      const profileData =
        await profileResponse.json();

      const professionalsData =
        await professionalsResponse.json();

      const appointmentsData =
        await appointmentsResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message ||
            "No se pudo identificar al usuario",
        );
      }

      if (!professionalsResponse.ok) {
        throw new Error(
          professionalsData.message ||
            "No se pudieron cargar los profesionales",
        );
      }

      if (!appointmentsResponse.ok) {
        throw new Error(
          appointmentsData.message ||
            "No se pudieron cargar los turnos",
        );
      }

      const activeProfessionals = (
        professionalsData.professionals || []
      ).filter(
        (professional) =>
          professional.active !== false,
      );

      setProfessionals(
        activeProfessionals,
      );

      setAppointments(
        appointmentsData.appointments || [],
      );

      const loggedUserId =
        profileData.user?.id;

      const loggedProfessional =
        activeProfessionals.find(
          (professional) =>
            Number(
              professional.user_id,
            ) === Number(loggedUserId),
        );

      if (loggedProfessional) {
        setForm((previous) => ({
          ...previous,
          professionalId: String(
            loggedProfessional.id,
          ),
          appointmentTypeId: "",
        }));
      }
    } catch (currentError) {
      console.error(currentError);

      setError(
        currentError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function searchPatients(
    searchValue,
  ) {
    if (!searchValue.trim()) {
      setPatientResults([]);
      return;
    }

    setSearchingPatients(true);

    try {
      const params =
        new URLSearchParams();

      params.set(
        "search",
        searchValue.trim(),
      );

      const response = await fetch(
        `${API_URL}/admin/patients?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudieron buscar los pacientes",
        );
      }

      setPatientResults(
        data.patients || [],
      );
    } catch (currentError) {
      console.error(currentError);

      setPatientResults([]);

      setError(
        currentError.message,
      );
    } finally {
      setSearchingPatients(false);
    }
  }

  async function loadProfessionalData(
    professionalId,
  ) {
    setError("");

    try {
      const [
        servicesResponse,
        availabilityResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/admin/professionals/${professionalId}/services`,
          {
            credentials: "include",
          },
        ),

        fetch(
          `${API_URL}/admin/professionals/${professionalId}/availability`,
          {
            credentials: "include",
          },
        ),
      ]);

      const servicesData =
        await servicesResponse.json();

      const availabilityData =
        await availabilityResponse.json();

      if (!servicesResponse.ok) {
        throw new Error(
          servicesData.message ||
            "No se pudieron cargar los servicios",
        );
      }

      if (!availabilityResponse.ok) {
        throw new Error(
          availabilityData.message ||
            "No se pudo cargar la disponibilidad",
        );
      }

      setServices(
        servicesData.services || [],
      );

      setAvailability(
        availabilityData.availability || [],
      );
    } catch (currentError) {
      console.error(currentError);

      setServices([]);
      setAvailability([]);

      setError(
        currentError.message,
      );
    }
  }

useEffect(() => {
  if (!open) return;

  loadInitialData();
}, [open]);

  useEffect(() => {
    if (!open) return;

    const cleanSearch =
      patientSearch.trim();

    if (!cleanSearch) {
      setPatientResults([]);
      setSearchingPatients(false);
      return;
    }

    if (selectedPatient) {
      return;
    }

    const timeout = setTimeout(() => {
      searchPatients(cleanSearch);
    }, 250);

    return () =>
      clearTimeout(timeout);
  }, [
    patientSearch,
    open,
    selectedPatient,
  ]);

  useEffect(() => {
    if (!form.professionalId) {
      setServices([]);
      setAvailability([]);

      setForm((previous) => ({
        ...previous,
        appointmentTypeId: "",
      }));

      return;
    }

    loadProfessionalData(
      form.professionalId,
    );
  }, [form.professionalId]);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePatientFieldChange = (
    event,
  ) => {
    const { name, value } =
      event.target;

    setPatientForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);

    setPatientSearch(
      `${patient.name}${
        patient.lastname
          ? ` ${patient.lastname}`
          : ""
      }`,
    );

    setPatientResults([]);
    setShowNewPatient(false);
    setError("");
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientResults([]);
  };

  const openNewPatient = () => {
    const searchParts = patientSearch
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    setPatientForm({
      ...emptyPatientForm,
      name: searchParts[0] || "",
      lastname:
        searchParts.length > 1
          ? searchParts
              .slice(1)
              .join(" ")
          : "",
    });

    setPatientMode("quick");
    setShowNewPatient(true);
    setSelectedPatient(null);
    setError("");
  };

  const cancelNewPatient = () => {
    setShowNewPatient(false);
    setPatientForm(
      emptyPatientForm,
    );
    setPatientMode("quick");
  };

  const createPatient = async () => {
    if (
      !patientForm.name.trim()
    ) {
      setError(
        "Ingresá al menos el nombre del paciente.",
      );

      return;
    }

    setSavingPatient(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/patients`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            ...patientForm,
            profileType:
              patientMode,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 409 &&
          data.existingPatient
        ) {
          setPatientResults([
            data.existingPatient,
          ]);

          throw new Error(
            `${data.message}. Podés seleccionar el paciente existente.`,
          );
        }

        throw new Error(
          data.message ||
            "No se pudo crear el paciente",
        );
      }

      setSelectedPatient(
        data.patient,
      );

      setPatientSearch(
        `${data.patient.name}${
          data.patient.lastname
            ? ` ${data.patient.lastname}`
            : ""
        }`,
      );

      setShowNewPatient(false);
      setPatientForm(
        emptyPatientForm,
      );
      setPatientMode("quick");
      setPatientResults([]);
    } catch (currentError) {
      console.error(currentError);

      setError(
        currentError.message,
      );
    } finally {
      setSavingPatient(false);
    }
  };

  const handleDateChange = (
    date,
  ) => {
    setForm((previous) => ({
      ...previous,
      date,
      startTime: "",
    }));
  };

  const handleTimeChange = (
    startTime,
  ) => {
    setForm((previous) => ({
      ...previous,
      startTime,
    }));
  };

  const resetForm = () => {
    setForm({
      professionalId: "",
      appointmentTypeId: "",
      date: "",
      startTime: "",
      notes: "",
    });

    resetPatientSection();

    setServices([]);
    setAvailability([]);
    setAppointments([]);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!selectedPatient) {
      setError(
        "Seleccioná o agregá un paciente.",
      );

      return;
    }

    if (!form.professionalId) {
      setError(
        "Seleccioná un profesional.",
      );

      return;
    }

    if (!form.appointmentTypeId) {
      setError(
        "Seleccioná un servicio.",
      );

      return;
    }

    if (!form.date) {
      setError(
        "Seleccioná una fecha.",
      );

      return;
    }

    if (!form.startTime) {
      setError(
        "Seleccioná un horario.",
      );

      return;
    }

    const backendDate =
      convertDateToBackend(
        form.date,
      );

    if (!backendDate) {
      setError(
        "La fecha seleccionada no es válida.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/appointments/overbooked`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            patientId: Number(
              selectedPatient.id,
            ),

            professionalId: Number(
              form.professionalId,
            ),

            appointmentTypeId: Number(
              form.appointmentTypeId,
            ),

            date: backendDate,

            startTime:
              form.startTime,

            notes:
              form.notes,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudo crear el sobreturno",
        );
      }

      resetForm();

      await onCreated();

      onClose();
    } catch (currentError) {
      console.error(currentError);

      setError(
        currentError.message,
      );
    } finally {
      setSaving(false);
    }
  };

  const professionalAppointments =
    appointments.filter(
      (appointment) =>
        Number(
          appointment.professional_id,
        ) ===
        Number(
          form.professionalId,
        ),
    );

  if (!open) {
    return null;
  }

  return (
    <div
      className="overbooked-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <section className="overbooked-modal">
        <div className="overbooked-header">
          <div>
            <p className="eyebrow">
              Agenda
            </p>

            <h2>
              Crear sobreturno
            </h2>

            <p>
              Elegí paciente,
              profesional, fecha y
              horario.
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

        {error && (
          <div className="overbooked-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="overbooked-loading">
            Cargando...
          </div>
        ) : (
          <form
            className="overbooked-form"
            onSubmit={handleSubmit}
          >
            <div className="patient-search-section">
              <label>
                Paciente *
              </label>

              {selectedPatient ? (
                <div className="selected-patient">
                  <div>
                    <strong>
                      {
                        selectedPatient.name
                      }{" "}
                      {
                        selectedPatient.lastname ||
                        ""
                      }
                    </strong>

                    <span>
                      {selectedPatient.dni
                        ? `DNI ${selectedPatient.dni}`
                        : selectedPatient.phone ||
                          "Sin teléfono"}
                    </span>

                    <span className="patient-profile-label">
                      {selectedPatient.profile_type ===
                      "complete"
                        ? "Ficha completa"
                        : "Paciente rápido"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      clearSelectedPatient
                    }
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <div className="patient-search-input">
                    <span>
                      🔎
                    </span>

                    <input
                      type="text"
                      value={
                        patientSearch
                      }
                      onChange={(
                        event,
                      ) =>
                        setPatientSearch(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Buscar por nombre, apellido, DNI o teléfono..."
                      autoComplete="off"
                    />
                  </div>

                  {patientSearch.trim() && (
                    <div className="patient-results">
                      {searchingPatients && (
                        <div className="patient-searching">
                          Buscando...
                        </div>
                      )}

                      {!searchingPatients &&
                        patientResults.map(
                          (patient) => (
                            <button
                              type="button"
                              className="patient-result"
                              key={
                                patient.id
                              }
                              onClick={() =>
                                selectPatient(
                                  patient,
                                )
                              }
                            >
                              <div>
                                <strong>
                                  {
                                    patient.name
                                  }{" "}
                                  {patient.lastname ||
                                    ""}
                                </strong>

                                <span>
                                  {[
                                    patient.dni
                                      ? `DNI ${patient.dni}`
                                      : null,
                                    patient.phone ||
                                      null,
                                  ]
                                    .filter(
                                      Boolean,
                                    )
                                    .join(
                                      " · ",
                                    ) ||
                                    "Sin datos adicionales"}
                                </span>
                              </div>

                              <span>
                                Seleccionar
                              </span>
                            </button>
                          ),
                        )}

                      {!searchingPatients &&
                        !showNewPatient && (
                          <button
                            type="button"
                            className="patient-add-result"
                            onClick={
                              openNewPatient
                            }
                          >
                            <span className="patient-plus">
                              +
                            </span>

                            <span>
                              Agregar "
                              {patientSearch.trim()}
                              " como nuevo
                              paciente
                            </span>
                          </button>
                        )}
                    </div>
                  )}
                </>
              )}
            </div>

            {showNewPatient && (
              <section className="new-patient-card">
                <div className="new-patient-header">
                  <div>
                    <h3>
                      Nuevo paciente
                    </h3>

                    <p>
                      Elegí cuánto
                      querés cargar
                      ahora.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      cancelNewPatient
                    }
                  >
                    ×
                  </button>
                </div>

                <div className="patient-mode-options">
                  <button
                    type="button"
                    className={
                      patientMode ===
                      "quick"
                        ? "patient-mode active"
                        : "patient-mode"
                    }
                    onClick={() =>
                      setPatientMode(
                        "quick",
                      )
                    }
                  >
                    <strong>
                      Paciente rápido
                    </strong>

                    <span>
                      Solo los datos
                      necesarios para
                      agendar.
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      patientMode ===
                      "complete"
                        ? "patient-mode active"
                        : "patient-mode"
                    }
                    onClick={() =>
                      setPatientMode(
                        "complete",
                      )
                    }
                  >
                    <strong>
                      Ficha completa
                    </strong>

                    <span>
                      Datos personales,
                      cobertura y
                      antecedentes.
                    </span>
                  </button>
                </div>

                <div className="new-patient-grid">
                  <label>
                    Nombre *

                    <input
                      name="name"
                      value={
                        patientForm.name
                      }
                      onChange={
                        handlePatientFieldChange
                      }
                    />
                  </label>

                  <label>
                    Apellido

                    <input
                      name="lastname"
                      value={
                        patientForm.lastname
                      }
                      onChange={
                        handlePatientFieldChange
                      }
                    />
                  </label>

                  <label>
                    Teléfono

                    <input
                      name="phone"
                      value={
                        patientForm.phone
                      }
                      onChange={
                        handlePatientFieldChange
                      }
                    />
                  </label>

                  {patientMode ===
                    "complete" && (
                    <>
                      <label>
                        DNI

                        <input
                          name="dni"
                          value={
                            patientForm.dni
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label>
                        Fecha de nacimiento

                        <input
                          type="date"
                          name="birthDate"
                          value={
                            patientForm.birthDate
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label>
                        Email

                        <input
                          type="email"
                          name="email"
                          value={
                            patientForm.email
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label className="patient-full-row">
                        Dirección

                        <input
                          name="address"
                          value={
                            patientForm.address
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <div className="patient-section-title patient-full-row">
                        Cobertura
                      </div>

                      <label>
                        Obra social /
                        prepaga

                        <input
                          name="healthInsurance"
                          value={
                            patientForm.healthInsurance
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label>
                        Plan

                        <input
                          name="healthInsurancePlan"
                          value={
                            patientForm.healthInsurancePlan
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label className="patient-full-row">
                        Número de afiliado

                        <input
                          name="memberNumber"
                          value={
                            patientForm.memberNumber
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <div className="patient-section-title patient-full-row">
                        Información clínica
                      </div>

                      <label className="patient-full-row">
                        Alergias

                        <textarea
                          rows="2"
                          name="allergies"
                          value={
                            patientForm.allergies
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label className="patient-full-row">
                        Medicación

                        <textarea
                          rows="2"
                          name="medications"
                          value={
                            patientForm.medications
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label className="patient-full-row">
                        Antecedentes

                        <textarea
                          rows="3"
                          name="medicalHistory"
                          value={
                            patientForm.medicalHistory
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>

                      <label className="patient-full-row">
                        Observaciones

                        <textarea
                          rows="3"
                          name="notes"
                          value={
                            patientForm.notes
                          }
                          onChange={
                            handlePatientFieldChange
                          }
                        />
                      </label>
                    </>
                  )}
                </div>

                <div className="new-patient-actions">
                  <button
                    type="button"
                    className="overbooked-cancel"
                    onClick={
                      cancelNewPatient
                    }
                    disabled={
                      savingPatient
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="overbooked-save"
                    onClick={
                      createPatient
                    }
                    disabled={
                      savingPatient
                    }
                  >
                    {savingPatient
                      ? "Guardando..."
                      : patientMode ===
                          "quick"
                        ? "Agregar paciente"
                        : "Guardar ficha"}
                  </button>
                </div>
              </section>
            )}

            <label>
              Profesional *

              <select
                name="professionalId"
                value={
                  form.professionalId
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="">
                  Seleccionar profesional
                </option>

                {professionals.map(
                  (professional) => (
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

            <label>
              Servicio *

              <select
                name="appointmentTypeId"
                value={
                  form.appointmentTypeId
                }
                onChange={
                  handleChange
                }
                disabled={
                  !form.professionalId
                }
                required
              >
                <option value="">
                  {form.professionalId
                    ? "Seleccionar servicio"
                    : "Primero elegí profesional"}
                </option>

                {services.map(
                  (service) => (
                    <option
                      key={
                        service.id
                      }
                      value={
                        service.id
                      }
                    >
                      {service.name} -{" "}
                      {
                        service.duration_minutes
                      }{" "}
                      min
                    </option>
                  ),
                )}
              </select>
            </label>

            {form.professionalId && (
              <AppointmentDatePicker
                selectedDate={
                  form.date
                }
                selectedTime={
                  form.startTime
                }
                onDateChange={
                  handleDateChange
                }
                onTimeChange={
                  handleTimeChange
                }
                availability={
                  availability
                }
                appointments={
                  professionalAppointments
                }
              />
            )}

            <label>
              Nota

              <textarea
                name="notes"
                rows="3"
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
                placeholder="Ej. Dolor fuerte, agregar después del turno anterior..."
              />
            </label>

            <div className="overbooked-warning">
              <strong>
                Sobreturno:
              </strong>{" "}
              podés seleccionar incluso
              un horario ocupado o fuera
              del horario habitual.
            </div>

            <div className="overbooked-buttons">
              <button
                type="button"
                className="overbooked-cancel"
                onClick={
                  handleClose
                }
                disabled={
                  saving
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="overbooked-save"
                disabled={
                  saving ||
                  !selectedPatient ||
                  !form.professionalId ||
                  !form.appointmentTypeId ||
                  !form.date ||
                  !form.startTime
                }
              >
                {saving
                  ? "Creando..."
                  : "Crear sobreturno"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default OverbookedAppointment;
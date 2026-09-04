import {
  useEffect,
  useState,
} from "react";

import ProfessionalManagement from "./ProfessionalManagement";
import ServiceManagement from "./ServiceManagement";
import "./Configuration.css";

const API_URL =
  "http://localhost:3000/api";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

function Configuration() {
  const [clinic, setClinic] =
    useState(null);

  const [
    professionals,
    setProfessionals,
  ] = useState([]);

  const [
    appointmentTypes,
    setAppointmentTypes,
  ] = useState([]);

  const [
    maxActiveAppointments,
    setMaxActiveAppointments,
  ] = useState(1);

  const [
    savingClinicSettings,
    setSavingClinicSettings,
  ] = useState(false);

  const [
    selectedProfessionalId,
    setSelectedProfessionalId,
  ] = useState("");

  const [
    selectedServices,
    setSelectedServices,
  ] = useState([]);

  const [
    availability,
    setAvailability,
  ] = useState([]);

  const [
    newSchedule,
    setNewSchedule,
  ] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "12:00",
  });

  const [
    savingServices,
    setSavingServices,
  ] = useState(false);

  const [
    savingAvailability,
    setSavingAvailability,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadSelectedProfessional =
      async () => {
        if (
          !selectedProfessionalId
        ) {
          setSelectedServices([]);
          setAvailability([]);
          return;
        }

        setSelectedServices([]);
        setAvailability([]);

        await Promise.all([
          loadProfessionalServices(
            selectedProfessionalId,
          ),

          loadProfessionalAvailability(
            selectedProfessionalId,
          ),
        ]);
      };

    loadSelectedProfessional();
  }, [selectedProfessionalId]);

  const showSuccess = (
    text,
  ) => {
    setError("");
    setMessage(text);
  };

  const showError = (
    text,
  ) => {
    setMessage("");
    setError(text);
  };

  const loadAppointmentTypes =
    async () => {
      const response =
        await fetch(
          `${API_URL}/admin/appointment-types`,
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
            "No se pudieron cargar los servicios",
        );
      }

      setAppointmentTypes(
        data.appointmentTypes ||
          [],
      );
    };

  const loadProfessionals =
    async (
      clinicId =
        clinic?.id,
    ) => {
      if (!clinicId) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals?clinicId=${clinicId}`,
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
              "No se pudieron cargar los profesionales",
          );
        }

        setProfessionals(
          data.professionals ||
            [],
        );

        const selectedStillExists =
          (
            data.professionals ||
            []
          ).some(
            (professional) =>
              String(
                professional.id,
              ) ===
              selectedProfessionalId,
          );

        if (
          selectedProfessionalId &&
          !selectedStillExists
        ) {
          setSelectedProfessionalId(
            "",
          );
        }
      } catch (currentError) {
        console.error(
          currentError,
        );

        showError(
          currentError.message,
        );
      }
    };

  const loadInitialData =
    async () => {
      setLoading(true);

      try {
        const clinicsResponse =
          await fetch(
            `${API_URL}/admin/clinics`,
            {
              credentials:
                "include",
            },
          );

        const clinicsData =
          await clinicsResponse.json();

        if (
          !clinicsResponse.ok
        ) {
          throw new Error(
            clinicsData.message ||
              "No se pudo cargar el consultorio",
          );
        }

        await loadAppointmentTypes();

        const clinics =
          clinicsData.clinics ||
          [];

        if (
          clinics.length === 0
        ) {
          setClinic(null);

          showError(
            "El consultorio todavía no fue configurado por el administrador.",
          );

          return;
        }

        const currentClinic =
          clinics[0];

        setClinic(
          currentClinic,
        );

        setMaxActiveAppointments(
          Number(
            currentClinic
              .max_active_appointments_per_patient ||
              1,
          ),
        );

        await loadProfessionals(
          currentClinic.id,
        );
      } catch (currentError) {
        console.error(
          currentError,
        );

        showError(
          currentError.message,
        );
      } finally {
        setLoading(false);
      }
    };

  const saveClinicSettings =
    async () => {
      if (!clinic) {
        showError(
          "El consultorio no está configurado.",
        );

        return;
      }

      const value =
        Number(
          maxActiveAppointments,
        );

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        showError(
          "El límite debe estar entre 1 y 5.",
        );

        return;
      }

      setSavingClinicSettings(
        true,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/clinics/${clinic.id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  name:
                    clinic.name,

                  phone:
                    clinic.phone ||
                    "",

                  email:
                    clinic.email ||
                    "",

                  address:
                    clinic.address ||
                    "",

                  active:
                    clinic.active !==
                    false,

                  maxActiveAppointmentsPerPatient:
                    value,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo guardar la configuración",
          );
        }

        setClinic(
          data.clinic,
        );

        showSuccess(
          "Límite de turnos actualizado.",
        );
      } catch (currentError) {
        showError(
          currentError.message,
        );
      } finally {
        setSavingClinicSettings(
          false,
        );
      }
    };

  const loadProfessionalServices =
    async (
      professionalId,
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals/${professionalId}/services`,
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
              "No se pudieron cargar los servicios",
          );
        }

        setSelectedServices(
          (
            data.services ||
            []
          ).map(
            (service) =>
              Number(
                service.id,
              ),
          ),
        );
      } catch (currentError) {
        setSelectedServices(
          [],
        );

        showError(
          currentError.message,
        );
      }
    };

  const loadProfessionalAvailability =
    async (
      professionalId,
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals/${professionalId}/availability`,
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
              "No se pudieron cargar los horarios",
          );
        }

        setAvailability(
          (
            data.availability ||
            []
          ).map(
            (item) => ({
              dayOfWeek:
                Number(
                  item.day_of_week,
                ),

              startTime:
                item.start_time.slice(
                  0,
                  5,
                ),

              endTime:
                item.end_time.slice(
                  0,
                  5,
                ),

              active:
                item.active !==
                false,
            }),
          ),
        );
      } catch (currentError) {
        setAvailability([]);

        showError(
          currentError.message,
        );
      }
    };

  const toggleService = (
    serviceId,
  ) => {
    const service =
      appointmentTypes.find(
        (item) =>
          Number(item.id) ===
          Number(serviceId),
      );

    if (
      service &&
      service.active === false
    ) {
      return;
    }

    const numericId =
      Number(serviceId);

    setSelectedServices(
      (previous) =>
        previous.includes(
          numericId,
        )
          ? previous.filter(
              (id) =>
                id !==
                numericId,
            )
          : [
              ...previous,
              numericId,
            ],
    );
  };

  const saveProfessionalServices =
    async () => {
      if (
        !selectedProfessionalId
      ) {
        showError(
          "Seleccioná un profesional.",
        );

        return;
      }

      setSavingServices(
        true,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals/${selectedProfessionalId}/services`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  appointmentTypeIds:
                    selectedServices,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudieron guardar los servicios",
          );
        }

        showSuccess(
          "Servicios del profesional actualizados.",
        );
      } catch (currentError) {
        showError(
          currentError.message,
        );
      } finally {
        setSavingServices(
          false,
        );
      }
    };

  const handleNewScheduleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setNewSchedule(
        (previous) => ({
          ...previous,

          [name]:
            name ===
            "dayOfWeek"
              ? Number(
                  value,
                )
              : value,
        }),
      );
    };

  const addSchedule = () => {
    if (
      !newSchedule.startTime ||
      !newSchedule.endTime
    ) {
      showError(
        "Debes indicar horario de inicio y finalización.",
      );

      return;
    }

    if (
      newSchedule.startTime >=
      newSchedule.endTime
    ) {
      showError(
        "El horario de inicio debe ser anterior al horario de finalización.",
      );

      return;
    }

    const overlaps =
      availability.some(
        (schedule) =>
          schedule.dayOfWeek ===
            newSchedule.dayOfWeek &&
          newSchedule.startTime <
            schedule.endTime &&
          newSchedule.endTime >
            schedule.startTime,
      );

    if (overlaps) {
      showError(
        "La nueva franja se superpone con otro horario del mismo día.",
      );

      return;
    }

    setAvailability(
      (previous) => [
        ...previous,

        {
          ...newSchedule,
          active: true,
        },
      ],
    );

    setMessage("");
    setError("");
  };

  const removeSchedule = (
    indexToRemove,
  ) => {
    setAvailability(
      (previous) =>
        previous.filter(
          (_, index) =>
            index !==
            indexToRemove,
        ),
    );
  };

  const saveProfessionalAvailability =
    async () => {
      if (
        !selectedProfessionalId
      ) {
        showError(
          "Seleccioná un profesional.",
        );

        return;
      }

      setSavingAvailability(
        true,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals/${selectedProfessionalId}/availability`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  availability,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudieron guardar los horarios",
          );
        }

        setAvailability(
          (
            data.availability ||
            []
          ).map(
            (item) => ({
              dayOfWeek:
                Number(
                  item.day_of_week,
                ),

              startTime:
                item.start_time.slice(
                  0,
                  5,
                ),

              endTime:
                item.end_time.slice(
                  0,
                  5,
                ),

              active:
                item.active !==
                false,
            }),
          ),
        );

        showSuccess(
          "Horarios del profesional actualizados.",
        );
      } catch (currentError) {
        showError(
          currentError.message,
        );
      } finally {
        setSavingAvailability(
          false,
        );
      }
    };

  const getDayLabel = (
    dayOfWeek,
  ) =>
    DAYS.find(
      (day) =>
        day.value ===
        dayOfWeek,
    )?.label || "Día";

  const selectedProfessional =
    professionals.find(
      (professional) =>
        String(
          professional.id,
        ) ===
        selectedProfessionalId,
    );

  if (loading) {
    return (
      <div className="configuration-empty">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="configuration">
      <div className="configuration-heading">
        <div>
          <p className="eyebrow">
            Administración
          </p>

          <h2>
            Configuración
          </h2>
        </div>

        <p className="configuration-description">
          Administrá el consultorio,
          profesionales, servicios y
          horarios.
        </p>
      </div>

      {message && (
        <div className="configuration-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="configuration-message error">
          {error}
        </div>
      )}

      <section className="configuration-card">
        <div className="configuration-card-heading">
          <div className="configuration-number">
            1
          </div>

          <div>
            <h3>
              Consultorio
            </h3>

            <p>
              Configuración general de
              esta instalación.
            </p>
          </div>
        </div>

        {clinic ? (
          <>
            <div>
              <h3>
                {clinic.name}
              </h3>

              {clinic.address && (
                <p>
                  📍 {clinic.address}
                </p>
              )}

              {clinic.phone && (
                <p>
                  📱 {clinic.phone}
                </p>
              )}

              {clinic.email && (
                <p>
                  ✉️ {clinic.email}
                </p>
              )}
            </div>

            <div className="configuration-form">
              <label className="configuration-field">
                Máximo de turnos activos
                por paciente

                <select
                  value={
                    maxActiveAppointments
                  }
                  onChange={(
                    event,
                  ) =>
                    setMaxActiveAppointments(
                      Number(
                        event.target
                          .value,
                      ),
                    )
                  }
                >
                  {[1, 2, 3, 4, 5].map(
                    (value) => (
                      <option
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {value}{" "}
                        {value === 1
                          ? "turno"
                          : "turnos"}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <button
                type="button"
                className="configuration-primary-button"
                onClick={
                  saveClinicSettings
                }
                disabled={
                  savingClinicSettings
                }
              >
                {savingClinicSettings
                  ? "Guardando..."
                  : "Guardar límite"}
              </button>
            </div>
          </>
        ) : (
          <div className="configuration-empty small">
            Consultorio no
            configurado.
          </div>
        )}
      </section>

      <ProfessionalManagement
        clinic={clinic}
        professionals={
          professionals
        }
        setProfessionals={
          setProfessionals
        }
        selectedProfessionalId={
          selectedProfessionalId
        }
        setSelectedProfessionalId={
          setSelectedProfessionalId
        }
        reloadProfessionals={() =>
          loadProfessionals(
            clinic?.id,
          )
        }
        showSuccess={
          showSuccess
        }
        showError={
          showError
        }
      />

      <ServiceManagement
        services={
          appointmentTypes
        }
        onChanged={
          loadAppointmentTypes
        }
        showSuccess={
          showSuccess
        }
        showError={
          showError
        }
      />

      <section className="configuration-card">
        <div className="configuration-card-heading">
          <div className="configuration-number">
            4
          </div>

          <div>
            <h3>
              Servicios del profesional
            </h3>

            <p>
              {selectedProfessional
                ? `Configurando servicios de ${selectedProfessional.name} ${selectedProfessional.lastname}.`
                : "Definí qué servicios realiza el profesional seleccionado."}
            </p>
          </div>
        </div>

        {!selectedProfessionalId ? (
          <div className="configuration-empty small">
            Seleccioná un profesional.
          </div>
        ) : (
          <>
            <div className="services-grid">
              {appointmentTypes.map(
                (service) => (
                  <label
                    className="service-option"
                    key={
                      service.id
                    }
                  >
                    <input
                      type="checkbox"
                      disabled={
                        service.active ===
                        false
                      }
                      checked={selectedServices.includes(
                        Number(
                          service.id,
                        ),
                      )}
                      onChange={() =>
                        toggleService(
                          service.id,
                        )
                      }
                    />

                    <div>
                      <strong>
                        {service.name}
                      </strong>

                      <span>
                        {
                          service.duration_minutes
                        }{" "}
                        min
                        {service.active
                          ? ""
                          : " · Inactivo"}
                      </span>
                    </div>
                  </label>
                ),
              )}
            </div>

            <button
              className="configuration-primary-button"
              type="button"
              onClick={
                saveProfessionalServices
              }
              disabled={
                savingServices
              }
            >
              {savingServices
                ? "Guardando..."
                : "Guardar servicios"}
            </button>
          </>
        )}
      </section>

      <section className="configuration-card">
        <div className="configuration-card-heading">
          <div className="configuration-number">
            5
          </div>

          <div>
            <h3>
              Días y horarios
            </h3>

            <p>
              {selectedProfessional
                ? `Disponibilidad de ${selectedProfessional.name} ${selectedProfessional.lastname}.`
                : "Configurá la disponibilidad del profesional seleccionado."}
            </p>
          </div>
        </div>

        {!selectedProfessionalId ? (
          <div className="configuration-empty small">
            Seleccioná un profesional.
          </div>
        ) : (
          <>
            {availability.length >
            0 ? (
              <div className="availability-list">
                {availability
                  .map(
                    (
                      schedule,
                      index,
                    ) => ({
                      ...schedule,

                      originalIndex:
                        index,
                    }),
                  )
                  .sort(
                    (a, b) =>
                      a.dayOfWeek -
                        b.dayOfWeek ||
                      a.startTime.localeCompare(
                        b.startTime,
                      ),
                  )
                  .map(
                    (schedule) => (
                      <div
                        className="availability-item"
                        key={`${schedule.dayOfWeek}-${schedule.startTime}-${schedule.endTime}-${schedule.originalIndex}`}
                      >
                        <div>
                          <strong>
                            {getDayLabel(
                              schedule.dayOfWeek,
                            )}
                          </strong>

                          <span>
                            {
                              schedule.startTime
                            }{" "}
                            a{" "}
                            {
                              schedule.endTime
                            }
                          </span>
                        </div>

                        <button
                          type="button"
                          className="availability-remove-button"
                          onClick={() =>
                            removeSchedule(
                              schedule.originalIndex,
                            )
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    ),
                  )}
              </div>
            ) : (
              <div className="configuration-empty small">
                No hay horarios
                cargados.
              </div>
            )}

            <div className="availability-form">
              <label className="configuration-field">
                Día

                <select
                  name="dayOfWeek"
                  value={
                    newSchedule.dayOfWeek
                  }
                  onChange={
                    handleNewScheduleChange
                  }
                >
                  {DAYS.map(
                    (day) => (
                      <option
                        key={
                          day.value
                        }
                        value={
                          day.value
                        }
                      >
                        {
                          day.label
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="configuration-field">
                Desde

                <input
                  type="time"
                  name="startTime"
                  value={
                    newSchedule.startTime
                  }
                  onChange={
                    handleNewScheduleChange
                  }
                />
              </label>

              <label className="configuration-field">
                Hasta

                <input
                  type="time"
                  name="endTime"
                  value={
                    newSchedule.endTime
                  }
                  onChange={
                    handleNewScheduleChange
                  }
                />
              </label>

              <button
                type="button"
                className="configuration-primary-button"
                onClick={
                  addSchedule
                }
              >
                Agregar horario
              </button>
            </div>

            <button
              type="button"
              className="configuration-primary-button"
              onClick={
                saveProfessionalAvailability
              }
              disabled={
                savingAvailability
              }
            >
              {savingAvailability
                ? "Guardando..."
                : "Guardar horarios"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default Configuration;
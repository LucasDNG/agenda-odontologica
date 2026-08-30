import { useEffect, useState } from "react";
import "./Configuration.css";

const API_URL = "http://localhost:3000/api";

function Configuration() {
  const [clinic, setClinic] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);

  const [selectedProfessionalId, setSelectedProfessionalId] =
    useState("");

  const [professionalForm, setProfessionalForm] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    specialty: "",
  });

  const [selectedServices, setSelectedServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingProfessional, setSavingProfessional] =
    useState(false);
  const [savingServices, setSavingServices] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

 useEffect(() => {
  const updateSelectedProfessionalServices = async () => {
    if (!selectedProfessionalId) {
      setSelectedServices([]);
      return;
    }

    setSelectedServices([]);

    await loadProfessionalServices(
      selectedProfessionalId,
    );
  };

  updateSelectedProfessionalServices();
}, [selectedProfessionalId]);

  const showSuccess = (text) => {
    setError("");
    setMessage(text);
  };

  const showError = (text) => {
    setMessage("");
    setError(text);
  };

  const loadInitialData = async () => {
    setLoading(true);

    try {
      const [clinicsResponse, servicesResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/clinics`, {
            credentials: "include",
          }),

          fetch(`${API_URL}/appointment-types`, {
            credentials: "include",
          }),
        ]);

      const clinicsData = await clinicsResponse.json();
      const servicesData = await servicesResponse.json();

      if (!clinicsResponse.ok) {
        throw new Error(
          clinicsData.message ||
            "No se pudo cargar el consultorio",
        );
      }

      if (!servicesResponse.ok) {
        throw new Error(
          servicesData.message ||
            "No se pudieron cargar los servicios",
        );
      }

      const clinics = clinicsData.clinics || [];

      if (clinics.length === 0) {
        setClinic(null);

        showError(
          "El consultorio todavía no fue configurado por el administrador.",
        );
      } else {
        const currentClinic = clinics[0];

        setClinic(currentClinic);

        await loadProfessionals(currentClinic.id);
      }

      const types =
        servicesData.appointmentTypes ||
        servicesData.appointment_types ||
        servicesData.types ||
        [];

      setAppointmentTypes(types);
    } catch (currentError) {
      console.error(currentError);
      showError(currentError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionals = async (clinicId) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/professionals?clinicId=${clinicId}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudieron cargar los profesionales",
        );
      }

      setProfessionals(data.professionals || []);
    } catch (currentError) {
      console.error(currentError);
      showError(currentError.message);
    }
  };

const loadProfessionalServices = async (
  professionalId,
) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/services`,
      {
        credentials: "include",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "No se pudieron cargar los servicios",
      );
    }

    const serviceIds = (data.services || []).map(
      (service) => Number(service.id),
    );

    setSelectedServices(serviceIds);
  } catch (currentError) {
    console.error(currentError);

    setSelectedServices([]);

    showError(currentError.message);
  }
};

  const handleProfessionalChange = (event) => {
    const { name, value } = event.target;

    setProfessionalForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createProfessional = async (event) => {
    event.preventDefault();

    if (!clinic) {
      showError(
        "El consultorio todavía no está configurado.",
      );
      return;
    }

    if (
      !professionalForm.name.trim() ||
      !professionalForm.lastname.trim()
    ) {
      showError(
        "Nombre y apellido del profesional son obligatorios.",
      );
      return;
    }

    setSavingProfessional(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/professionals`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            clinicId: clinic.id,
            name: professionalForm.name,
            lastname: professionalForm.lastname,
            phone: professionalForm.phone,
            email: professionalForm.email,
            specialty: professionalForm.specialty,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "No se pudo crear el profesional",
        );
      }

      setProfessionals((previous) => [
        ...previous,
        data.professional,
      ]);

      setProfessionalForm({
        name: "",
        lastname: "",
        phone: "",
        email: "",
        specialty: "",
      });

      setSelectedProfessionalId(
        String(data.professional.id),
      );

      showSuccess(
        "Profesional agregado correctamente.",
      );
    } catch (currentError) {
      console.error(currentError);
      showError(currentError.message);
    } finally {
      setSavingProfessional(false);
    }
  };

  const toggleService = (serviceId) => {
    const numericId = Number(serviceId);

    setSelectedServices((previous) => {
      if (previous.includes(numericId)) {
        return previous.filter(
          (id) => id !== numericId,
        );
      }

      return [...previous, numericId];
    });
  };

  const saveProfessionalServices = async () => {
    if (!selectedProfessionalId) {
      showError("Seleccioná un profesional.");
      return;
    }

    setSavingServices(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/professionals/${selectedProfessionalId}/services`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            appointmentTypeIds: selectedServices,
          }),
        },
      );

      const data = await response.json();

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
      console.error(currentError);
      showError(currentError.message);
    } finally {
      setSavingServices(false);
    }
  };

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
          <p className="eyebrow">Administración</p>
          <h2>Configuración</h2>
        </div>

        <p className="configuration-description">
          Administrá los profesionales y los servicios
          disponibles del consultorio.
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
          <div className="configuration-number">1</div>

          <div>
            <h3>Consultorio</h3>
            <p>
              Información general de esta instalación.
            </p>
          </div>
        </div>

        {clinic ? (
          <div>
            <h3>{clinic.name}</h3>

            {clinic.address && (
              <p>📍 {clinic.address}</p>
            )}

            {clinic.phone && (
              <p>📱 {clinic.phone}</p>
            )}

            {clinic.email && (
              <p>✉️ {clinic.email}</p>
            )}
          </div>
        ) : (
          <div className="configuration-empty small">
            Consultorio no configurado.
          </div>
        )}
      </section>

      <section className="configuration-card">
        <div className="configuration-card-heading">
          <div className="configuration-number">2</div>

          <div>
            <h3>Profesionales</h3>

            <p>
              Agregá los odontólogos que trabajan en el
              consultorio.
            </p>
          </div>
        </div>

        {!clinic ? (
          <div className="configuration-empty small">
            El administrador debe configurar primero el
            consultorio.
          </div>
        ) : (
          <>
            {professionals.length > 0 ? (
              <div className="professionals-list">
                {professionals.map((professional) => (
                  <button
                    key={professional.id}
                    type="button"
                    className={
                      String(professional.id) ===
                      selectedProfessionalId
                        ? "professional-item active"
                        : "professional-item"
                    }
                    onClick={() =>
                      setSelectedProfessionalId(
                        String(professional.id),
                      )
                    }
                  >
                    <strong>
                      {professional.name}{" "}
                      {professional.lastname}
                    </strong>

                    <span>
                      {professional.specialty ||
                        "Sin especialidad especificada"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="configuration-empty small">
                Todavía no hay profesionales cargados.
              </div>
            )}

            <details className="configuration-details">
              <summary>Agregar profesional</summary>

              <form
                className="configuration-form"
                onSubmit={createProfessional}
              >
                <div className="configuration-grid">
                  <label className="configuration-field">
                    Nombre *
                    <input
                      name="name"
                      value={professionalForm.name}
                      onChange={
                        handleProfessionalChange
                      }
                      placeholder="Nombre"
                    />
                  </label>

                  <label className="configuration-field">
                    Apellido *
                    <input
                      name="lastname"
                      value={
                        professionalForm.lastname
                      }
                      onChange={
                        handleProfessionalChange
                      }
                      placeholder="Apellido"
                    />
                  </label>

                  <label className="configuration-field">
                    Especialidad
                    <input
                      name="specialty"
                      value={
                        professionalForm.specialty
                      }
                      onChange={
                        handleProfessionalChange
                      }
                      placeholder="Ej. Ortodoncia"
                    />
                  </label>

                  <label className="configuration-field">
                    Teléfono
                    <input
                      name="phone"
                      value={professionalForm.phone}
                      onChange={
                        handleProfessionalChange
                      }
                      placeholder="Teléfono"
                    />
                  </label>

                  <label className="configuration-field">
                    Email
                    <input
                      type="email"
                      name="email"
                      value={professionalForm.email}
                      onChange={
                        handleProfessionalChange
                      }
                      placeholder="Email"
                    />
                  </label>
                </div>

                <button
                  className="configuration-primary-button"
                  type="submit"
                  disabled={savingProfessional}
                >
                  {savingProfessional
                    ? "Guardando..."
                    : "Agregar profesional"}
                </button>
              </form>
            </details>
          </>
        )}
      </section>

      <section className="configuration-card">
        <div className="configuration-card-heading">
          <div className="configuration-number">3</div>

          <div>
            <h3>Servicios del profesional</h3>

            <p>
              Elegí un profesional y definí qué servicios
              realiza.
            </p>
          </div>
        </div>

        {!selectedProfessionalId ? (
          <div className="configuration-empty small">
            Seleccioná un profesional.
          </div>
        ) : appointmentTypes.length === 0 ? (
          <div className="configuration-empty small">
            No hay servicios cargados.
          </div>
        ) : (
          <>
            <div className="services-grid">
              {appointmentTypes.map((service) => (
                <label
                  className="service-option"
                  key={service.id}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(
                      Number(service.id),
                    )}
                    onChange={() =>
                      toggleService(service.id)
                    }
                  />

                  <div>
                    <strong>{service.name}</strong>

                    <span>
                      {service.duration_minutes} minutos
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <button
              className="configuration-primary-button"
              type="button"
              onClick={saveProfessionalServices}
              disabled={savingServices}
            >
              {savingServices
                ? "Guardando..."
                : "Guardar servicios"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default Configuration;
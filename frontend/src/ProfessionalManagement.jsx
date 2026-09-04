import {
  useEffect,
  useState,
} from "react";

import "./ProfessionalManagement.css";

const API_URL =
  "http://localhost:3000/api";

const EMPTY_FORM = {
  name: "",
  lastname: "",
  phone: "",
  email: "",
  specialty: "",
};

function ProfessionalManagement({
  clinic,
  professionals,
  setProfessionals,
  selectedProfessionalId,
  setSelectedProfessionalId,
  reloadProfessionals,
  showSuccess,
  showError,
}) {
  const [
    professionalForm,
    setProfessionalForm,
  ] = useState(EMPTY_FORM);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    editForm,
    setEditForm,
  ] = useState(EMPTY_FORM);

  const [
    savingId,
    setSavingId,
  ] = useState(null);

  const [
    accessProfessional,
    setAccessProfessional,
  ] = useState(null);

  const [
    accessEmail,
    setAccessEmail,
  ] = useState("");

  const [
    accessPassword,
    setAccessPassword,
  ] = useState("");

  const [
    creatingAccess,
    setCreatingAccess,
  ] = useState(false);

  useEffect(() => {
    if (!accessProfessional) {
      setAccessEmail("");
      setAccessPassword("");
      return;
    }

    setAccessEmail(
      accessProfessional.email || "",
    );

    setAccessPassword("");
  }, [accessProfessional]);

  const handleCreateChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfessionalForm(
      (previous) => ({
        ...previous,
        [name]: value,
      }),
    );
  };

  const handleEditChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setEditForm(
      (previous) => ({
        ...previous,
        [name]: value,
      }),
    );
  };

  const createProfessional =
    async (event) => {
      event.preventDefault();

      if (!clinic) {
        showError(
          "El consultorio no está configurado.",
        );

        return;
      }

      if (
        !professionalForm.name.trim() ||
        !professionalForm.lastname.trim()
      ) {
        showError(
          "Nombre y apellido son obligatorios.",
        );

        return;
      }

      setCreating(true);

      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  clinicId:
                    clinic.id,

                  name:
                    professionalForm.name,

                  lastname:
                    professionalForm.lastname,

                  phone:
                    professionalForm.phone,

                  email:
                    professionalForm.email,

                  specialty:
                    professionalForm.specialty,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo crear el profesional",
          );
        }

        setProfessionalForm(
          EMPTY_FORM,
        );

        await reloadProfessionals();

        setSelectedProfessionalId(
          String(
            data.professional.id,
          ),
        );

        showSuccess(
          "Profesional agregado correctamente.",
        );
      } catch (error) {
        console.error(error);

        showError(
          error.message,
        );
      } finally {
        setCreating(false);
      }
    };

  const startEditing = (
    professional,
  ) => {
    setEditingId(
      professional.id,
    );

    setEditForm({
      name:
        professional.name || "",

      lastname:
        professional.lastname || "",

      phone:
        professional.phone || "",

      email:
        professional.email || "",

      specialty:
        professional.specialty || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);

    setEditForm(
      EMPTY_FORM,
    );
  };

  const saveProfessional =
    async (
      professional,
      active =
        professional.active,
    ) => {
      const isEditing =
        editingId ===
        professional.id;

      const values =
        isEditing
          ? editForm
          : {
              name:
                professional.name ||
                "",

              lastname:
                professional.lastname ||
                "",

              phone:
                professional.phone ||
                "",

              email:
                professional.email ||
                "",

              specialty:
                professional.specialty ||
                "",
            };

      if (
        !values.name.trim() ||
        !values.lastname.trim()
      ) {
        showError(
          "Nombre y apellido son obligatorios.",
        );

        return;
      }

      setSavingId(
        professional.id,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals/${professional.id}`,
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
                  clinicId:
                    professional.clinic_id,

                  userId:
                    professional.user_id,

                  name:
                    values.name.trim(),

                  lastname:
                    values.lastname.trim(),

                  phone:
                    values.phone.trim(),

                  email:
                    values.email.trim(),

                  specialty:
                    values.specialty.trim(),

                  active,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo actualizar el profesional",
          );
        }

        cancelEditing();

        await reloadProfessionals();

        showSuccess(
          active === false
            ? "Profesional desactivado."
            : professional.active ===
                false
              ? "Profesional activado."
              : "Profesional actualizado.",
        );
      } catch (error) {
        console.error(error);

        showError(
          error.message,
        );
      } finally {
        setSavingId(null);
      }
    };

  const createAccess =
    async (event) => {
      event.preventDefault();

      if (
        !accessProfessional
      ) {
        return;
      }

      if (
        !accessEmail.trim()
      ) {
        showError(
          "El email es obligatorio.",
        );

        return;
      }

      if (
        accessPassword.length <
        6
      ) {
        showError(
          "La contraseña debe tener al menos 6 caracteres.",
        );

        return;
      }

      setCreatingAccess(
        true,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/professionals/${accessProfessional.id}/access`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify({
                  email:
                    accessEmail
                      .trim()
                      .toLowerCase(),

                  password:
                    accessPassword,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo crear el acceso",
          );
        }

        setAccessProfessional(
          null,
        );

        await reloadProfessionals();

        showSuccess(
          "Acceso profesional creado correctamente.",
        );
      } catch (error) {
        console.error(error);

        showError(
          error.message,
        );
      } finally {
        setCreatingAccess(
          false,
        );
      }
    };

  return (
    <>
      <section className="configuration-card">
        <div className="configuration-card-heading">
          <div className="configuration-number">
            2
          </div>

          <div>
            <h3>
              Profesionales
            </h3>

            <p>
              Administrá odontólogos,
              datos personales y
              accesos al sistema.
            </p>
          </div>
        </div>

        {professionals.length ===
        0 ? (
          <div className="configuration-empty small">
            Todavía no hay
            profesionales cargados.
          </div>
        ) : (
          <div className="professional-admin-list">
            {professionals.map(
              (professional) => {
                const isEditing =
                  editingId ===
                  professional.id;

                const isSelected =
                  String(
                    professional.id,
                  ) ===
                  selectedProfessionalId;

                return (
                  <article
                    key={
                      professional.id
                    }
                    className={
                      [
                        "professional-admin-card",

                        isSelected
                          ? "selected"
                          : "",

                        professional.active
                          ? ""
                          : "inactive",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    {isEditing ? (
                      <div className="professional-edit-grid">
                        <label className="configuration-field">
                          Nombre

                          <input
                            name="name"
                            value={
                              editForm.name
                            }
                            onChange={
                              handleEditChange
                            }
                          />
                        </label>

                        <label className="configuration-field">
                          Apellido

                          <input
                            name="lastname"
                            value={
                              editForm.lastname
                            }
                            onChange={
                              handleEditChange
                            }
                          />
                        </label>

                        <label className="configuration-field">
                          Especialidad

                          <input
                            name="specialty"
                            value={
                              editForm.specialty
                            }
                            onChange={
                              handleEditChange
                            }
                          />
                        </label>

                        <label className="configuration-field">
                          Teléfono

                          <input
                            name="phone"
                            value={
                              editForm.phone
                            }
                            onChange={
                              handleEditChange
                            }
                          />
                        </label>

                        <label className="configuration-field">
                          Email

                          <input
                            type="email"
                            name="email"
                            value={
                              editForm.email
                            }
                            onChange={
                              handleEditChange
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="professional-admin-main"
                        onClick={() =>
                          setSelectedProfessionalId(
                            String(
                              professional.id,
                            ),
                          )
                        }
                      >
                        <div className="professional-avatar">
                          {professional.name
                            ?.slice(0, 1)
                            .toUpperCase()}
                          {professional.lastname
                            ?.slice(0, 1)
                            .toUpperCase()}
                        </div>

                        <div className="professional-admin-info">
                          <div className="professional-admin-name-row">
                            <strong>
                              {
                                professional.name
                              }{" "}
                              {
                                professional.lastname
                              }
                            </strong>

                            <span
                              className={
                                professional.active
                                  ? "professional-status active"
                                  : "professional-status inactive"
                              }
                            >
                              {professional.active
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </div>

                          <span>
                            {professional.specialty ||
                              "Odontología"}
                          </span>

                          {professional.email && (
                            <small>
                              ✉️{" "}
                              {
                                professional.email
                              }
                            </small>
                          )}

                          {professional.phone && (
                            <small>
                              📱{" "}
                              {
                                professional.phone
                              }
                            </small>
                          )}
                        </div>
                      </button>
                    )}

                    <div className="professional-access-state">
                      {professional.user_id ? (
                        <span className="access-badge created">
                          ✓ Acceso creado
                        </span>
                      ) : (
                        <span className="access-badge pending">
                          Sin acceso al
                          panel
                        </span>
                      )}
                    </div>

                    <div className="professional-admin-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="professional-secondary-button"
                            onClick={
                              cancelEditing
                            }
                            disabled={
                              savingId ===
                              professional.id
                            }
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            className="configuration-primary-button"
                            onClick={() =>
                              saveProfessional(
                                professional,
                              )
                            }
                            disabled={
                              savingId ===
                              professional.id
                            }
                          >
                            {savingId ===
                            professional.id
                              ? "Guardando..."
                              : "Guardar datos"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="professional-secondary-button"
                            onClick={() =>
                              startEditing(
                                professional,
                              )
                            }
                          >
                            Editar
                          </button>

                          {!professional.user_id &&
                            professional.active && (
                              <button
                                type="button"
                                className="professional-access-button"
                                onClick={() =>
                                  setAccessProfessional(
                                    professional,
                                  )
                                }
                              >
                                Crear acceso
                              </button>
                            )}

                          <button
                            type="button"
                            className={
                              professional.active
                                ? "professional-disable-button"
                                : "professional-enable-button"
                            }
                            disabled={
                              savingId ===
                              professional.id
                            }
                            onClick={() =>
                              saveProfessional(
                                professional,
                                !professional.active,
                              )
                            }
                          >
                            {savingId ===
                            professional.id
                              ? "Guardando..."
                              : professional.active
                                ? "Desactivar"
                                : "Activar"}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}

        <details className="configuration-details">
          <summary>
            Agregar profesional
          </summary>

          <form
            className="configuration-form"
            onSubmit={
              createProfessional
            }
          >
            <div className="configuration-grid">
              <label className="configuration-field">
                Nombre *

                <input
                  name="name"
                  value={
                    professionalForm.name
                  }
                  onChange={
                    handleCreateChange
                  }
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
                    handleCreateChange
                  }
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
                    handleCreateChange
                  }
                  placeholder="Ej. Ortodoncia"
                />
              </label>

              <label className="configuration-field">
                Teléfono

                <input
                  name="phone"
                  value={
                    professionalForm.phone
                  }
                  onChange={
                    handleCreateChange
                  }
                />
              </label>

              <label className="configuration-field">
                Email

                <input
                  type="email"
                  name="email"
                  value={
                    professionalForm.email
                  }
                  onChange={
                    handleCreateChange
                  }
                />
              </label>
            </div>

            <button
              className="configuration-primary-button"
              type="submit"
              disabled={
                creating
              }
            >
              {creating
                ? "Guardando..."
                : "Agregar profesional"}
            </button>
          </form>
        </details>
      </section>

      {accessProfessional && (
        <div
          className="professional-modal-overlay"
          onMouseDown={() => {
            if (
              !creatingAccess
            ) {
              setAccessProfessional(
                null,
              );
            }
          }}
        >
          <section
            className="professional-access-modal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="professional-access-modal-header">
              <div className="professional-access-modal-icon">
                🔐
              </div>

              <div>
                <p className="eyebrow">
                  Acceso profesional
                </p>

                <h2>
                  Crear usuario
                </h2>
              </div>
            </div>

            <p className="professional-access-description">
              Crear acceso para{" "}
              <strong>
                {
                  accessProfessional.name
                }{" "}
                {
                  accessProfessional.lastname
                }
              </strong>
              .
            </p>

            <form
              className="configuration-form"
              onSubmit={
                createAccess
              }
            >
              <label className="configuration-field">
                Email de acceso *

                <input
                  type="email"
                  value={
                    accessEmail
                  }
                  required
                  onChange={(
                    event,
                  ) =>
                    setAccessEmail(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label className="configuration-field">
                Contraseña inicial *

                <input
                  type="password"
                  value={
                    accessPassword
                  }
                  minLength="6"
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  onChange={(
                    event,
                  ) =>
                    setAccessPassword(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <div className="professional-access-warning">
                La contraseña se usa
                solo para crear la
                cuenta. No se muestra
                ni se recupera después.
              </div>

              <div className="professional-modal-actions">
                <button
                  type="button"
                  className="professional-secondary-button"
                  disabled={
                    creatingAccess
                  }
                  onClick={() =>
                    setAccessProfessional(
                      null,
                    )
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="configuration-primary-button"
                  disabled={
                    creatingAccess
                  }
                >
                  {creatingAccess
                    ? "Creando..."
                    : "Crear acceso"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default ProfessionalManagement;
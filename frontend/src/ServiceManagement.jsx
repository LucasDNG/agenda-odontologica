import {
  useState,
} from "react";

import "./ServiceManagement.css";

const API_URL =
  "http://localhost:3000/api";

function ServiceManagement({
  services,
  onChanged,
  showSuccess,
  showError,
}) {
  const [newName, setNewName] =
    useState("");

  const [
    newDuration,
    setNewDuration,
  ] = useState(30);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    editName,
    setEditName,
  ] = useState("");

  const [
    editDuration,
    setEditDuration,
  ] = useState(30);

  const [
    savingId,
    setSavingId,
  ] = useState(null);

  const createService =
    async (event) => {
      event.preventDefault();

      if (!newName.trim()) {
        showError(
          "Ingresá el nombre del servicio.",
        );

        return;
      }

      setCreating(true);

      try {
        const response =
          await fetch(
            `${API_URL}/admin/appointment-types`,
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
                  name:
                    newName.trim(),

                  durationMinutes:
                    Number(
                      newDuration,
                    ),
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo crear el servicio",
          );
        }

        setNewName("");
        setNewDuration(30);

        await onChanged();

        showSuccess(
          "Servicio creado correctamente.",
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
    service,
  ) => {
    setEditingId(
      service.id,
    );

    setEditName(
      service.name,
    );

    setEditDuration(
      Number(
        service.duration_minutes,
      ),
    );
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditDuration(30);
  };

  const updateService =
    async (
      service,
      active =
        service.active,
    ) => {
      const name =
        editingId ===
        service.id
          ? editName
          : service.name;

      const duration =
        editingId ===
        service.id
          ? Number(
              editDuration,
            )
          : Number(
              service.duration_minutes,
            );

      if (!name.trim()) {
        showError(
          "El nombre del servicio es obligatorio.",
        );

        return;
      }

      setSavingId(
        service.id,
      );

      try {
        const response =
          await fetch(
            `${API_URL}/admin/appointment-types/${service.id}`,
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
                    name.trim(),

                  durationMinutes:
                    duration,

                  active,
                }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "No se pudo actualizar el servicio",
          );
        }

        cancelEditing();

        await onChanged();

        showSuccess(
          active === false
            ? "Servicio desactivado."
            : service.active ===
                false
              ? "Servicio activado."
              : "Servicio actualizado.",
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

  return (
    <section className="configuration-card">
      <div className="configuration-card-heading">
        <div className="configuration-number">
          3
        </div>

        <div>
          <h3>
            Servicios
          </h3>

          <p>
            Creá, editá y
            desactivá servicios del
            consultorio.
          </p>
        </div>
      </div>

      <div className="service-admin-list">
        {services.length ===
        0 ? (
          <div className="configuration-empty small">
            No hay servicios
            cargados.
          </div>
        ) : (
          services.map(
            (service) => {
              const isEditing =
                editingId ===
                service.id;

              return (
                <div
                  className={
                    service.active
                      ? "service-admin-item"
                      : "service-admin-item inactive"
                  }
                  key={
                    service.id
                  }
                >
                  {isEditing ? (
                    <div className="service-admin-edit-grid">
                      <label className="configuration-field">
                        Nombre

                        <input
                          value={
                            editName
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditName(
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </label>

                      <label className="configuration-field">
                        Duración

                        <div className="service-duration-field">
                          <input
                            type="number"
                            min="5"
                            max="480"
                            step="5"
                            value={
                              editDuration
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditDuration(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />

                          <span>
                            min
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="service-admin-info">
                      <div>
                        <strong>
                          {
                            service.name
                          }
                        </strong>

                        <span>
                          {
                            service.duration_minutes
                          }{" "}
                          minutos
                        </span>
                      </div>

                      <span
                        className={
                          service.active
                            ? "service-state active"
                            : "service-state inactive"
                        }
                      >
                        {service.active
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </div>
                  )}

                  <div className="service-admin-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="service-secondary-button"
                          onClick={
                            cancelEditing
                          }
                          disabled={
                            savingId ===
                            service.id
                          }
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="configuration-primary-button"
                          onClick={() =>
                            updateService(
                              service,
                            )
                          }
                          disabled={
                            savingId ===
                            service.id
                          }
                        >
                          {savingId ===
                          service.id
                            ? "Guardando..."
                            : "Guardar"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="service-secondary-button"
                          onClick={() =>
                            startEditing(
                              service,
                            )
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={
                            service.active
                              ? "service-disable-button"
                              : "service-enable-button"
                          }
                          disabled={
                            savingId ===
                            service.id
                          }
                          onClick={() =>
                            updateService(
                              service,
                              !service.active,
                            )
                          }
                        >
                          {savingId ===
                          service.id
                            ? "Guardando..."
                            : service.active
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            },
          )
        )}
      </div>

      <details className="configuration-details">
        <summary>
          Agregar servicio
        </summary>

        <form
          className="configuration-form"
          onSubmit={
            createService
          }
        >
          <div className="configuration-grid">
            <label className="configuration-field">
              Nombre *

              <input
                value={newName}
                placeholder="Ej. Limpieza dental"
                onChange={(
                  event,
                ) =>
                  setNewName(
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label className="configuration-field">
              Duración *

              <div className="service-duration-field">
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={
                    newDuration
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewDuration(
                      event.target
                        .value,
                    )
                  }
                />

                <span>
                  min
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="configuration-primary-button"
            disabled={
              creating
            }
          >
            {creating
              ? "Creando..."
              : "Agregar servicio"}
          </button>
        </form>
      </details>
    </section>
  );
}

export default ServiceManagement;
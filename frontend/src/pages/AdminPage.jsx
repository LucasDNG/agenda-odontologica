import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const statusText = {
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Atendido",
  absent: "Ausente",
};

export default function AdminPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [section, setSection] = useState("agenda");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");

  const loadAppointments = async () => {
    const res = await api.get("/admin/appointments", {
      params: { date: date || undefined, status: status || undefined },
    });
    setAppointments(res.data.appointments);
  };

  const loadPatients = async () => {
    const res = await api.get("/admin/patients");
    setPatients(res.data.patients);
  };

  const loadSettings = async () => {
    const [s, a, b] = await Promise.all([
      api.get("/admin/appointment-types"),
      api.get("/admin/availability"),
      api.get("/blocked-dates"),
    ]);
    setServices(s.data.services);
    setAvailability(a.data.availability);
    setBlockedDates(b.data.blockedDates);
  };

  useEffect(() => { loadAppointments(); }, [date, status]);
  useEffect(() => { loadPatients(); loadSettings(); }, []);

  const active = useMemo(() => appointments.filter((a) => a.status !== "cancelled"), [appointments]);
  const cancelled = useMemo(() => appointments.filter((a) => a.status === "cancelled"), [appointments]);

  const changeStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/appointments/${id}/status`, { status: newStatus });
      await Promise.all([loadAppointments(), loadPatients()]);
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo modificar el turno");
    }
  };

  const restore = async (id) => {
    try {
      const res = await api.patch(`/admin/appointments/${id}/restore`);
      alert(res.data.message);
      await Promise.all([loadAppointments(), loadPatients()]);
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo restaurar");
    }
  };

  const reschedule = async (appointment) => {
    const newDate = window.prompt("Nueva fecha (AAAA-MM-DD):");
    if (!newDate) return;
    const newTime = window.prompt("Nuevo horario (HH:MM):");
    if (!newTime) return;

    try {
      const res = await api.patch(`/admin/appointments/${appointment.id}/reschedule`, {
        date: newDate,
        startTime: newTime,
      });
      alert(res.data.message);
      await loadAppointments();
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo reprogramar");
    }
  };

  const updateLimit = async (id, value) => {
    await api.patch(`/admin/patients/${id}/appointment-limit`, {
      maxActiveAppointments: Number(value),
    });
    await loadPatients();
  };

  const createBlockedDate = async () => {
    const blockedDate = window.prompt("Fecha a bloquear (AAAA-MM-DD):");
    if (!blockedDate) return;
    const reason = window.prompt("Motivo:", "Día no disponible");
    try {
      await api.post("/admin/blocked-dates", { date: blockedDate, reason });
      await loadSettings();
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo bloquear");
    }
  };

  const deleteBlockedDate = async (id) => {
    await api.delete(`/admin/blocked-dates/${id}`);
    await loadSettings();
  };

  const createService = async () => {
    const name = window.prompt("Nombre del servicio:");
    if (!name) return;
    const durationMinutes = Number(window.prompt("Duración en minutos:"));
    if (!durationMinutes) return;
    await api.post("/admin/appointment-types", { name, durationMinutes });
    await loadSettings();
  };

  const toggleService = async (service) => {
    await api.patch(`/admin/appointment-types/${service.id}`, { active: !service.active });
    await loadSettings();
  };

  const createAvailability = async () => {
    const dayOfWeek = Number(window.prompt("Día: 0 domingo, 1 lunes ... 6 sábado"));
    const startTime = window.prompt("Desde (HH:MM):");
    const endTime = window.prompt("Hasta (HH:MM):");
    if (Number.isNaN(dayOfWeek) || !startTime || !endTime) return;
    await api.post("/admin/availability", { dayOfWeek, startTime, endTime });
    await loadSettings();
  };

  const deleteAvailability = async (id) => {
    await api.delete(`/admin/availability/${id}`);
    await loadSettings();
  };

  const AppointmentCard = ({ appointment, cancelledMode = false }) => (
    <div className="card">
      <div className="cardTop">
        <span className="badge">{statusText[appointment.status] || appointment.status}</span>
        {appointment.is_overbooked && <span className="warningBadge">Sobreturno</span>}
      </div>
      <h2>{appointment.patient_name} {appointment.patient_lastname}</h2>
      <strong>{appointment.service}</strong>
      <p className="bigDate">{appointment.appointment_date} · {appointment.start_time.slice(0, 5)} hs</p>
      <p>{appointment.patient_phone}</p>
      <p className="muted">{appointment.patient_email}</p>

      {cancelledMode ? (
        <button onClick={() => restore(appointment.id)}>Restaurar turno</button>
      ) : (
        <div className="actions">
          {appointment.status === "confirmed" && (
            <>
              <button onClick={() => reschedule(appointment)}>Reprogramar</button>
              <button onClick={() => changeStatus(appointment.id, "completed")}>Atendido</button>
              <button onClick={() => changeStatus(appointment.id, "absent")}>Ausente</button>
              <button className="danger" onClick={() => changeStatus(appointment.id, "cancelled")}>Cancelar</button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <main>
      <div className="adminHeader">
        <div>
          <p className="eyebrow">Panel de odontóloga</p>
          <h1>Administración</h1>
        </div>
        <div className="tabs">
          {[
            ["agenda", "Agenda"],
            ["cancelled", "Cancelados"],
            ["patients", "Pacientes"],
            ["settings", "Configuración"],
          ].map(([key, label]) => (
            <button key={key} className={section === key ? "tab activeTab" : "tab"}
              onClick={() => setSection(key)}>{label}</button>
          ))}
        </div>
      </div>

      {section === "agenda" && (
        <>
          <div className="filters">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Atendidos</option>
              <option value="absent">Ausentes</option>
            </select>
          </div>
          <div className="grid">
            {active.map((a) => <AppointmentCard key={a.id} appointment={a} />)}
          </div>
        </>
      )}

      {section === "cancelled" && (
        <div className="grid">
          {cancelled.map((a) => <AppointmentCard key={a.id} appointment={a} cancelledMode />)}
          {cancelled.length === 0 && <p>No hay turnos cancelados.</p>}
        </div>
      )}

      {section === "patients" && (
        <div className="grid">
          {patients.map((p) => (
            <div className="card" key={p.id}>
              <h2>{p.name} {p.lastname}</h2>
              <p>{p.email}</p>
              <p>{p.phone}</p>
              <p>Turnos activos: <strong>{p.active_appointments}</strong></p>
              <label>Máximo autorizado</label>
              <select value={p.max_active_appointments}
                onChange={(e) => updateLimit(p.id, e.target.value)}>
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} turno{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {section === "settings" && (
        <div className="settingsGrid">
          <section className="card">
            <div className="sectionTitle"><h2>Servicios</h2><button onClick={createService}>Agregar</button></div>
            {services.map((s) => (
              <div className="settingRow" key={s.id}>
                <span>{s.name} · {s.duration_minutes} min</span>
                <button onClick={() => toggleService(s)}>{s.active ? "Desactivar" : "Activar"}</button>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="sectionTitle"><h2>Horarios</h2><button onClick={createAvailability}>Agregar</button></div>
            {availability.map((a) => (
              <div className="settingRow" key={a.id}>
                <span>Día {a.day_of_week} · {a.start_time.slice(0,5)}–{a.end_time.slice(0,5)}</span>
                <button className="danger" onClick={() => deleteAvailability(a.id)}>Eliminar</button>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="sectionTitle"><h2>Días bloqueados</h2><button onClick={createBlockedDate}>Bloquear</button></div>
            {blockedDates.map((b) => (
              <div className="settingRow" key={b.id}>
                <span>{b.date} · {b.reason}</span>
                <button className="danger" onClick={() => deleteBlockedDate(b.id)}>Quitar</button>
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}

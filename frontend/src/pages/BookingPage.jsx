import { useEffect, useState } from "react";
import api from "../api/api";

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSlots = async () => {
    if (!service || !date) {
      setSlots([]);
      return;
    }
    try {
      const res = await api.get("/available-slots", {
        params: { date, appointmentTypeId: service },
      });
      setSlots(res.data.availableSlots);
      setError("");
    } catch (e) {
      setSlots([]);
      setError(e.response?.data?.message || "No se pudieron obtener horarios");
    }
  };

  useEffect(() => {
    api.get("/appointment-types").then((res) => setServices(res.data.appointmentTypes));
  }, []);

  useEffect(() => {
    setMessage("");
    loadSlots();
  }, [service, date]);

  useEffect(() => {
    const refresh = () => loadSlots();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [service, date]);

  const reserve = async (startTime) => {
    try {
      const res = await api.post("/appointments", {
        appointmentTypeId: Number(service),
        date,
        startTime,
      });
      setMessage(res.data.message);
      setError("");
      await loadSlots();
    } catch (e) {
      setMessage("");
      setError(e.response?.data?.message || "No se pudo reservar");
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <div className="card bookingCard">
        <p className="eyebrow">Reserva online</p>
        <h1>Elegí tu turno</h1>

        <label>Servicio</label>
        <select value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">Seleccionar servicio</option>
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.duration_minutes} min
            </option>
          ))}
        </select>

        <label>Fecha</label>
        <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <div className="slots">
          {service && date && slots.length === 0 && !error && <p>No hay horarios disponibles.</p>}
          {slots.map((slot) => (
            <button key={slot.startTime} className="slot" onClick={() => reserve(slot.startTime)}>
              {slot.startTime}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

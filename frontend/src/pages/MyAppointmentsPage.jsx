import { useEffect, useState } from "react";
import api from "../api/api";

const statusText = {
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Atendido",
  absent: "Ausente",
};

export default function MyAppointmentsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/appointments");
      setUpcoming(res.data.upcomingAppointments);
      setHistory(res.data.history);
    } catch (e) {
      setError(e.response?.data?.message || "No se pudieron cargar los turnos");
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm("¿Querés cancelar este turno?")) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo cancelar");
    }
  };

  return (
    <main>
      <h1>Mis turnos</h1>
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {upcoming.map((a) => (
          <div className="card" key={a.id}>
            <span className="badge">{statusText[a.status] || a.status}</span>
            <h2>{a.service}</h2>
            <p className="bigDate">{a.appointment_date}</p>
            <p>{a.start_time.slice(0, 5)} hs</p>
            {a.is_overbooked && <p className="warning">Sobreturno</p>}
            <button className="danger" onClick={() => cancel(a.id)}>Cancelar turno</button>
          </div>
        ))}
        {upcoming.length === 0 && <p>No tenés turnos futuros.</p>}
      </div>

      <h2>Historial</h2>
      <div className="historyList">
        {history.map((a) => (
          <div className="history" key={a.id}>
            <strong>{a.appointment_date}</strong> · {a.service} · {statusText[a.status] || a.status}
          </div>
        ))}
      </div>
    </main>
  );
}

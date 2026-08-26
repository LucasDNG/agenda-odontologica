import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="hero">
      <section className="heroCard">
        <p className="eyebrow">Consultorio odontológico</p>
        <h1>Tu turno, sin llamadas ni esperas.</h1>
        <p className="heroText">
          Elegí servicio, fecha y horario. La reserva queda confirmada automáticamente.
        </p>

        {!user && <Link className="primaryCta" to="/login">Solicitar turno</Link>}
        {user?.role === "patient" && <Link className="primaryCta" to="/reservar">Reservar turno</Link>}
        {user?.role === "dentist" && <Link className="primaryCta" to="/admin">Ver agenda</Link>}
      </section>
    </main>
  );
}

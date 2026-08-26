import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await signout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link className="brand" to="/">Agenda Odontológica</Link>

      <div className="navLinks">
        {!user && (
          <>
            <NavLink to="/login">Ingresar</NavLink>
            <NavLink to="/register">Registrarse</NavLink>
          </>
        )}

        {user?.role === "patient" && (
          <>
            <NavLink to="/reservar">Reservar</NavLink>
            <NavLink to="/mis-turnos">Mis turnos</NavLink>
          </>
        )}

        {user?.role === "dentist" && <NavLink to="/admin">Administración</NavLink>}

        {user && <button className="linkButton" onClick={logout}>Salir</button>}
      </div>
    </nav>
  );
}

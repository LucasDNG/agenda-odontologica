import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", lastname: "", email: "", phone: "", password: "",
  });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(form);
      navigate("/reservar");
    } catch (error) {
      setError(error.response?.data?.message || "No se pudo registrar");
    }
  };

  const field = (name, type = "text", placeholder = "") => (
    <input name={name} type={type} placeholder={placeholder} required
      value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
  );

  return (
    <div className="authBox">
      <h1>Crear cuenta</h1>
      <form onSubmit={submit}>
        {field("name", "text", "Nombre")}
        {field("lastname", "text", "Apellido")}
        {field("email", "email", "Email")}
        {field("phone", "tel", "Teléfono con código de área")}
        {field("password", "password", "Contraseña")}
        {error && <p className="error">{error}</p>}
        <button type="submit">Registrarme</button>
      </form>
    </div>
  );
}

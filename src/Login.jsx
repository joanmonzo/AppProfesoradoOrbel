import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Contraseña maestra obtenida desde variables de entorno (.env)
  const ACCESS_PASSWORD = process.env.REACT_APP_ACCESS_PASSWORD;

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      if (password !== ACCESS_PASSWORD) {
        setError("Contraseña incorrecta");
        return;
      }

      let userCredential;

      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
      } catch {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
      }

      const user = userCredential.user;

      const emailValido =
        user.email.endsWith("@orbelgrupo.com") ||
        user.email.endsWith("@academiaindustrial.com");

      if (!emailValido) {
        await signOut(auth);
        setError("Correo no autorizado");
        return;
      }

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        await signOut(auth);
        setError("Te hemos enviado un correo de verificación");
        return;
      }

      onLogin(user);
    } catch (err) {
      setError("Error de acceso");
    }
  };

  return (
    <div className="app-container">
      <div style={{ maxWidth: 420, margin: "0 auto", paddingTop: 80 }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1 className="title-font" style={{ fontSize: 34, fontWeight: 700 }}>
            Academia Industrial by Orbel
          </h1>
          <p style={{ fontSize: 13, letterSpacing: 4, opacity: 0.7 }}>
            Directorio de Profesorado
          </p>
        </div>

        <div className="panel">
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@orbelgrupo.com"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button className="btn-primary title-font" type="submit">
              🔐 ACCEDER
            </button>

            {error && (
              <div
                style={{
                  marginTop: 16,
                  padding: 10,
                  background: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  borderRadius: 8,
                  color: "var(--danger-text)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

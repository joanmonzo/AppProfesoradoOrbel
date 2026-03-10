import { useState, useEffect } from "react";

const API_URL = "https://api-profesores.onrender.com/api/profesores/todos";

const initialForm = {
  titulacion: "Todas",
  curso: "Todos",
  localidad: "Todas",
  experiencia_anio: "",
  experiencia_horas: "",
  precioMax: "",
  sexo: "Todos",
};

export default function TutorConnect() {
  const [form, setForm] = useState(initialForm);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [titulaciones, setTitulaciones] = useState([]);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        const tits = [...new Set(data.map(p => p.titulacion).filter(Boolean))];
        setTitulaciones(tits);
      })
      .catch(() => {});
  }, []);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [observaciones, setObservaciones] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});

  const handleGuardar = async (id) => {
    setSavingId(id);
    setSaveStatus(prev => ({ ...prev, [id]: null }));
    try {
      const res = await fetch(`https://api-profesores.onrender.com/api/profesores/${id}/observaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(observaciones[id] ?? ""),
      });
      if (!res.ok) throw new Error();
      setSaveStatus(prev => ({ ...prev, [id]: "ok" }));
    } catch {
      setSaveStatus(prev => ({ ...prev, [id]: "error" }));
    } finally {
      setSavingId(null);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Error al conectar con la API");
      const data = await res.json();

      const filtered = data.filter(t =>
        (form.titulacion === "Todas" || form.titulacion === "" || (t.titulacion && t.titulacion.toLowerCase().includes(form.titulacion.toLowerCase()))) &&
        (form.curso === "Todos" || form.curso === "" || (t.cursos && (Array.isArray(t.cursos) ? t.cursos : t.cursos.split(",").map(c => c.trim())).some(c => c.toLowerCase().includes(form.curso.toLowerCase())))) &&
        (form.localidad === "Todas" || form.localidad === "" || (t.localidad && t.localidad.toLowerCase().includes(form.localidad.toLowerCase()))) &&
        (form.sexo === "Todos" || form.sexo === "" || (t.sexo && t.sexo.toLowerCase().includes(form.sexo.toLowerCase()))) &&
        (form.experiencia_anio === "" || Number(t.experiencia_anio) >= Number(form.experiencia_anio)) &&
        (form.experiencia_horas === "" || Number(t.experiencia_horas) >= Number(form.experiencia_horas)) &&
        (form.precioMax === "" || (() => {
          const input = form.precioMax.trim();
          const precioProfesor = String(t.precio).trim();
          const esRangoProfesor = precioProfesor.includes("-");
          const [pMin, pMax] = esRangoProfesor
            ? precioProfesor.split("-").map(v => Number(v.trim()))
            : [Number(precioProfesor), Number(precioProfesor)];
          if (input.includes("-")) {
            const [bMin, bMax] = input.split("-").map(v => Number(v.trim()));
            return pMin <= bMax && pMax >= bMin;
          }
          const bNum = Number(input);
          return pMin === bNum || pMax === bNum;
        })())
      );

      setResults(filtered);
      const obs = {};
      filtered.forEach(t => { obs[t.id] = t.observaciones ?? ""; });
      setObservaciones(obs);
    } catch (err) {
      setError("No se pudo conectar con la API. Comprueba que el servidor esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    color: "#374151",
    background: "#fff",
    fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus { outline: 2px solid #111; outline-offset: 2px; }
        select { appearance: none; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px" }}>

        {/* Título */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#111", marginBottom: 8 }}>
            Buscar Profesores
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280" }}>
            Usa los filtros para encontrar el profesor ideal
          </p>
        </div>

        {/* Formulario */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: "32px",
          marginBottom: 32,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Titulación con datalist */}
            <div>
              <label style={labelStyle}>Titulación</label>
              <input
                type="text"
                name="titulacion"
                value={form.titulacion === "Todas" ? "" : form.titulacion}
                onChange={handleChange}
                list="titulaciones-list"
                style={inputStyle}
              />
              <datalist id="titulaciones-list">
                {titulaciones.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            {/* Curso - desplegable */}
            <div>
              <label style={labelStyle}>Curso</label>
              <select name="curso" value={form.curso} onChange={handleChange} style={inputStyle}>
                <option value="Todos">Todos</option>
                {cursosDisponibles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Localidad */}
            <div>
              <label style={labelStyle}>Localidad</label>
              <input 
                type="text" 
                name="localidad" 
                value={form.localidad === "Todas" ? "" : form.localidad} 
                onChange={handleChange} 
                style={inputStyle} 
              />
            </div>

            {/* Sexo */}
            <div>
              <label style={labelStyle}>Sexo</label>
              <input 
                type="text"
                name="sexo" 
                value={form.sexo === "Todos" ? "" : form.sexo} 
                onChange={handleChange} 
                style={inputStyle} 
              />
            </div>

            {/* Experiencia años */}
            <div>
              <label style={labelStyle}>Experiencia (años)</label>
              <input
                type="number"
                name="experiencia_anio"
                value={form.experiencia_anio}
                onChange={handleChange}
                min={0}
                style={inputStyle}
              />
            </div>

            {/* Experiencia horas */}
            <div>
              <label style={labelStyle}>Experiencia (horas)</label>
              <input
                type="number"
                name="experiencia_horas"
                value={form.experiencia_horas}
                onChange={handleChange}
                min={0}
                style={inputStyle}
              />
            </div>

            {/* Precio */}
            <div>
              <label style={labelStyle}>Precio</label>
              <input
                type="text"
                name="precioMax"
                value={form.precioMax}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Botón buscar */}
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 24,
              background: loading ? "#f87171" : "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "14px 0",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.02em",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = "#b91c1c"; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = "#dc2626"; }}
          >
            {loading ? "Buscando..." : "Buscar profesores"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, padding: "14px 18px", marginBottom: 20,
            fontSize: 14, color: "#b91c1c",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {results !== null && !error && (
          <div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              {results.length > 0
                ? <>Se encontraron <strong style={{ color: "#111" }}>{results.length}</strong> profesor{results.length !== 1 ? "es" : ""}</>
                : "No se encontraron profesores con esos criterios."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {results.map((t, i) => (
                <div key={t.id || i} style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "20px 24px",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                }}>
                  {/* Nombre y precio */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#111" }}>
                      {t.nombre || t.name}
                    </div>
                    {t.precio && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{t.precio}€</div>
                      </div>
                    )}
                  </div>

                  {/* Campos en grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Titulación", value: t.titulacion, icon: "🎓" },
                      { label: "Localidad", value: t.localidad, icon: "📍" },
                      { label: "Sexo", value: t.sexo, icon: "👤" },
                      { label: "Experiencia", value: (t.experiencia_anio != null && t.experiencia_horas != null) ? `${t.experiencia_anio} años y ${t.experiencia_horas} horas` : null, icon: "⏱" },
                      { label: "Curso", value: t.cursos ? (Array.isArray(t.cursos) ? t.cursos.join(", ") : t.cursos) : null, icon: "📚" },
                    ].map(({ label, value, icon }) => value != null && value !== "" && (
                      <div key={label} style={{
                        background: "#f9fafb", borderRadius: 8,
                        padding: "10px 12px",
                      }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                          {icon} {label}
                        </div>
                        <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Observaciones */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                      📝 Observaciones
                    </div>
                    <textarea
                      value={observaciones[t.id] ?? ""}
                      onChange={e => setObservaciones(prev => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Escribe una observación..."
                      rows={3}
                      style={{
                        width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
                        padding: "10px 12px", fontSize: 13, color: "#374151",
                        fontFamily: "inherit", resize: "vertical", background: "#f9fafb",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <button
                        onClick={() => handleGuardar(t.id)}
                        disabled={savingId === t.id}
                        style={{
                          background: savingId === t.id ? "#9ca3af" : "#111",
                          color: "#fff", border: "none", borderRadius: 8,
                          padding: "8px 20px", fontSize: 13, fontWeight: 600,
                          cursor: savingId === t.id ? "not-allowed" : "pointer",
                          fontFamily: "inherit", transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (savingId !== t.id) e.target.style.background = "#333"; }}
                        onMouseLeave={e => { if (savingId !== t.id) e.target.style.background = "#111"; }}
                      >
                        {savingId === t.id ? "Guardando..." : "Guardar"}
                      </button>
                      {saveStatus[t.id] === "ok" && (
                        <span style={{ fontSize: 12, color: "#16a34a" }}>✅ Guardado correctamente</span>
                      )}
                      {saveStatus[t.id] === "error" && (
                        <span style={{ fontSize: 12, color: "#dc2626" }}>❌ Error al guardar</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #e5e7eb",
        marginTop: 60,
        padding: "32px 24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff",
      }}>
        <img
          src="/logo-academia.jpeg"
          alt="Academia Industrial by Orbel grupo"
          style={{ height: 56, objectFit: "contain", opacity: 0.85 }}
        />
      </footer>
    </div>
  );
}
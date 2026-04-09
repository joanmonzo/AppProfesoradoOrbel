import { useState, useEffect } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbwgCM-LjBMtEc_LwK7Gs7D6yfZ97niXebD3fGeSFmd18vTWQR7UY61ui-rMuB-nH_En/exec";

// ==========================================
// ESTILOS REUTILIZABLES
// ==========================================
const styles = {
  label: {
    display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
  },
  input: {
    width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "10px 12px", fontSize: 14, color: "#374151",
    background: "#fff", fontFamily: "inherit",
  },
  btnSearch: {
    width: "100%", marginTop: 24, padding: "14px 0", border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: 600, fontFamily: "inherit", letterSpacing: "0.02em",
    transition: "background 0.15s", color: "#fff",
  },
  card: (isExpanded) => ({
    background: "#fff",
    border: isExpanded ? "2px solid #111" : "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: isExpanded ? "0 4px 12px rgba(0,0,0,0.1)" : "0 1px 6px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  })
};

const initialForm = {
  nombre: "",
  titulacion: "Todas", categoriaTitulacion: "Todas",
  curso: "Todos", localidad: "Todas",
  experiencia_anio: "", experiencia_horas: "", precioMax: "", sexo: "Todos",
  trabajado_con_orbel: "Todos",
  certificado_docencia: "Todos",
};

// ==========================================
// COMPONENTES SECUNDARIOS
// ==========================================
const PaginationControls = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalItems <= itemsPerPage) return null;

  const btnStyle = (disabled) => ({
    padding: "8px 16px", background: disabled ? "#e5e7eb" : "#111",
    color: disabled ? "#9ca3af" : "#fff", border: "none", borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600,
  });

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 24, gap: 16 }}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={btnStyle(currentPage === 1)}
      >
        Anterior
      </button>
      <div style={{ fontSize: 14, color: "#374151" }}>
        Página <strong>{currentPage}</strong> de {totalPages}
      </div>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={btnStyle(currentPage === totalPages)}
      >
        Siguiente
      </button>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function TutorConnect() {
  // Estado General
  const [form, setForm] = useState(initialForm);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado de Opciones y Paginación
  const [titulaciones, setTitulaciones] = useState([]);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const itemsPerPage = 5;

  // Estado de Observaciones
  const [observaciones, setObservaciones] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});

  // Carga inicial de filtros desde la API
  useEffect(() => {
    fetch(`${API_URL}?action=todos`)
      .then(res => res.json())
      .then(data => {
        setTitulaciones([...new Set(data.map(p => p.titulacion).filter(Boolean))].sort());
        setCursosDisponibles([...new Set(
          data.flatMap(p => p.cursos ? (Array.isArray(p.cursos) ? p.cursos : p.cursos.split(",").map(c => c.trim())) : []).filter(Boolean)
        )].sort());
        setLocalidades([...new Set(data.map(p => p.localidad).filter(Boolean))].sort());
      }).catch(() => { });
  }, []);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Acción para guardar observaciones
  const handleGuardar = async (id) => {
    setSavingId(id);
    setSaveStatus(prev => ({ ...prev, [id]: null }));
    try {
      const texto = observaciones[id] || "";
      const query = new URLSearchParams({ action: "observaciones", id, observaciones: texto, observacion: texto }).toString();
      const res = await fetch(`${API_URL}?${query}`, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: texto,
      });
      if (!res.ok) throw new Error();
      setSaveStatus(prev => ({ ...prev, [id]: "ok" }));
    } catch {
      setSaveStatus(prev => ({ ...prev, [id]: "error" }));
    } finally {
      setSavingId(null);
    }
  };

  // Acción de filtrado en el cliente
  const handleSearch = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}?action=todos`);
      if (!res.ok) throw new Error("Error al conectar con la API");
      const data = await res.json();

      const filtered = data.filter(t => {
        const CATEGORIA_KEYWORDS = {
          "FP": ["fp", "formación profesional", "grado medio", "grado superior", "ciclo formativo", "fpb", "fp1", "fp2", "fp i", "fp ii", "técnico superior", "técnico especialista", "técnico auxiliar", "técnico en", "técnico medio"],
          "Universidad": ["grado en", "grado universitario", "graduado", "graduada", "licenciatura", "licenciado", "licenciada", "ingeniería", "ingeniero", "ingenieria", "arquitectura"],
          "Máster": ["máster", "master", "máster universitario"],
          "Formador": ["formador", "docencia", "pedagogía", "pedagogo", "magister"],
          "Sin titulación": ["sin titulacion", "no indica", "sin titulación"],
          "Otro": [],
        };
        const matchCategoria = form.categoriaTitulacion === "Todas" || (() => {
          const tit = String(t.titulacion || "").toLowerCase();
          const keywords = CATEGORIA_KEYWORDS[form.categoriaTitulacion];
          if (!keywords) return true;
          if (keywords.length === 0) {
            // "Otro": no encaja en ninguna categoría conocida
            return !Object.entries(CATEGORIA_KEYWORDS).filter(([k]) => k !== "Otro").some(([, kws]) => kws.some(kw => tit.includes(kw)));
          }
          return keywords.some(kw => tit.includes(kw));
        })();
        const matchTitulacion = form.titulacion === "Todas" || form.titulacion === "" || (t.titulacion && t.titulacion.toLowerCase().includes(form.titulacion.toLowerCase()));
        const matchCurso = form.curso === "Todos" || form.curso === "" || (t.cursos && (Array.isArray(t.cursos) ? t.cursos : t.cursos.split(",").map(c => c.trim())).some(c => c.toLowerCase().includes(form.curso.toLowerCase())));
        const matchLocalidad = form.localidad === "Todas" || form.localidad === "" || (t.localidad && t.localidad.trim() === form.localidad.trim());
        const matchSexo = form.sexo === "Todos" || form.sexo === "" || (t.sexo && t.sexo.toUpperCase().trim() === form.sexo);
        const matchExpAnio = form.experiencia_anio === "" || Number(t.experiencia_anio) >= Number(form.experiencia_anio);
        const matchExpHoras = form.experiencia_horas === "" || Number(t.experiencia_horas) >= Number(form.experiencia_horas);

        const matchPrecio = form.precioMax === "" || (() => {
          const input = form.precioMax.trim();
          const precioProfesor = String(t.precio).trim();
          const esRango = precioProfesor.includes("-");
          const [pMin, pMax] = esRango ? precioProfesor.split("-").map(v => Number(v.trim())) : [Number(precioProfesor), Number(precioProfesor)];

          if (input.includes("-")) {
            const [bMin, bMax] = input.split("-").map(v => Number(v.trim()));
            return pMin <= bMax && pMax >= bMin;
          }
          const bNum = Number(input);
          return pMin === bNum || pMax === bNum;
        })();

        const matchOrbel = form.trabajado_con_orbel === "Todos" || (() => {
          const val = String(t.trabajado_con_orbel || "").toLowerCase().trim();
          const isNo = val === "no" || val === "";
          return form.trabajado_con_orbel === "Sí" ? !isNo : isNo;
        })();

        const matchCertDocencia = form.certificado_docencia === "Todos" || (() => {
          const val = String(t.certificado_docencia || "").toLowerCase().trim();
          const isNo = val === "no" || val === "";
          return form.certificado_docencia === "Sí" ? !isNo : isNo;
        })();

        const matchNombre = form.nombre === "" || String(t.nombre || t.name || "").toLowerCase().includes(form.nombre.toLowerCase());

        return matchNombre && matchCategoria && matchTitulacion && matchCurso && matchLocalidad && matchSexo && matchExpAnio && matchExpHoras && matchPrecio && matchOrbel && matchCertDocencia;
      });

      setResults(filtered);
      setCurrentPage(1);

      const obs = {};
      filtered.forEach(t => { obs[t.id] = t.observaciones ?? ""; });
      setObservaciones(obs);
    } catch (err) {
      setError("No se pudo conectar con la API. Comprueba que el servidor esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const getNumericPrice = (p) => {
    if (!p) return Infinity;
    const str = String(p).trim();
    if (str.includes("-")) {
      return Number(str.split("-")[0]);
    }
    return Number(str) || Infinity;
  };

  const sortedResults = results ? [...results].sort((a, b) => {
    if (sortBy === "precioAsc") return getNumericPrice(a.precio) - getNumericPrice(b.precio);
    if (sortBy === "precioDesc") {
      const pA = getNumericPrice(a.precio) === Infinity ? 0 : getNumericPrice(a.precio);
      const pB = getNumericPrice(b.precio) === Infinity ? 0 : getNumericPrice(b.precio);
      return pB - pA;
    }
    if (sortBy === "expDesc") return Number(b.experiencia_anio || 0) - Number(a.experiencia_anio || 0);
    if (sortBy === "nombreAsc") return String(a.nombre || a.name || "").localeCompare(String(b.nombre || b.name || ""));
    return 0;
  }) : null;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = sortedResults ? sortedResults.slice(indexOfFirstItem, indexOfLastItem) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus { outline: 2px solid #111; outline-offset: 2px; }
        select { appearance: none; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px" }}>

        {/* Cabecera */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#111", marginBottom: 8 }}>Buscar Profesores</h1>
          <p style={{ fontSize: 15, color: "#6b7280" }}>Usa los filtros para encontrar el profesor ideal</p>
        </div>

        {/* Panel de Filtros */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "32px", marginBottom: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={styles.label}>Nombre</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Sexo</label>
              <select name="sexo" value={form.sexo} onChange={handleChange} style={styles.input}>
                <option value="Todos">Todos</option>
                <option value="M">Masculino (M)</option>
                <option value="F">Femenino (F)</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Curso</label>
              <select name="curso" value={form.curso} onChange={handleChange} style={styles.input}>
                <option value="Todos">Todos</option>
                {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Localidad</label>
              <select name="localidad" value={form.localidad} onChange={handleChange} style={styles.input}>
                <option value="Todas">Todas</option>
                {localidades.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Trabajó en Orbel</label>
              <select name="trabajado_con_orbel" value={form.trabajado_con_orbel} onChange={handleChange} style={styles.input}>
                <option value="Todos">Todos</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Cert. Docencia</label>
              <select name="certificado_docencia" value={form.certificado_docencia} onChange={handleChange} style={styles.input}>
                <option value="Todos">Todos</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
            {/* Titulación: categoría + texto libre */}
            <div>
              <label style={styles.label}>Categoría Titulación</label>
              <select name="categoriaTitulacion" value={form.categoriaTitulacion} onChange={handleChange} style={styles.input}>
                <option value="Todas">Todas</option>
                <option value="FP">FP / Técnico</option>
                <option value="Universidad">Grado / Licenciatura / Ingeniería</option>
                <option value="Máster">Máster</option>
                <option value="Formador">Formador / Pedagogía</option>
                <option value="Sin titulación">Sin titulación</option>
                <option value="Otro">Otra / No clasificada</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Titulación (texto libre)</label>
              <input type="text" name="titulacion" value={form.titulacion === "Todas" ? "" : form.titulacion} onChange={handleChange} list="titulaciones-list" style={styles.input} placeholder="Buscar en titulación..." />
              <datalist id="titulaciones-list">{titulaciones.map(t => <option key={t} value={t} />)}</datalist>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ ...styles.btnSearch, background: loading ? "#f87171" : "#dc2626", cursor: loading ? "not-allowed" : "pointer" }}
            onMouseEnter={e => !loading && (e.target.style.background = "#b91c1c")}
            onMouseLeave={e => !loading && (e.target.style.background = "#dc2626")}
          >
            {loading ? "Buscando..." : "Buscar profesores"}
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "#b91c1c" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Área de Resultados */}
        {results !== null && !error && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                {results.length > 0 ? <>Se encontraron <strong style={{ color: "#111" }}>{results.length}</strong> profesor{results.length !== 1 ? "es" : ""}</> : "No se encontraron profesores con esos criterios."}
              </p>

              {results.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>ORDENAR:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                    style={{ ...styles.input, padding: "6px 10px", width: "auto", fontSize: 13 }}
                  >
                    <option value="default">Relevancia</option>
                    <option value="precioAsc">Precio: más barato</option>
                    <option value="precioDesc">Precio: más caro</option>
                    <option value="expDesc">Mayor experiencia</option>
                    <option value="nombreAsc">Nombre (A-Z)</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {currentResults.map((t, i) => {
                const isExpanded = expandedId === t.id;
                return (
                  <div key={t.id || i} style={styles.card(isExpanded)} onClick={() => setExpandedId(isExpanded ? null : t.id)}>

                    {/* Tarjeta contraída: Nombre y breve resumen */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isExpanded ? 16 : 0 }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <div style={{ fontFamily: "'Outfit', 'DM Sans', sans-serif", fontSize: 17, fontWeight: 600, color: "#111", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 12px" }}>
                          <span>{t.nombre || t.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>
                            {t.sexo && <span>👤 {t.sexo}</span>}
                            {t.localidad && <span>📍 {t.localidad}</span>}
                          </div>
                          <span style={{ fontSize: 12, color: "#6b7280", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                        </div>
                        {!isExpanded && t.titulacion && (
                          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.4 }}>🎓 {t.titulacion}</div>
                        )}
                      </div>

                      {!isExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                          {t.certificado_docencia && t.certificado_docencia !== "" && (
                            <div style={{
                              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12,
                              color: t.certificado_docencia.toLowerCase().trim() === "no" ? "#991b1b" : "#4f46e5",
                              background: t.certificado_docencia.toLowerCase().trim() === "no" ? "#fee2e2" : "#e0e7ff"
                            }}>
                              SSCE0110: {t.certificado_docencia}
                            </div>
                          )}
                          {t.certificado_teleformacion && t.certificado_teleformacion !== "" && (
                            <div style={{
                              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12,
                              color: t.certificado_teleformacion.toLowerCase().trim() === "no" ? "#991b1b" : "#059669",
                              background: t.certificado_teleformacion.toLowerCase().trim() === "no" ? "#fee2e2" : "#d1fae5"
                            }}>
                              E-LEARNING: {t.certificado_teleformacion}
                            </div>
                          )}
                          {(t.trabajado_con_orbel && String(t.trabajado_con_orbel).toLowerCase().trim() !== "no" && String(t.trabajado_con_orbel).trim() !== "") && (
                            <div style={{ fontSize: 11, color: "#9a3412", fontWeight: 700, background: "#ffedd5", padding: "4px 10px", borderRadius: 12 }}>
                              ORBEL: {t.trabajado_con_orbel}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tarjeta expandida: Detalles y Notas */}
                    {isExpanded && (
                      <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {[
                            { label: "Titulación", value: t.titulacion, icon: "🎓" },
                            { label: "Localidad", value: t.localidad, icon: "📍" },
                            { label: "Sexo", value: t.sexo, icon: "👤" },
                            { label: "Experiencia", value: (t.experiencia_anio != null && t.experiencia_horas != null) ? `${t.experiencia_anio} años y ${t.experiencia_horas} horas` : null, icon: "⏱" },
                            { label: "Curso", value: t.cursos ? (Array.isArray(t.cursos) ? t.cursos.join(", ") : t.cursos) : null, icon: "📚" },
                            { label: "Precio", value: t.precio ? `${t.precio} €` : null, icon: "💰" },
                            { label: "Ha trabajado en Orbel", value: t.trabajado_con_orbel, icon: "🏢" },
                            { label: "Certificado Docencia (SSCE0110)", value: t.certificado_docencia, icon: "📜" },
                          ].map(({ label, value, icon }) => value != null && value !== "" && (
                            <div key={label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
                                {icon} {label}
                              </div>
                              <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Caja de Observaciones */}
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                            📝 Observaciones
                          </div>
                          <textarea
                            value={observaciones[t.id] ?? ""}
                            onChange={e => setObservaciones(prev => ({ ...prev, [t.id]: e.target.value }))}
                            placeholder="Escribe una observación..."
                            rows={3}
                            style={{ ...styles.input, resize: "vertical", background: "#f9fafb" }}
                          />
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                            <button
                              onClick={() => handleGuardar(t.id)}
                              disabled={savingId === t.id}
                              style={{
                                background: savingId === t.id ? "#9ca3af" : "#111",
                                color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px",
                                fontSize: 13, fontWeight: 600, cursor: savingId === t.id ? "not-allowed" : "pointer",
                                fontFamily: "inherit", transition: "background 0.15s",
                              }}
                              onMouseEnter={e => savingId !== t.id && (e.target.style.background = "#333")}
                              onMouseLeave={e => savingId !== t.id && (e.target.style.background = "#111")}
                            >
                              {savingId === t.id ? "Guardando..." : "Guardar"}
                            </button>
                            {saveStatus[t.id] === "ok" && <span style={{ fontSize: 12, color: "#16a34a" }}>✅ Guardado</span>}
                            {saveStatus[t.id] === "error" && <span style={{ fontSize: 12, color: "#dc2626" }}>❌ Error</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Paginación (Componente Externo) */}
            <PaginationControls
              currentPage={currentPage}
              totalItems={results.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid #e5e7eb", marginTop: 60, padding: "32px 24px", display: "flex", justifyContent: "center", alignItems: "center", background: "#fff" }}>
        <img src="/logo-academia.jpeg" alt="Academia Industrial by Orbel grupo" style={{ height: 56, objectFit: "contain", opacity: 0.85 }} />
      </footer>
    </div>
  );
}
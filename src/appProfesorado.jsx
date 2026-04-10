import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "https://script.google.com/macros/s/AKfycbwgCM-LjBMtEc_LwK7Gs7D6yfZ97niXebD3fGeSFmd18vTWQR7UY61ui-rMuB-nH_En/exec";

const initialForm = {
  nombre: "",
  titulacion: "Todas", categoriaTitulacion: "Todas",
  curso: "Todos", localidad: "Todas",
  precioMax: "", sexo: "Todos",
  trabajado_con_orbel: "Todos",
  certificado_docencia: "Todos",
};

// ==========================================
// COMPONENTES SECUNDARIOS
// ==========================================
const PaginationControls = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalItems <= itemsPerPage) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 24, gap: 16 }}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        Anterior
      </button>
      <div style={{ fontSize: 14 }}>
        Página <strong>{currentPage}</strong> de {totalPages}
      </div>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="pagination-btn"
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
  const [theme, setTheme] = useState("light");

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

  // Sincronizar tema con atributo en el body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
            return !Object.entries(CATEGORIA_KEYWORDS).filter(([k]) => k !== "Otro").some(([, kws]) => kws.some(kw => tit.includes(kw)));
          }
          return keywords.some(kw => tit.includes(kw));
        })();
        const matchTitulacion = form.titulacion === "Todas" || form.titulacion === "" || (t.titulacion && String(t.titulacion).toLowerCase().includes(form.titulacion.toLowerCase()));
        const matchCurso = form.curso === "Todos" || form.curso === "" || (t.cursos && (Array.isArray(t.cursos) ? t.cursos : t.cursos.split(",").map(c => c.trim())).some(c => c.toLowerCase().includes(form.curso.toLowerCase())));
        const matchLocalidad = form.localidad === "Todas" || form.localidad === "" || (t.localidad && t.localidad.trim() === form.localidad.trim());
        const matchSexo = form.sexo === "Todos" || form.sexo === "" || (t.sexo && t.sexo.toUpperCase().trim() === form.sexo);

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

        return matchNombre && matchCategoria && matchTitulacion && matchCurso && matchLocalidad && matchSexo && matchPrecio && matchOrbel && matchCertDocencia;
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
    if (sortBy === "nombreAsc") return String(a.nombre || a.name || "").localeCompare(String(b.nombre || b.name || ""));
    if (sortBy === "localidadAsc") return String(a.localidad || "").localeCompare(String(b.localidad || ""));
    return 0;
  }) : null;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = sortedResults ? sortedResults.slice(indexOfFirstItem, indexOfLastItem) : [];

  return (
    <div className="app-container">
      {/* Botón de Tema */}
      <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
        {theme === 'light' ? '☀️' : '🌙'}
      </button>

      {/* Cabecera */}
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <h1 className="title-font" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4, letterSpacing: "-1px" }}>
          Academia Industrial by Orbel
        </h1>
        <p className="title-font" style={{ fontSize: 13, color: "var(--text-secondary)", letterSpacing: "4px", fontWeight: 600, textTransform: "uppercase", opacity: 0.8 }}>
          Directorio de profesorado
        </p>
      </div>

      {/* Panel de Filtros */}
      <div className="panel">
        <div className="grid-2">
          <div>
            <label className="label">Nombre</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">Sexo</label>
            <select name="sexo" value={form.sexo} onChange={handleChange} className="input">
              <option value="Todos">Todos</option>
              <option value="M">Masculino (M)</option>
              <option value="F">Femenino (F)</option>
            </select>
          </div>
          <div>
            <label className="label">Curso</label>
            <select name="curso" value={form.curso} onChange={handleChange} className="input">
              <option value="Todos">Todos</option>
              {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Localidad</label>
            <select name="localidad" value={form.localidad} onChange={handleChange} className="input">
              <option value="Todas">Todas</option>
              {localidades.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Trabajó en Orbel</label>
            <select name="trabajado_con_orbel" value={form.trabajado_con_orbel} onChange={handleChange} className="input">
              <option value="Todos">Todos</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label className="label">Cert. Docencia</label>
            <select name="certificado_docencia" value={form.certificado_docencia} onChange={handleChange} className="input">
              <option value="Todos">Todos</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label className="label">Categoría Titulación</label>
            <select name="categoriaTitulacion" value={form.categoriaTitulacion} onChange={handleChange} className="input">
              <option value="Todas">Todas</option>
              <option value="FP">FP / Técnico</option>
              <option value="Universidad">Grado / Licenciatura / Ingeniería</option>
              <option value="Máster">Máster</option>
              <option value="Formador">Formador / Pedagogía</option>
              <option value="Sin titulación">Sin titulación</option>
              <option value="Otro">Otra</option>
            </select>
          </div>
          <div>
            <label className="label">Área de Especialidad</label>
            <input type="text" name="titulacion" value={form.titulacion === "Todas" ? "" : form.titulacion} onChange={handleChange} list="titulaciones-list" className="input" placeholder="Ej. Prevención, Soldadura, Marketing..." />
            <datalist id="titulaciones-list">{titulaciones.map(t => <option key={t} value={t} />)}</datalist>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn-primary title-font"
        >
          {loading ? "BUSCANDO PERFILES..." : "🔍 EXPLORAR PROFESORADO"}
        </button>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "var(--danger-text)"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Área de Resultados */}
      {results !== null && !error && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              {results.length > 0 ? (
                <>Se han localizado <strong style={{ color: "var(--accent-color)", fontWeight: 700 }}>{results.length}</strong> perfil{results.length !== 1 ? "es profesionales" : " profesional"}</>
              ) : (
                "No se han localizado perfiles que coincidan con la búsqueda."
              )}
            </p>

            {results.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label className="label" style={{ marginBottom: 0 }}>ORDENAR:</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="input"
                  style={{ padding: "6px 10px", width: "auto", fontSize: 13, paddingRight: 30 }}
                >
                  <option value="default">Relevancia</option>
                  <option value="precioAsc">Precio: menor a mayor</option>
                  <option value="precioDesc">Precio: mayor a menor</option>
                  <option value="nombreAsc">Nombre (A-Z)</option>
                  <option value="localidadAsc">Ubicación (A-Z)</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {currentResults.map((t, i) => {
              const isExpanded = expandedId === t.id;
              return (
                <div key={t.id || i} className={`prof-card ${isExpanded ? 'expanded' : ''}`} onClick={() => setExpandedId(isExpanded ? null : t.id)}>

                  {/* Tarjeta contraída: Nombre y breve resumen */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isExpanded ? 16 : 0 }}>
                    <div style={{ flex: 1, paddingRight: 16 }}>
                      <div className="title-font" style={{ fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 12px" }}>
                        <span>{t.nombre || t.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>
                          {t.sexo && <span>👤 {t.sexo}</span>}
                          {t.localidad && <span>📍 {t.localidad}</span>}
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                      </div>
                      {!isExpanded && t.titulacion && (
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.4 }}>🎓 {t.titulacion}</div>
                      )}
                    </div>

                    {!isExpanded && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        {t.certificado_docencia && t.certificado_docencia !== "" && (
                          <div className={`badge ${t.certificado_docencia.toLowerCase().trim() === "no" ? 'badge-no' : 'badge-docencia'}`}>
                            SSCE0110: {t.certificado_docencia}
                          </div>
                        )}
                        {t.certificado_teleformacion && t.certificado_teleformacion !== "" && (
                          <div className={`badge ${t.certificado_teleformacion.toLowerCase().trim() === "no" ? 'badge-no' : 'badge-elearning'}`}>
                            E-LEARNING: {t.certificado_teleformacion}
                          </div>
                        )}
                        {(t.trabajado_con_orbel && String(t.trabajado_con_orbel).toLowerCase().trim() !== "no" && String(t.trabajado_con_orbel).trim() !== "") && (
                          <div className="badge badge-orbel">
                            ORBEL: {t.trabajado_con_orbel}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tarjeta expandida: Detalles y Notas */}
                  {isExpanded && (
                    <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
                      <div className="grid-2" style={{ gap: 10 }}>
                        {[
                          { label: "Titulación", value: t.titulacion, icon: "🎓" },
                          { label: "Sexo", value: t.sexo, icon: "👤" },
                          { label: "Certificado Docencia (SSCE0110)", value: t.certificado_docencia, icon: "📜" },
                          { label: "Ha trabajado en Orbel", value: t.trabajado_con_orbel, icon: "🏢" },
                          { label: "Curso", value: t.cursos ? (Array.isArray(t.cursos) ? t.cursos.join(", ") : t.cursos) : null, icon: "📚" },
                          { label: "Precio", value: t.precio ? `${t.precio} €` : null, icon: "💰" },
                        ].map(({ label, value, icon }) => value != null && value !== "" && (
                          <div key={label} className="prof-card-detail">
                            <div className="label" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>
                              {icon} {label}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Caja de Observaciones */}
                      <div style={{ marginTop: 14 }}>
                        <div className="label" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                          📝 Observaciones
                        </div>
                        <textarea
                          value={observaciones[t.id] ?? ""}
                          onChange={e => setObservaciones(prev => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder="Escribe una observación..."
                          rows={3}
                          className="input"
                          style={{ resize: "vertical", background: "var(--bg-primary)" }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                          <button
                            onClick={() => handleGuardar(t.id)}
                            disabled={savingId === t.id}
                            style={{
                              background: savingId === t.id ? "var(--border-color)" : "var(--text-primary)",
                              color: "var(--bg-secondary)", border: "none", borderRadius: 8, padding: "8px 20px",
                              fontSize: 13, fontWeight: 600, cursor: savingId === t.id ? "not-allowed" : "pointer",
                              fontFamily: "inherit", transition: "background 0.15s",
                            }}
                          >
                            {savingId === t.id ? "Guardando..." : "Guardar"}
                          </button>
                          {saveStatus[t.id] === "ok" && <span style={{ fontSize: 12, color: "var(--success-text)" }}>✅ Guardado</span>}
                          {saveStatus[t.id] === "error" && <span style={{ fontSize: 12, color: "var(--danger-text)" }}>❌ Error</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          <PaginationControls
            currentPage={currentPage}
            totalItems={results.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <footer className="footer">
        <img src="/logo-academia.jpeg" alt="Academia Industrial by Orbel grupo" />
      </footer>
    </div>
  );
}
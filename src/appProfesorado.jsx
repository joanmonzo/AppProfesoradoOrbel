import { useState, useEffect } from "react";
import "./index.css";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./login";

const API_URL = "https://script.google.com/macros/s/AKfycbwy8jdOcI_tuU05leo_ld68tGSjPw7rE2QA7tcOe46NIbrhuj-XsFKmTT6sWy-NUlrx/exec";

const initialForm = {
  nombre: "",
  titulacion: "Todas",
  categoriaTitulacion: [],
  cursos: [],
  localidad: "Todas",
  precioMax: "",
  sexo: "Todos",
  trabajado_con_orbel: "Indiferente",
  certificado_docencia: "Indiferente",
};

const CATEGORIA_KEYWORDS = {
  "Básica / Bachillerato": [
    "\\beso\\b", "bachiller", "bachillerato", "\\bbup\\b", "\\bcou\\b", "graduado escolar"
  ],
  "FP / Certificados": [
    "\\bfp\\b", "\\bfp1\\b", "\\bfp2\\b", "\\bfpi\\b", "\\bfpii\\b", "\\bfpb\\b",
    "formación profesional", "grado medio", "grado superior", "ciclo formativo",
    "técnico", "certificado de profesionalidad"
  ],
  "Universidad (Grado/Licenciatura)": [
    "grado en", "grado universitario", "graduad[oa]", "licenciatur[oa]",
    "diplomadur[oa]", "ingenier[ií]a", "ingeniero", "arquitect[oa]"
  ],
  "Máster / Postgrado": [
    "m[aá]ster", "postgrado", "posgrado", "doctor", "doctorado"
  ],
  "Formador / Docencia": [
    "formador", "docencia", "pedagog[ií]a", "magisterio", "cap"
  ]
};

const MultiSelectDropdown = ({ options, selected, onChange, placeholder = "Seleccionar..." }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        className="input"
        style={{
          cursor: "pointer", display: "flex", justifyContent: "space-between",
          alignItems: "center", userSelect: "none", background: "var(--input-bg)",
          minHeight: "40px"
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: 13, color: selected.length === 0 ? "var(--text-secondary)" : "var(--text-primary)" }}>
          {selected.length === 0 ? placeholder : `${selected.length} seleccionado(s)`}
        </span>
        <span style={{ fontSize: 10 }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <>
          <div
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              background: "var(--bg-primary)", border: "1px solid var(--border-color)",
              borderRadius: 8, maxHeight: 220, overflowY: "auto",
              boxShadow: "var(--card-shadow-hover)", marginTop: 4, padding: "8px 0"
            }}
          >
            {options.map((opt) => (
              <label
                key={opt}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  cursor: "pointer", fontSize: 13, color: "var(--text-primary)",
                  transition: "background 0.15s", margin: 0
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--accent-color)" }}
                />
                {opt}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
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
  const [form, setForm] = useState(() => {
    if (typeof window !== "undefined") {
      const isReload =
        (window.performance && window.performance.navigation && window.performance.navigation.type === 1) ||
        (window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType("navigation").length > 0 && window.performance.getEntriesByType("navigation")[0].type === "reload");

      if (isReload) {
        window.history.replaceState(null, "", window.location.pathname);
        return { ...initialForm };
      }

      const params = new URLSearchParams(window.location.search);
      const newForm = { ...initialForm };
      if (params.has("nombre")) newForm.nombre = params.get("nombre");
      if (params.has("titulacion")) newForm.titulacion = params.get("titulacion");
      if (params.has("localidad")) newForm.localidad = params.get("localidad");
      if (params.has("precioMax")) newForm.precioMax = params.get("precioMax");
      if (params.has("sexo")) newForm.sexo = params.get("sexo");
      if (params.has("trabajado_con_orbel")) newForm.trabajado_con_orbel = params.get("trabajado_con_orbel");
      if (params.has("certificado_docencia")) newForm.certificado_docencia = params.get("certificado_docencia");
      if (params.has("cursos") && params.get("cursos")) newForm.cursos = params.get("cursos").split(",");
      if (params.has("categoriaTitulacion") && params.get("categoriaTitulacion")) newForm.categoriaTitulacion = params.get("categoriaTitulacion").split(",");
      return newForm;
    }
    return { ...initialForm };
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  const [initialSearchTriggered, setInitialSearchTriggered] = useState(false);

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [nombresDisponibles, setNombresDisponibles] = useState([]);
  const [titulaciones, setTitulaciones] = useState([]);
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const itemsPerPage = 8;

  const [observaciones, setObservaciones] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});

  useEffect(() => {
    const processData = (data) => {
      setNombresDisponibles([...new Set(data.map(p => p.nombre || p.name).filter(Boolean))].sort());
      setTitulaciones([...new Set(data.map(p => p.titulacion).filter(Boolean))].sort());
      setCursosDisponibles([...new Set(
        data.flatMap(p => p.cursos ? (Array.isArray(p.cursos) ? p.cursos : p.cursos.split(",").map(c => c.trim())) : []).filter(Boolean)
      )].sort());
      setLocalidades([...new Set(data.map(p => p.localidad).filter(Boolean))].sort());
    };

    const cachedData = sessionStorage.getItem("orbel_data_cache");
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        processData(data);
        return;
      } catch (e) {
        console.error("Error leyendo caché", e);
      }
    }

    fetch(`${API_URL}?action=todos`)
      .then(res => res.json())
      .then(data => {
        sessionStorage.setItem("orbel_data_cache", JSON.stringify(data));
        processData(data);
      }).catch(() => { });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (form.nombre) params.set("nombre", form.nombre);
    if (form.titulacion && form.titulacion !== "Todas") params.set("titulacion", form.titulacion);
    if (form.localidad && form.localidad !== "Todas") params.set("localidad", form.localidad);
    if (form.precioMax) params.set("precioMax", form.precioMax);
    if (form.sexo && form.sexo !== "Todos") params.set("sexo", form.sexo);
    if (form.trabajado_con_orbel && form.trabajado_con_orbel !== "Indiferente") params.set("trabajado_con_orbel", form.trabajado_con_orbel);
    if (form.certificado_docencia && form.certificado_docencia !== "Indiferente") params.set("certificado_docencia", form.certificado_docencia);
    if (form.cursos && form.cursos.length > 0) params.set("cursos", form.cursos.join(","));
    if (form.categoriaTitulacion && form.categoriaTitulacion.length > 0) params.set("categoriaTitulacion", form.categoriaTitulacion.join(","));

    const paramsString = params.toString();
    const newSearch = paramsString ? `?${paramsString}` : "";
    const newUrl = `${window.location.pathname}${newSearch}`;

    if (window.location.search !== newSearch) {
      window.history.pushState(null, "", newUrl);
    }
  }, [form]);

  // Login Control
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        const email = u.email || "";
        const allowed = email.endsWith("@orbelgrupo.com") || email.endsWith("@academiaindustrial.com");

        if (!allowed) {
          signOut(auth);
          setUser(null);
          setLoadingAuth(false);
          return;
        }

        if (!u.emailVerified) {
          signOut(auth);
          setUser(null);
          setLoadingAuth(false);
          return;
        }

        setUser(u);
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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

  const handleSearch = async () => {
    setError(null);
    let data;

    try {
      const cachedData = sessionStorage.getItem("orbel_data_cache");

      if (cachedData) {
        data = JSON.parse(cachedData);
      } else {
        setLoading(true);
        const res = await fetch(`${API_URL}?action=todos`);

        if (!res.ok) {
          throw new Error(`Error de red: ${res.status} ${res.statusText}`);
        }

        data = await res.json();

        if (data && data.error) {
          throw new Error(`Error desde Google: ${data.message}`);
        }

        if (!Array.isArray(data)) {
          console.error("Lo que llegó de Google no es un Array:", data);
          throw new Error(
            "El servidor devolvió un formato incorrecto (revisa la consola).",
          );
        }

        sessionStorage.setItem("orbel_data_cache", JSON.stringify(data));
      }

      const filtered = data.filter((t) => {
        const matchCategoria =
          form.categoriaTitulacion.length === 0 ||
          form.categoriaTitulacion.some((cat) => {
            const tit = String(t.titulacion || "").toLowerCase();

            if (cat === "Sin titulación") {
              return (
                tit === "" || tit === "sin titulacion" || tit === "no indica"
              );
            }

            if (cat === "Otro") {
              const allKeywords = Object.values(CATEGORIA_KEYWORDS).flat();
              return !allKeywords.some((pattern) =>
                new RegExp(pattern, "i").test(tit),
              );
            }

            const keywords = CATEGORIA_KEYWORDS[cat];
            if (!keywords) return false;

            return keywords.some((pattern) =>
              new RegExp(pattern, "i").test(tit),
            );
          });

        const matchTitulacion =
          form.titulacion === "Todas" ||
          form.titulacion === "" ||
          (t.titulacion &&
            String(t.titulacion)
              .toLowerCase()
              .includes(form.titulacion.toLowerCase()));

        const matchCurso =
          form.cursos.length === 0 ||
          (() => {
            const profCursos = t.cursos
              ? Array.isArray(t.cursos)
                ? t.cursos
                : String(t.cursos)
                  .split(",")
                  .map((c) => c.trim())
              : [];
            return form.cursos.some((selectedCurso) =>
              profCursos.some((c) =>
                c.toLowerCase().includes(selectedCurso.toLowerCase()),
              ),
            );
          })();

        const matchLocalidad =
          form.localidad === "Todas" ||
          form.localidad === "" ||
          (t.localidad && String(t.localidad).trim() === form.localidad.trim());

        const matchSexo =
          form.sexo === "Todos" ||
          form.sexo === "" ||
          (t.sexo && String(t.sexo).toUpperCase().trim() === form.sexo);

        const matchPrecio =
          form.precioMax === "" ||
          (() => {
            const input = form.precioMax.trim();
            const precioProfesor = String(t.precio || "").trim();
            const esRango = precioProfesor.includes("-");
            const [pMin, pMax] = esRango
              ? precioProfesor.split("-").map((v) => Number(v.trim()))
              : [Number(precioProfesor), Number(precioProfesor)];

            if (input.includes("-")) {
              const [bMin, bMax] = input
                .split("-")
                .map((v) => Number(v.trim()));
              return pMin <= bMax && pMax >= bMin;
            }
            const bNum = Number(input);
            return pMin === bNum || pMax === bNum;
          })();

        const matchOrbel =
          form.trabajado_con_orbel === "Indiferente" ||
          (() => {
            const val = String(t.trabajado_con_orbel || "").toLowerCase().trim();
            const hasWorked = val.includes("si") || val.includes("sí") || /\d{4}/.test(val) || (val !== "" && !val.includes("no"));
            return form.trabajado_con_orbel === "Sí" ? hasWorked : !hasWorked;
          })();

        const matchCertDocencia =
          form.certificado_docencia === "Indiferente" ||
          (() => {
            const val = String(t.certificado_docencia || "")
              .toLowerCase()
              .trim();
            const isNo = val === "no" || val === "";
            return form.certificado_docencia === "Sí" ? !isNo : isNo;
          })();

        const matchNombre =
          form.nombre === "" ||
          String(t.nombre || t.name || "")
            .toLowerCase()
            .includes(form.nombre.toLowerCase());

        return (
          matchNombre &&
          matchCategoria &&
          matchTitulacion &&
          matchCurso &&
          matchLocalidad &&
          matchSexo &&
          matchPrecio &&
          matchOrbel &&
          matchCertDocencia
        );
      });

      setResults(filtered);
      setCurrentPage(1);

      const obs = {};
      filtered.forEach((t) => {
        obs[t.id] = t.observaciones ?? "";
      });
      setObservaciones(obs);
    } catch (err) {
      console.error("ERROR CAPTURADO EN REACT:", err);
      setError(err.message || "Error desconocido en el frontend.");
    } finally {
      setLoading(false);
    }
  };

  // Sincronización de Entrada: Ejecución automática
  useEffect(() => {
    if (user && !initialSearchTriggered) {
      const params = new URLSearchParams(window.location.search);
      if (params.toString() !== "") {
        handleSearch();
      }
      setInitialSearchTriggered(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialSearchTriggered]);

  const getNumericPrice = (p) => {
    if (!p) return Infinity;
    const str = String(p).trim();
    if (str.includes("-")) {
      return Number(str.split("-")[0]);
    }
    return Number(str) || Infinity;
  };

  const getScore = (t) => {
    let s = 0;
    const hasDocencia = String(t.certificado_docencia || "").toLowerCase().trim();
    if (hasDocencia !== "no" && hasDocencia !== "") s += 100;
    const hasTeleform = String(t.certificado_teleformacion || "").toLowerCase().trim();
    if (hasTeleform !== "no" && hasTeleform !== "") s += 50;
    const workedOrbel = String(t.trabajado_con_orbel || "").toLowerCase().trim();
    const hasWorked = workedOrbel.includes("si") || workedOrbel.includes("sí") || /\d{4}/.test(workedOrbel) || (workedOrbel !== "" && !workedOrbel.includes("no"));
    if (hasWorked) s += 30;
    return s;
  };

  const sortedResults = results ? [...results].sort((a, b) => {
    if (sortBy === "precioAsc") return getNumericPrice(a.precio) - getNumericPrice(b.precio);
    if (sortBy === "precioDesc") {
      const pA = getNumericPrice(a.precio) === Infinity ? 0 : getNumericPrice(a.precio);
      const pB = getNumericPrice(b.precio) === Infinity ? 0 : getNumericPrice(b.precio);
      return pB - pA;
    }
    if (sortBy === "nombreAsc") return String(a.nombre || a.name || "").localeCompare(String(b.nombre || b.name || ""));
    if (sortBy === "nombreDesc") return String(b.nombre || b.name || "").localeCompare(String(a.nombre || a.name || ""));
    if (sortBy === "localidadAsc") return String(a.localidad || "").localeCompare(String(b.localidad || ""));
    if (sortBy === "localidadDesc") return String(b.localidad || "").localeCompare(String(a.localidad || ""));
    return getScore(b) - getScore(a);
  }) : null;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = sortedResults ? sortedResults.slice(indexOfFirstItem, indexOfLastItem) : [];

  if (loadingAuth) {
    return (
      <div className="app-container">
        <div className="panel" style={{ textAlign: "center" }}>
          Cargando acceso...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <Login onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema" style={{ right: 80 }}>
        {theme === 'light' ? '☀️' : '🌙'}
      </button>
      <button onClick={() => signOut(auth)} className="theme-toggle" title="Cerrar sesión">
        🚪
      </button>

      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <h1 className="title-font" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4, letterSpacing: "-1px" }}>
          Academia Industrial by Orbel
        </h1>
        <p className="title-font" style={{ fontSize: 13, color: "var(--text-secondary)", letterSpacing: "4px", fontWeight: 600, textTransform: "uppercase", opacity: 0.8 }}>
          Directorio de profesorado
        </p>
      </div>

      <div className="panel">
        <div className="grid-2">
          <div>
            <label className="label">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              list="nombres-list"
              placeholder="Buscar profesor..."
              className="input"
            />
            <datalist id="nombres-list">
              {nombresDisponibles.map(n => <option key={n} value={n} />)}
            </datalist>
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
            <label className="label">Cursos</label>
            <MultiSelectDropdown
              options={cursosDisponibles}
              selected={form.cursos}
              onChange={(nuevosCursos) => setForm({ ...form, cursos: nuevosCursos })}
              placeholder="Todos los cursos"
            />
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
              <option value="Indiferente">Indiferente</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label className="label">Cert. Docencia</label>
            <select name="certificado_docencia" value={form.certificado_docencia} onChange={handleChange} className="input">
              <option value="Indiferente">Indiferente</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label className="label">Categoría Titulación</label>
            <MultiSelectDropdown
              options={[
                "Básica / Bachillerato",
                "FP / Certificados",
                "Universidad (Grado/Licenciatura)",
                "Máster / Postgrado",
                "Formador / Docencia",
                "Sin titulación",
                "Otro"
              ]}
              selected={form.categoriaTitulacion}
              onChange={(nuevasCategorias) => setForm({ ...form, categoriaTitulacion: nuevasCategorias })}
              placeholder="Todas las categorías"
            />
          </div>
          <div>
            <label className="label">Titulaciones</label>
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

      {error && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "var(--danger-text)"
        }}>
          ⚠️ {error}
        </div>
      )}

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
                  <option value="default">Relevancia (Certificados)</option>
                  <option value="precioAsc">Precio: menor a mayor</option>
                  <option value="precioDesc">Precio: mayor a menor</option>
                  <option value="nombreAsc">Nombre (A-Z)</option>
                  <option value="nombreDesc">Nombre (Z-A)</option>
                  <option value="localidadAsc">Ubicación (A-Z)</option>
                  <option value="localidadDesc">Ubicación (Z-A)</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {currentResults.map((t, i) => {
              const isExpanded = expandedId === t.id;
              return (
                <div key={t.id || i} className={`prof-card ${isExpanded ? 'expanded' : ''}`} onClick={() => setExpandedId(isExpanded ? null : t.id)}>

                  {/* Vista previa contraída */}
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
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.4 }}>🎓 {Array.isArray(t.titulacion) ? t.titulacion.join(" / ") : String(t.titulacion).split("/").map(x => x.trim()).join(" / ")}</div>
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
                        {(t.trabajado_con_orbel && (() => {
                          const val = String(t.trabajado_con_orbel).toLowerCase().trim();
                          return val.includes("si") || val.includes("sí") || /\d{4}/.test(val) || (val !== "" && !val.includes("no"));
                        })()) && (
                            <div className="badge badge-orbel">
                              ORBEL: {t.trabajado_con_orbel}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
                      <div className="grid-2" style={{ gap: 10 }}>
                        {[
                          {
                            label: "Titulación",
                            icon: "🎓",
                            render: () => {
                              const titList = Array.isArray(t.titulacion)
                                ? t.titulacion
                                : String(t.titulacion || "")
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter(Boolean);
                              return (
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {titList.map((tit, i) => (
                                    <li key={i} style={{ fontSize: 13, marginBottom: 8 }}>
                                      {tit}
                                    </li>
                                  ))}
                                </ul>
                              );
                            },
                          },
                          {
                            label: "Certificaciones",
                            icon: "📜",
                            render: () => {
                              const hasDocencia = t.certificado_docencia && t.certificado_docencia !== "";
                              const hasElearning = t.certificado_teleformacion && t.certificado_teleformacion !== "";

                              if (!hasDocencia && !hasElearning) return <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No indicadas</span>;

                              return (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                  {hasDocencia && (
                                    <div className={`badge ${t.certificado_docencia.toLowerCase().trim() === "no" ? 'badge-no' : 'badge-docencia'}`} style={{ margin: 0, padding: "4px 8px" }}>
                                      SSCE0110: {t.certificado_docencia}
                                    </div>
                                  )}
                                  {hasElearning && (
                                    <div className={`badge ${t.certificado_teleformacion.toLowerCase().trim() === "no" ? 'badge-no' : 'badge-elearning'}`} style={{ margin: 0, padding: "4px 8px" }}>
                                      E-LEARNING: {t.certificado_teleformacion}
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          },

                          {
                            label: "Precio",
                            value: t.precio ? `${t.precio} €` : null,
                            icon: "💰",
                          },
                          {
                            label: "Ha trabajado en Orbel",
                            value: t.trabajado_con_orbel,
                            icon: "🏢",
                          },

                          {
                            label: "Cursos",
                            icon: "📚",
                            colSpan: 2,
                            render: () => {
                              const cursosList = Array.isArray(t.cursos)
                                ? t.cursos
                                : String(t.cursos || "")
                                  .split(",")
                                  .map((c) => c.trim())
                                  .filter(Boolean);
                              return (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {cursosList.map((curso, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        background: "var(--bg-secondary)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: 6,
                                        padding: "4px 8px",
                                        fontSize: 12,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {curso}
                                    </span>
                                  ))}
                                </div>
                              );
                            },
                          },
                        ].map(({ label, value, icon, render, colSpan }) => {
                          if (!value && !render) return null;

                          return (
                            <div
                              key={label}
                              className="prof-card-detail"
                              style={colSpan ? { gridColumn: "1 / -1" } : {}}
                            >
                              <div
                                className="label"
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                  marginBottom: 3,
                                }}
                              >
                                {icon} {label}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>
                                {render ? render() : value}
                              </div>
                            </div>
                          );
                        })}
                      </div>

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

          <PaginationControls
            currentPage={currentPage}
            totalItems={results.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <footer className="footer">
        <img src={theme === 'light' ? "/logo-academia.jpeg" : "/logo-academia-dark.png"} alt="Academia Industrial by Orbel grupo" />
      </footer>
    </div>
  );
}
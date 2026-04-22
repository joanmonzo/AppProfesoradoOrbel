import { useState, useEffect } from "react";
import "./index.css";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

import Login from "./Login";
import FilterPanel from "./components/FilterPanel";
import ProfessorCard from "./components/ProfessorCard";
import PaginationControls from "./components/PaginationControls";

import { useAuth } from "./hooks/useAuth";
import { useFilters } from "./hooks/useFilters";
import { useProfessors } from "./hooks/useProfessors";

export default function TutorConnect() {
  const { user, setUser, loadingAuth } = useAuth();
  const { form, handleChange, handleMultiChange } = useFilters();
  const {
    results, currentResults, loading, error, nombresDisponibles, titulaciones, cursosDisponibles,
    localidades, currentPage, setCurrentPage, sortBy, setSortBy, observaciones, setObservaciones,
    savingId, saveStatus, handleSearch, handleGuardar, itemsPerPage
  } = useProfessors();

  const [theme, setTheme] = useState("light");
  const [expandedId, setExpandedId] = useState(null);
  const [initialSearchTriggered, setInitialSearchTriggered] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user && !initialSearchTriggered) {
      const params = new URLSearchParams(window.location.search);
      if (params.toString() !== "") handleSearch(form);
      setInitialSearchTriggered(true);
    }
  }, [user, initialSearchTriggered, form, handleSearch]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (loadingAuth) return <div className="app-container"><div className="panel" style={{ textAlign: "center" }}>Cargando acceso...</div></div>;
  if (!user) return <div className="app-container"><Login onLogin={setUser} /></div>;

  return (
    <div className="app-container">
      <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema" style={{ right: 80 }}>{theme === 'light' ? '☀️' : '🌙'}</button>
      <button onClick={() => signOut(auth)} className="theme-toggle" title="Cerrar sesión">🚪</button>

      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <h1 className="title-font" style={{ fontSize: 38, fontWeight: 700, marginBottom: 4, letterSpacing: "-1px" }}>Academia Industrial by Orbel</h1>
        <p className="title-font" style={{ fontSize: 13, color: "var(--text-secondary)", letterSpacing: "4px", fontWeight: 600, textTransform: "uppercase", opacity: 0.8 }}>Directorio de profesorado</p>
      </div>

      <FilterPanel
        form={form}
        onChange={handleChange}
        onMultiChange={handleMultiChange}
        nombresDisponibles={nombresDisponibles}
        titulaciones={titulaciones}
        cursosDisponibles={cursosDisponibles}
        localidades={localidades}
        onSearch={() => handleSearch(form)}
        loading={loading}
      />

      {error && <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "var(--danger-text)" }}>⚠️ {error}</div>}

      {results !== null && !error && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              {results.length > 0 ? <>Se han localizado <strong style={{ color: "var(--accent-color)", fontWeight: 700 }}>{results.length}</strong> perfil{results.length !== 1 ? "es profesionales" : " profesional"}</> : "No se han localizado perfiles que coincidan con la búsqueda."}
            </p>
            {results.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label className="label" style={{ marginBottom: 0 }}>ORDENAR:</label>
                <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} className="input" style={{ padding: "6px 10px", width: "auto", fontSize: 13, paddingRight: 30 }}>
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
            {currentResults.map((t) => (
              <ProfessorCard
                key={t.id}
                t={t}
                isExpanded={expandedId === t.id}
                onToggleExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
                observacion={observaciones[t.id] ?? ""}
                onObservacionChange={(id, val) => setObservaciones(prev => ({ ...prev, [id]: val }))}
                onGuardar={handleGuardar}
                savingId={savingId}
                saveStatus={saveStatus}
              />
            ))}
          </div>

          <PaginationControls currentPage={currentPage} totalItems={results.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </div>
      )}

      <footer className="footer">
        <img src={theme === 'light' ? "/logo-academia.jpeg" : "/logo-academia-dark.png"} alt="Academia Industrial by Orbel grupo" />
      </footer>
    </div>
  );
}
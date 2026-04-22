export default function ProfessorCard({ t, isExpanded, onToggleExpand, observacion, onObservacionChange, onGuardar, savingId, saveStatus }) {

    // Extracción global y segura de los datos de Orbel para esta tarjeta
    const orbelKey = Object.keys(t).find(k => k.toLowerCase().includes("orbel"));
    const rawOrbelVal = orbelKey ? t[orbelKey] : (t.trabajado_con_orbel || "");
    const valOrbelStr = String(rawOrbelVal).toLowerCase().trim();
    const hasWorkedOrbel = valOrbelStr !== "" && valOrbelStr !== "false" && valOrbelStr !== "falso" && !/^no\b/.test(valOrbelStr);

    return (
        <div className={`prof-card ${isExpanded ? 'expanded' : ''}`} onClick={onToggleExpand}>
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
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.4 }}>
                            🎓 {Array.isArray(t.titulacion) ? t.titulacion.join(" / ") : String(t.titulacion).split("/").map(x => x.trim()).join(" / ")}
                        </div>
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
                        {hasWorkedOrbel && (
                            <div className="badge badge-orbel">
                                ORBEL: {rawOrbelVal}
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
                                    const titList = Array.isArray(t.titulacion) ? t.titulacion : String(t.titulacion || "").split(",").map(x => x.trim()).filter(Boolean);
                                    return (
                                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                                            {titList.map((tit, i) => <li key={i} style={{ fontSize: 13, marginBottom: 8 }}>{tit}</li>)}
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
                                            {hasDocencia && <div className={`badge ${t.certificado_docencia.toLowerCase().trim() === "no" ? 'badge-no' : 'badge-docencia'}`} style={{ margin: 0, padding: "4px 8px" }}>SSCE0110: {t.certificado_docencia}</div>}
                                            {hasElearning && <div className={`badge ${t.certificado_teleformacion.toLowerCase().trim() === "no" ? 'badge-no' : 'badge-elearning'}`} style={{ margin: 0, padding: "4px 8px" }}>E-LEARNING: {t.certificado_teleformacion}</div>}
                                        </div>
                                    );
                                },
                            },
                            { label: "Precio", value: t.precio ? `${t.precio} €` : null, icon: "💰" },
                            { label: "Ha trabajado en Orbel", value: rawOrbelVal || "No", icon: "🏢" },
                            {
                                label: "Cursos",
                                icon: "📚",
                                colSpan: 2,
                                render: () => {
                                    const cursosList = Array.isArray(t.cursos) ? t.cursos : String(t.cursos || "").split(",").map(c => c.trim()).filter(Boolean);
                                    return (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {cursosList.map((curso, i) => (
                                                <span key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 500 }}>
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
                                <div key={label} className="prof-card-detail" style={colSpan ? { gridColumn: "1 / -1" } : {}}>
                                    <div className="label" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>{icon} {label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{render ? render() : value}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <div className="label" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>📝 Observaciones</div>
                        <textarea
                            value={observacion}
                            onChange={(e) => onObservacionChange(t.id, e.target.value)}
                            placeholder="Escribe una observación..."
                            rows={3}
                            className="input"
                            style={{ resize: "vertical", background: "var(--bg-primary)" }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                            <button
                                onClick={() => onGuardar(t.id, observacion)}
                                disabled={savingId === t.id}
                                style={{ background: savingId === t.id ? "var(--border-color)" : "var(--text-primary)", color: "var(--bg-secondary)", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: savingId === t.id ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
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
}
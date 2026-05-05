import { useState, useEffect, useRef } from "react";

export default function SingleSearchableSelect({ name, options, value, onChange, placeholder = "Seleccionar..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        onChange({ target: { name: name, value: opt === "___CLEAR___" ? "" : opt } });
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div ref={containerRef} style={{ position: "relative", minWidth: 0 }}>
            <div
                className="input"
                style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--input-bg)",
                    minWidth: 0,
                    width: "100%",
                    overflow: "hidden"
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{
                    fontSize: 13,
                    color: !value || value === "Todas" ? "var(--text-secondary)" : "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginRight: 8,
                    flex: 1, // Toma todo el espacio disponible
                    minWidth: 0 // Crucial para que elipsis funcione en flexbox
                }}>
                    {(!value || value === "Todas") ? placeholder : value}
                </span>
                <span style={{ fontSize: 10, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8, boxShadow: "var(--card-shadow-hover)", marginTop: 4, padding: "8px" }}>
                    <input
                        type="text"
                        autoFocus
                        className="input"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginBottom: 8, fontSize: 13, padding: "8px" }}
                    />
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        <div
                            style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderRadius: 4 }}
                            onClick={() => handleSelect("___CLEAR___")}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            Ver todos
                        </div>
                        {filteredOptions.map((opt) => (
                            <div
                                key={opt}
                                style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderRadius: 4 }}
                                onClick={() => handleSelect(opt)}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                                {opt}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                                No se han encontrado resultados
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

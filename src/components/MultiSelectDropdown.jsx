import { useState } from "react";

export default function MultiSelectDropdown({ options, selected, onChange, placeholder = "Seleccionar..." }) {
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
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none", background: "var(--input-bg)", minHeight: "40px" }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ fontSize: 13, color: selected.length === 0 ? "var(--text-secondary)" : "var(--text-primary)" }}>
                    {selected.length === 0 ? placeholder : `${selected.length} seleccionado(s)`}
                </span>
                <span style={{ fontSize: 10 }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
                <>
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} onClick={() => setIsOpen(false)} />
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8, maxHeight: 220, overflowY: "auto", boxShadow: "var(--card-shadow-hover)", marginTop: 4, padding: "8px 0" }}>
                        {options.map((opt) => (
                            <label
                                key={opt}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "var(--text-primary)", transition: "background 0.15s", margin: 0 }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleOption(opt)} style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--accent-color)" }} />
                                {opt}
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
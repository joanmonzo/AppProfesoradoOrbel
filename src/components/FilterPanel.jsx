// Panel de filtros de búsqueda
// Permite filtrar por nombre, sexo, cursos, ubicación, experiencia y titulaciones

import MultiSelectDropdown from "./MultiSelectDropdown";

export default function FilterPanel({ form, onChange, onMultiChange, nombresDisponibles, titulaciones, cursosDisponibles, localidades, onSearch, loading }) {
    return (
        <div className="panel">
            <div className="grid-2">
                <div>
                    <label className="label">Nombre</label>
                    <input type="text" name="nombre" value={form.nombre} onChange={onChange} list="nombres-list" placeholder="Buscar profesor..." className="input" />
                    <datalist id="nombres-list">
                        {nombresDisponibles.map(n => <option key={n} value={n} />)}
                    </datalist>
                </div>
                <div>
                    <label className="label">Sexo</label>
                    <select name="sexo" value={form.sexo} onChange={onChange} className="input">
                        <option value="Todos">Todos</option>
                        <option value="M">Masculino (M)</option>
                        <option value="F">Femenino (F)</option>
                    </select>
                </div>
                <div>
                    <label className="label">Cursos</label>
                    <MultiSelectDropdown options={cursosDisponibles} selected={form.cursos} onChange={(v) => onMultiChange("cursos", v)} placeholder="Todos los cursos" />
                </div>
                <div>
                    <label className="label">Ubicación</label>
                    <select name="localidad" value={form.localidad} onChange={onChange} className="input">
                        <option value="Todas">Todas</option>
                        {localidades.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Trabajó en Orbel</label>
                    <select name="trabajado_con_orbel" value={form.trabajado_con_orbel} onChange={onChange} className="input">
                        <option value="Indiferente">Indiferente</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                    </select>
                </div>
                <div>
                    <label className="label">Cert. Docencia</label>
                    <select name="certificado_docencia" value={form.certificado_docencia} onChange={onChange} className="input">
                        <option value="Indiferente">Indiferente</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                    </select>
                </div>
                <div>
                    <label className="label">Categoría Titulación</label>
                    <MultiSelectDropdown
                        options={["Básica / Bachillerato", "FP / Certificados", "Universidad (Grado/Licenciatura)", "Máster / Postgrado", "Formador / Docencia", "Sin titulación", "Otro"]}
                        selected={form.categoriaTitulacion}
                        onChange={(v) => onMultiChange("categoriaTitulacion", v)}
                        placeholder="Todas las categorías"
                    />
                </div>
                <div>
                    <label className="label">Titulaciones</label>
                    <input type="text" name="titulacion" value={form.titulacion === "Todas" ? "" : form.titulacion} onChange={onChange} list="titulaciones-list" className="input" placeholder="Ej. Prevención, Soldadura, Marketing..." />
                    <datalist id="titulaciones-list">{titulaciones.map(t => <option key={t} value={t} />)}</datalist>
                </div>
            </div>
            <button onClick={onSearch} disabled={loading} className="btn-primary title-font">
                {loading ? "BUSCANDO PERFILES..." : "🔍 EXPLORAR PROFESORADO"}
            </button>
        </div>
    );
}
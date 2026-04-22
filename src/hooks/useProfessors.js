import { useState, useEffect } from "react";
import { API_URL, CATEGORIA_KEYWORDS } from "../utils/constants";

export const useProfessors = () => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [nombresDisponibles, setNombresDisponibles] = useState([]);
    const [titulaciones, setTitulaciones] = useState([]);
    const [cursosDisponibles, setCursosDisponibles] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("default");
    const [observaciones, setObservaciones] = useState({});
    const [savingId, setSavingId] = useState(null);
    const [saveStatus, setSaveStatus] = useState({});

    const itemsPerPage = 8;

    useEffect(() => {
        const processData = (data) => {
            setNombresDisponibles([...new Set(data.map(p => p.nombre || p.name).filter(Boolean))].sort());
            setTitulaciones([...new Set(data.map(p => p.titulacion).filter(Boolean))].sort());
            setCursosDisponibles([...new Set(data.flatMap(p => p.cursos ? (Array.isArray(p.cursos) ? p.cursos : p.cursos.split(",").map(c => c.trim())) : []).filter(Boolean))].sort());
            setLocalidades([...new Set(data.map(p => p.localidad).filter(Boolean))].sort());
        };

        const cachedData = sessionStorage.getItem("orbel_data_cache");
        if (cachedData) {
            try {
                processData(JSON.parse(cachedData));
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

    const handleSearch = async (form) => {
        setError(null);
        let data;

        try {
            const cachedData = sessionStorage.getItem("orbel_data_cache");
            if (cachedData) {
                data = JSON.parse(cachedData);
            } else {
                setLoading(true);
                const res = await fetch(`${API_URL}?action=todos`);
                if (!res.ok) throw new Error(`Error de red: ${res.status} ${res.statusText}`);
                data = await res.json();
                if (data && data.error) throw new Error(`Error desde Google: ${data.message}`);
                if (!Array.isArray(data)) throw new Error("El servidor devolvió un formato incorrecto (revisa la consola).");
                sessionStorage.setItem("orbel_data_cache", JSON.stringify(data));
            }

            const filtered = data.filter((t) => {
                const matchCategoria = form.categoriaTitulacion.length === 0 || form.categoriaTitulacion.some((cat) => {
                    const tit = String(t.titulacion || "").toLowerCase();
                    if (cat === "Sin titulación") return tit === "" || tit === "sin titulacion" || tit === "no indica";
                    if (cat === "Otro") return !Object.values(CATEGORIA_KEYWORDS).flat().some((pattern) => new RegExp(pattern, "i").test(tit));
                    const keywords = CATEGORIA_KEYWORDS[cat];
                    return keywords ? keywords.some((pattern) => new RegExp(pattern, "i").test(tit)) : false;
                });

                const matchTitulacion = form.titulacion === "Todas" || form.titulacion === "" || (t.titulacion && String(t.titulacion).toLowerCase().includes(form.titulacion.toLowerCase()));

                const matchCurso = form.cursos.length === 0 || (() => {
                    const profCursos = t.cursos ? (Array.isArray(t.cursos) ? t.cursos : String(t.cursos).split(",").map((c) => c.trim())) : [];
                    return form.cursos.some((selectedCurso) => profCursos.some((c) => c.toLowerCase().includes(selectedCurso.toLowerCase())));
                })();

                const matchLocalidad = form.localidad === "Todas" || form.localidad === "" || (t.localidad && String(t.localidad).trim() === form.localidad.trim());
                const matchSexo = form.sexo === "Todos" || form.sexo === "" || (t.sexo && String(t.sexo).toUpperCase().trim() === form.sexo);

                const matchPrecio = form.precioMax === "" || (() => {
                    const input = form.precioMax.trim();
                    const precioProfesor = String(t.precio || "").trim();
                    const esRango = precioProfesor.includes("-");
                    const [pMin, pMax] = esRango ? precioProfesor.split("-").map((v) => Number(v.trim())) : [Number(precioProfesor), Number(precioProfesor)];
                    if (input.includes("-")) {
                        const [bMin, bMax] = input.split("-").map((v) => Number(v.trim()));
                        return pMin <= bMax && pMax >= bMin;
                    }
                    const bNum = Number(input);
                    return pMin === bNum || pMax === bNum;
                })();

                const matchOrbel = form.trabajado_con_orbel === "Indiferente" || (() => {
                    const val = String(t.trabajado_con_orbel || "").toLowerCase().trim();
                    const hasWorked = val.includes("si") || val.includes("sí") || /\d{4}/.test(val) || (val !== "" && !val.includes("no"));
                    return form.trabajado_con_orbel === "Sí" ? hasWorked : !hasWorked;
                })();

                const matchCertDocencia = form.certificado_docencia === "Indiferente" || (() => {
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
            filtered.forEach((t) => { obs[t.id] = t.observaciones ?? ""; });
            setObservaciones(obs);
        } catch (err) {
            setError(err.message || "Error desconocido en el frontend.");
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async (id, texto) => {
        setSavingId(id);
        setSaveStatus(prev => ({ ...prev, [id]: null }));
        try {
            const query = new URLSearchParams({ action: "observaciones", id, observaciones: texto, observacion: texto }).toString();
            const res = await fetch(`${API_URL}?${query}`, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: texto });
            if (!res.ok) throw new Error();
            setSaveStatus(prev => ({ ...prev, [id]: "ok" }));
        } catch {
            setSaveStatus(prev => ({ ...prev, [id]: "error" }));
        } finally {
            setSavingId(null);
        }
    };

    const getNumericPrice = (p) => {
        if (!p) return Infinity;
        const str = String(p).trim();
        return str.includes("-") ? Number(str.split("-")[0]) : Number(str) || Infinity;
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
        if (sortBy === "precioDesc") return (getNumericPrice(b.precio) === Infinity ? 0 : getNumericPrice(b.precio)) - (getNumericPrice(a.precio) === Infinity ? 0 : getNumericPrice(a.precio));
        if (sortBy === "nombreAsc") return String(a.nombre || a.name || "").localeCompare(String(b.nombre || b.name || ""));
        if (sortBy === "nombreDesc") return String(b.nombre || b.name || "").localeCompare(String(a.nombre || a.name || ""));
        if (sortBy === "localidadAsc") return String(a.localidad || "").localeCompare(String(b.localidad || ""));
        if (sortBy === "localidadDesc") return String(b.localidad || "").localeCompare(String(a.localidad || ""));
        return getScore(b) - getScore(a);
    }) : null;

    const currentResults = sortedResults ? sortedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

    return {
        results, currentResults, loading, error, nombresDisponibles, titulaciones, cursosDisponibles, localidades,
        currentPage, setCurrentPage, sortBy, setSortBy, observaciones, setObservaciones, savingId, saveStatus,
        handleSearch, handleGuardar, itemsPerPage
    };
};
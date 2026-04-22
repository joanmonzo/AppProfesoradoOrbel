import { useState, useEffect } from "react";
import { initialForm } from "../utils/constants";

export const useFilters = () => {
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

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const handleMultiChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    return { form, setForm, handleChange, handleMultiChange };
};
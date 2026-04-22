export const API_URL = "https://script.google.com/macros/s/AKfycbwy8jdOcI_tuU05leo_ld68tGSjPw7rE2QA7tcOe46NIbrhuj-XsFKmTT6sWy-NUlrx/exec";

export const initialForm = {
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

export const CATEGORIA_KEYWORDS = {
    "Básica / Bachillerato": ["\\beso\\b", "bachiller", "bachillerato", "\\bbup\\b", "\\bcou\\b", "graduado escolar"],
    "FP / Certificados": ["\\bfp\\b", "\\bfp1\\b", "\\bfp2\\b", "\\bfpi\\b", "\\bfpii\\b", "\\bfpb\\b", "formación profesional", "grado medio", "grado superior", "ciclo formativo", "técnico", "certificado de profesionalidad"],
    "Universidad (Grado/Licenciatura)": ["grado en", "grado universitario", "graduad[oa]", "licenciatur[oa]", "diplomadur[oa]", "ingenier[ií]a", "ingeniero", "arquitect[oa]"],
    "Máster / Postgrado": ["m[aá]ster", "postgrado", "posgrado", "doctor", "doctorado"],
    "Formador / Docencia": ["formador", "docencia", "pedagog[ií]a", "magisterio", "cap"]
};
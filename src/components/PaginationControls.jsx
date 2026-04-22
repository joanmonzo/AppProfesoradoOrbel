export default function PaginationControls({ currentPage, totalItems, itemsPerPage, onPageChange }) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalItems <= itemsPerPage) return null;

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 24, gap: 16 }}>
            <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="pagination-btn">
                Anterior
            </button>
            <div style={{ fontSize: 14 }}>
                Página <strong>{currentPage}</strong> de {totalPages}
            </div>
            <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="pagination-btn">
                Siguiente
            </button>
        </div>
    );
}
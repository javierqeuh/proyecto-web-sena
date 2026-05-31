/**
 * Lógica para la página: historia-envio.html
 * Responsabilidades:
 * - Cargar historial de encuestas enviadas por el usuario
 * - Mostrar información de envíos (fecha, cantidad de respuestas, estado)
 * - Reenviar encuestas
 * - Exportar historial a Excel
 * - Manejar errores y notificaciones
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Verificación de página
    if (document.body.id !== 'page-historia-envio') {
        return;
    }

    // 2. Configuración y Elementos
    const BASE_URL = 'http://localhost:3001';
    const token = localStorage.getItem('userToken');
    
    const tableBody = document.getElementById('history-table-body');
    const dateStart = document.getElementById('filter-date-start');
    const dateEnd = document.getElementById('filter-date-end');
    const statusFilter = document.getElementById('filter-status');
    
    let allHistory = [];

    // 3. Seguridad básica
    if (!token) {
        if (window.showAppNotification) window.showAppNotification('Inicia sesión para continuar.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    // 4. Carga de datos
    const fetchHistory = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/dashboard/historial-envios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                allHistory = result.data || [];
                renderTable(allHistory);
            } else {
                throw new Error(result.error || 'Error al obtener historial');
            }
        } catch (error) {
            console.error('Error:', error);
            if (window.showAppNotification) window.showAppNotification(error.message, 'error');
        }
    };

    // 5. Renderizado de tabla
    const renderTable = (data) => {
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron registros.</td></tr>';
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            const fechaStr = new Date(item.fecha_envio || item.fecha_creacion).toLocaleString();
            const estado = (item.estado || 'pendiente').toLowerCase();
            
            row.innerHTML = `
                <td>${item.titulo_encuesta}</td>
                <td>${item.nombre_usuario || 'Varios'}</td>
                <td>${fechaStr}</td>
                <td><span class="status-badge" style="color: ${estado === 'completado' ? '#28a745' : '#ffc107'}">${estado.toUpperCase()}</span></td>
                <td>
                    <button class="secondary" onclick="verResultados(${item.id_encuesta})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    // 6. Lógica de Filtrado
    const applyFilters = () => {
        const start = dateStart.value;
        const end = dateEnd.value;
        const status = statusFilter.value;

        const filtered = allHistory.filter(item => {
            const itemDate = new Date(item.fecha_envio || item.fecha_creacion).toISOString().split('T')[0];
            
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            if (status !== 'all' && item.estado !== status) return false;
            
            return true;
        });

        renderTable(filtered);
    };

    // Listeners para filtros automáticos
    dateStart.addEventListener('change', applyFilters);
    dateEnd.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    // 7. Navegación global
    window.verResultados = (id) => {
        sessionStorage.setItem('selectedSurveyId', id);
        window.location.href = 'resultados-y-reportes.html';
    };

    // Inicio
    fetchHistory();
});

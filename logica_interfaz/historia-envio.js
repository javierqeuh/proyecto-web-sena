/**
 * Lógica para la página: historia-envio.html
 * Responsabilidades:
 * - Cargar historial de encuestas enviadas por el usuario
 * - Mostrar información de envíos (fecha, cantidad de respuestas, estado)
 * - Filtrar por rango de fechas
 * - Filtrar por usuario/estado
 * - Reenviar encuestas
 * - Exportar historial a Excel
 * - Manejar errores y notificaciones
 */

document.addEventListener('DOMContentLoaded', function () {
    if (document.body.id !== 'page-historia-envio') return;

    const BASE_URL = 'http://localhost:3001';
    const token = localStorage.getItem('userToken');
    let historyData = [];
    let filteredData = [];

    if (!token) {
        window.showAppNotification('Tu sesión ha expirado.', 'error');
        return setTimeout(() => window.location.href = 'index.html', 1000);
    }

    // Inicialización
    setupUI();
    loadHistory();

    // --- Funciones Principales ---

    function setupUI() {
        const container = document.querySelector('.container');
        let filterCard = container.querySelector('.card');

        // Inyectar filtros si no existen
        if (!filterCard || !filterCard.querySelector('input')) {
            if (!filterCard) {
                filterCard = document.createElement('div');
                filterCard.className = 'card';
                container.prepend(filterCard);
            }
            filterCard.innerHTML = `
                <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px;"><label>Desde:</label><input type="date" id="filter-date-from" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;"></div>
                    <div style="flex: 1; min-width: 150px;"><label>Hasta:</label><input type="date" id="filter-date-to" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;"></div>
                    <div style="flex: 1; min-width: 150px;"><label>Estado:</label>
                        <select id="filter-status" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
                            <option value="">Todos</option><option value="pendiente">Pendiente</option><option value="en_progreso">En progreso</option><option value="cerrada">Cerrada</option>
                        </select>
                    </div>
                    <button id="apply-filters-btn" class="secondary">Filtrar</button>
                    <button id="export-btn" class="secondary">Exportar Excel</button>
                </div>`;
            
            document.getElementById('apply-filters-btn').onclick = applyFilters;
            document.getElementById('export-btn').onclick = exportToExcel;
        }

        // Inyectar tabla si no existe
        if (!document.querySelector('table')) {
            container.insertAdjacentHTML('beforeend', `
                <table class="table" style="margin-top: 20px;">
                    <thead><tr><th>Encuesta</th><th>Creación</th><th>Envío</th><th>Asignados</th><th>Respondidos</th><th>%</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody id="history-table-body"></tbody>
                </table>`);
        }
    }

    async function loadHistory() {
        try {
            const res = await fetch(`${BASE_URL}/api/historial-envios`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (res.ok) {
                historyData = json.data || [];
                filteredData = [...historyData];
                renderTable(filteredData);
            } else throw new Error(json.error || 'Error cargando historial');
        } catch (e) { console.error(e); window.showAppNotification(e.message, 'error'); }
    }

    function renderTable(data) {
        const tbody = document.getElementById('history-table-body');
        if (!data.length) return tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">No hay registros.</td></tr>';

        const isWorker = localStorage.getItem('userRole') === 'trabajador';
        const colors = { 'pendiente': '#FF9800', 'en_progreso': '#2196F3', 'cerrada': '#4CAF50', 'enviada': '#28a745' };

        tbody.innerHTML = data.map(r => {
            const pct = Math.round((r.total_respondidos / r.total_asignados) * 100) || 0;
            return `
                <tr>
                    <td>${r.titulo_encuesta}</td>
                    <td>${new Date(r.fecha_creacion).toLocaleDateString()}</td>
                    <td>${new Date(r.fecha_envio).toLocaleDateString()}</td>
                    <td>${r.total_asignados}</td>
                    <td>${r.total_respondidos}</td>
                    <td>${pct}%</td>
                    <td><span style="color:${colors[r.estado] || '#666'}; font-weight:bold;">${r.estado.replace('_', ' ').toUpperCase()}</span></td>
                    <td>
                        ${!isWorker ? `<button class="secondary" onclick="reenviarEncuesta(${r.id_encuesta})" style="margin-right:5px;">Reenviar</button>` : ''}
                        <button class="secondary" onclick="verDetalles(${r.id_envio})">Detalles</button>
                    </td>
                </tr>`;
        }).join('');
    }

    function applyFilters() {
        const from = document.getElementById('filter-date-from').value;
        const to = document.getElementById('filter-date-to').value;
        const status = document.getElementById('filter-status').value;

        filteredData = historyData.filter(r => {
            const d = new Date(r.fecha_envio);
            if (from && d < new Date(from)) return false;
            if (to && d > new Date(to + 'T23:59:59')) return false;
            if (status && r.estado !== status) return false;
            return true;
        });
        renderTable(filteredData);
        window.showAppNotification('Filtros aplicados', 'success');
    }

    function exportToExcel() {
        if (!filteredData.length) return window.showAppNotification('No hay datos para exportar', 'error');
        const csv = ['Encuesta,Creación,Envío,Asignados,Respondidos,%,Estado', ...filteredData.map(r => 
            `"${r.titulo_encuesta}","${new Date(r.fecha_creacion).toLocaleDateString()}","${new Date(r.fecha_envio).toLocaleDateString()}",${r.total_asignados},${r.total_respondidos},${Math.round((r.total_respondidos/r.total_asignados)*100)}%,"${r.estado}"`
        )].join('\n');
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = `historial-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    // --- Funciones Globales para HTML ---
    window.reenviarEncuesta = async (id) => {
        if (!confirm('¿Reenviar encuesta?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/historial-envios/${id}/reenviar`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (res.ok) { window.showAppNotification('Reenviada correctamente', 'success'); loadHistory(); }
            else throw new Error((await res.json()).error);
        } catch (e) { window.showAppNotification(e.message || 'Error de conexión', 'error'); }
    };

    window.verDetalles = (id) => {
        sessionStorage.setItem('selectedSurveyId', id);
        window.location.href = 'resultados-y-reportes.html';
    };
});
        }
    };

    /**
     * Configura los filtros de fecha y usuario
     */
    const setupFilters = () => {
        // Crear elementos de filtro si no existen
        const filterCard = container.querySelector('.card');
        if (!filterCard || filterCard.querySelectorAll('input').length === 0) {
            const filtersHTML = `
                <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Desde:</label>
                        <input type="date" id="filter-date-from" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Hasta:</label>
                        <input type="date" id="filter-date-to" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Estado:</label>
                        <select id="filter-status" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En progreso</option>
                            <option value="cerrada">Cerrada</option>
                        </select>
                    </div>
                    <button id="apply-filters-btn" class="secondary" style="margin-top: 22px;">Filtrar</button>
                    <button id="export-btn" class="secondary" style="margin-top: 22px;">Exportar Excel</button>
                </div>
            `;
            if (filterCard) {
                filterCard.innerHTML = filtersHTML;
            }

            // Agregar event listeners
            document.getElementById('apply-filters-btn')?.addEventListener('click', applyFilters);
            document.getElementById('export-btn')?.addEventListener('click', exportToExcel);
        }
    };

    /**
     * Muestra el historial en la tabla
     */
    const displayHistory = () => {
        if (!tableContainer) {
            // Crear tabla si no existe
            const tableHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Encuesta</th>
                            <th>Fecha de Creación</th>
                            <th>Fecha de Envío</th>
                            <th>Asignados</th>
                            <th>Respondidos</th>
                            <th>% Respuesta</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="history-table-body">
                    </tbody>
                </table>
            `;
            container.insertAdjacentHTML('afterbegin', tableHTML);
        }

        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #6c757d;">No hay registros de envío.</td></tr>';
            return;
        }

        filteredData.forEach(record => {
            const tr = document.createElement('tr');
            const fecha_creacion = new Date(record.fecha_creacion).toLocaleDateString('es-ES');
            const fecha_envio = new Date(record.fecha_envio).toLocaleDateString('es-ES');
            const porcentaje = Math.round((record.total_respondidos / record.total_asignados) * 100);
            const userRole = localStorage.getItem('userRole');
            const isWorker = userRole === 'trabajador';

            tr.innerHTML = `
                <td>${record.titulo_encuesta}</td>
                <td>${fecha_creacion}</td>
                <td>${fecha_envio}</td>
                <td>${record.total_asignados}</td>
                <td>${record.total_respondidos}</td>
                <td>${porcentaje}%</td>
                <td><span style="color: ${getStatusColor(record.estado)}; font-weight: bold;">${capitalizeStatus(record.estado)}</span></td>
                <td>
                    ${!isWorker ? `<button class="secondary" onclick="reenviarEncuesta(${record.id_encuesta})" style="margin-right: 5px;">Reenviar</button>` : ''}
                    <button class="secondary" onclick="verDetalles(${record.id_envio})">Detalles</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    /**
     * Obtiene el color del estado
     * @param {string} estado - Estado del envío
     * @returns {string} Color en hexadecimal
     */
    const getStatusColor = (estado) => {
        const colors = {
            'pendiente': '#FF9800',
            'en_progreso': '#2196F3',
            'cerrada': '#4CAF50',
            'enviada': '#28a745'
        };
        return colors[estado] || '#666';
    };

    /**
     * Capitaliza el estado para mostrar
     * @param {string} estado - Estado del envío
     * @returns {string} Estado capitalizado
     */
    const capitalizeStatus = (estado) => {
        const statuses = {
            'pendiente': 'Pendiente',
            'en_progreso': 'En Progreso',
            'cerrada': 'Cerrada',
            'enviada': 'Enviada'
        };
        return statuses[estado] || estado;
    };

    /**
     * Aplica los filtros de fecha y estado
     */
    const applyFilters = () => {
        const dateFrom = document.getElementById('filter-date-from')?.value;
        const dateTo = document.getElementById('filter-date-to')?.value;
        const status = document.getElementById('filter-status')?.value;

        filteredData = historyData.filter(record => {
            const recordDate = new Date(record.fecha_envio);

            // Filtro de fecha desde
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (recordDate < fromDate) return false;
            }

            // Filtro de fecha hasta
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (recordDate > toDate) return false;
            }

            // Filtro de estado
            if (status && record.estado !== status) return false;

            return true;
        });

        displayHistory();
        window.showAppNotification('Filtros aplicados.', 'success');
    };

    /**
     * Reenvía una encuesta a los trabajadores
     * @param {number} surveyId - ID de la encuesta
     */
    window.reenviarEncuesta = async (surveyId) => {
        if (!checkAuthentication()) return;

        if (!confirm('¿Deseas reenviar esta encuesta?')) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`http://localhost:3001/api/historial-envios/${surveyId}/reenviar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                window.showAppNotification('Encuesta reenviada correctamente.', 'success');
                loadHistory();
            } else {
                window.showAppNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            window.showAppNotification('No se pudo conectar con el servidor.', 'error');
        }
    };

    /**
     * Ver detalles de un envío
     * @param {number} envioId - ID del envío
     */
    window.verDetalles = (envioId) => {
        sessionStorage.setItem('selectedSurveyId', envioId);
        window.location.href = 'resultados-y-reportes.html';
    };

    /**
     * Exporta el historial a Excel
     */
    const exportToExcel = () => {
        if (filteredData.length === 0) {
            window.showAppNotification('No hay datos para exportar.', 'error');
            return;
        }

        try {
            let csv = 'Encuesta,Fecha de Creación,Fecha de Envío,Asignados,Respondidos,%Respuesta,Estado\n';

            filteredData.forEach(record => {
                const fecha_creacion = new Date(record.fecha_creacion).toLocaleDateString('es-ES');
                const fecha_envio = new Date(record.fecha_envio).toLocaleDateString('es-ES');
                const porcentaje = Math.round((record.total_respondidos / record.total_asignados) * 100);

                csv += `"${record.titulo_encuesta}","${fecha_creacion}","${fecha_envio}",${record.total_asignados},${record.total_respondidos},${porcentaje}%,"${record.estado}"\n`;
            });

            // Crear blob y descargar
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `historial-envios-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.showAppNotification('Historial exportado correctamente.', 'success');
        } catch (error) {
            console.error('Error al exportar:', error);
            window.showAppNotification('Error al exportar el archivo.', 'error');
        }
    };

    // ========== INICIALIZACIÓN ==========

    loadHistory();
});

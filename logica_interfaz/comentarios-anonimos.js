document.addEventListener('DOMContentLoaded', () => {
    if (document.body.id !== 'page-comentarios-anonimos') return;

    const tableBody = document.getElementById('comments-table-body');

    const loadComments = async () => {
        try {
            const token = localStorage.getItem('userToken');
            // Cambiamos el endpoint para obtener feedback real de la base de datos
            const response = await fetch('http://localhost:3001/api/surveys/mis-comentarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            const comments = result.data || [];

            if (comments.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No tienes retroalimentación pendiente.</td></tr>';
                return;
            }

            tableBody.innerHTML = comments.map(c => `
                <tr>
                    <td>${c.encuesta}</td>
                    <td>${new Date(c.fecha).toLocaleDateString()}</td>
                    <td>${c.texto}</td>
                    <td>
                        <button class="secondary" style="padding: 5px 10px; font-size: 12px;">Ver detalles</button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="4">Error al cargar comentarios.</td></tr>';
        }
    };

    loadComments();
});
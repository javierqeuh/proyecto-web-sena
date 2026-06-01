document.addEventListener('DOMContentLoaded', () => {
    if (document.body.id !== 'page-comentarios-anonimos') return;

    const tableBody = document.getElementById('comments-table-body');

    const loadComments = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch('http://localhost:3001/api/ideas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            const comments = result.data || [];

            if (comments.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay sugerencias aún.</td></tr>';
                return;
            }

            tableBody.innerHTML = comments.map(c => `
                <tr>
                    <td>${c.nombre}</td>
                    <td>${c.email}</td>
                    <td>${c.mensaje}</td>
                    <td>
                        <button class="danger" style="padding: 5px 10px; font-size: 12px;">Eliminar</button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="4">Error al cargar comentarios.</td></tr>';
        }
    };

    loadComments();
});
/**
 * Lógica para la página: responder-encuesta.html
 * Responsabilidades:
 * - Cargar listado de encuestas disponibles
 * - Mostrar detalles de una encuesta seleccionada
 * - Permitir al usuario responder preguntas
 * - Validar respuestas antes de enviar
 * - Enviar respuestas al servidor
 * - Manejar errores y notificaciones
 */

document.addEventListener('DOMContentLoaded', function () {
    // Verificar que ésta sea la página correcta
    if (document.body.id !== 'page-responder-encuesta') {
        return;
    }

    // ========== ELEMENTOS DEL DOM ==========
    const surveysListContainer = document.getElementById('surveys-list');
    const surveyDetailsContainer = document.getElementById('survey-details');
    const responsesForm = document.getElementById('responses-form');
    const submitResponsesBtn = document.getElementById('submit-responses-btn');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const surveyTitleDisplay = document.getElementById('survey-title-display');
    const surveyDescriptionDisplay = document.getElementById('survey-description-display');
    const questionsDisplay = document.getElementById('questions-display');
    const noSurveysMessage = document.getElementById('no-surveys-message');

    let currentSurveyId = null; // Variable global para guardar el ID de la encuesta actual
    let currentResponses = {}; // Objeto para guardar las respuestas temporales
    let myAssignments = []; // Listado de encuestas asignadas al usuario

    // ========== FUNCIONES DE UTILIDAD ==========

    /**
     * Obtiene el token de autenticación del localStorage
     * @returns {string} Token JWT del usuario
     */
    const getAuthToken = () => localStorage.getItem('userToken') || localStorage.getItem('token');

    /**
     * Verifica que el usuario esté autenticado
     * @returns {boolean} true si existe token, false en caso contrario
     */
    const checkAuthentication = () => {
        const token = getAuthToken();
        if (!token) {
            window.showAppNotification('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    };

    /**
     * Carga y muestra el listado de encuestas disponibles
     */
    const BASE = (typeof BASE_URL !== 'undefined') ? BASE_URL : 'http://localhost:3001';
    const loadSurveysList = async () => {
        if (!checkAuthentication()) return;

        try {
            const token = getAuthToken();
            const response = await fetch(`${BASE}/api/surveys/mis-asignaciones`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                const surveys = result.data || [];
                myAssignments = surveys;
                
                if (surveys.length === 0) {
                    noSurveysMessage.style.display = 'block';
                    surveysListContainer.innerHTML = '';
                    return;
                }

                noSurveysMessage.style.display = 'none';
                surveysListContainer.innerHTML = '';

                surveys.forEach(survey => {
                    const surveyCard = document.createElement('div');
                    surveyCard.className = 'survey-card';

                    const deadline = survey.fecha_limite ? `<p class="deadline-info" style="color:#d9534f; font-size:0.9rem"><i class="fas fa-calendar-alt"></i> Finaliza el: ${new Date(survey.fecha_limite).toLocaleDateString('es-ES')}</p>` : '';

                    surveyCard.innerHTML = `
                        <h3>${survey.titulo}</h3>
                        <p>${survey.descripcion || 'Sin descripción'}</p>
                        ${deadline}
                        <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:15px">
                          <span style="font-size: 0.8rem; color: #999;">ID: ${survey.id_encuesta}</span>
                          <button type="button" class="respond-btn btn-submit" style="padding:8px 15px">Comenzar <i class="fas fa-arrow-right"></i></button>
                        </div>
                    `;

                    const respondBtn = surveyCard.querySelector('.respond-btn');
                    if (respondBtn) {
                      respondBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        loadSurveyDetails(survey.id_encuesta);
                      });
                    }

                    surveyCard.addEventListener('click', () => {
                        loadSurveyDetails(survey.id_encuesta);
                    });

                    surveysListContainer.appendChild(surveyCard);
                });
            } else {
                window.showAppNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error al cargar encuestas:', error);
            window.showAppNotification('No se pudo conectar con el servidor.', 'error');
        }
    };

    /**
     * Carga y muestra los detalles de una encuesta específica
     * @param {number} surveyId - ID de la encuesta a cargar
     */
    const loadSurveyDetails = async (surveyId) => {
        if (!checkAuthentication()) return;

        try {
            currentSurveyId = surveyId;
            // Verificar que la encuesta esté asignada al usuario
            const sid = parseInt(surveyId);
            if (!myAssignments.some(a => parseInt(a.id_encuesta) === sid)) {
                window.showAppNotification('Esta encuesta no está asignada a tu usuario.', 'error');
                return;
            }
            const token = getAuthToken();
            const response = await fetch(`${BASE}/surveys/${surveyId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                const survey = result.data;
                displaySurveyDetails(survey);
            } else {
                window.showAppNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error al cargar detalles de la encuesta:', error);
            window.showAppNotification('No se pudo conectar con el servidor.', 'error');
        }
    };

    /**
     * Muestra los detalles de la encuesta con sus preguntas
     * @param {Object} survey - Objeto de la encuesta con todas sus propiedades
     */
    const displaySurveyDetails = (survey) => {
        // Mostrar detalles
        surveyTitleDisplay.textContent = survey.title;
        surveyDescriptionDisplay.textContent = survey.description || 'Sin descripción';

        // Limpiar respuestas previas
        currentResponses = {};
        questionsDisplay.innerHTML = '';

        // Procesar preguntas
        if (survey.questions && survey.questions.length > 0) {
            survey.questions.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.className = 'question-response-block';

                const mandatoryLabel = question.is_mandatory ? '<span style="color: red;"> *</span>' : '';

                let questionHTML = `
                    <label class="question-label">${index + 1}. ${question.text}${mandatoryLabel}</label>
                `;

                if (question.type === 'texto') {
                    questionHTML += '<span class="help-text">Respuesta libre. Escribe con tus propias palabras.</span>';
                } else if (question.type === 'opcion_multiple') {
                    questionHTML += '<span class="help-text">Selecciona la opción que mejor te represente.</span>';
                } else if (question.type === 'escala_1_5') {
                    questionHTML += '<span class="help-text">Del 1 (Muy en desacuerdo) al 5 (Muy de acuerdo).</span>';
                } else if (question.type === 'si_no') {
                    questionHTML += '<span class="help-text">Selecciona una respuesta binaria.</span>';
                }

                if (question.type === 'texto') {
                    questionHTML += `
                        <textarea 
                            class="response-textarea" 
                            data-question-id="${question.id_pregunta}"
                            placeholder="Escribe tu respuesta aquí..."
                            ${question.is_mandatory ? 'required' : ''}
                        ></textarea>
                    `;
                } else if (question.type === 'opcion_multiple') {
                    questionHTML += '<div style="margin-top: 6px;">';
                    if (question.options && question.options.length > 0) {
                        question.options.forEach(option => {
                            const optionId = `option-${question.id_pregunta}-${option.id_opcion}`;
                            questionHTML += `
                                <label class="radio-option">
                                    <input 
                                        type="radio" 
                                        name="response-${question.id_pregunta}"
                                        class="response-radio"
                                        value="${option.id_opcion}"
                                        id="${optionId}"
                                        ${question.is_mandatory ? 'required' : ''}
                                    >
                                    <span>${option.text}</span>
                                </label>
                            `;
                        });
                    }
                    questionHTML += '</div>';
                } else if (question.type === 'escala_1_5') {
                    questionHTML += '<div class="scale-group">';
                    questionHTML += '<span style="font-size:0.8rem; color:#999">En desacuerdo</span>';
                    for (let val = 1; val <= 5; val++) {
                        const optId = `scale-${question.id_pregunta}-${val}`;
                        questionHTML += `
                            <label class="scale-option">
                                <input
                                    type="radio"
                                    name="response-${question.id_pregunta}"
                                    class="response-radio"
                                    data-question-id="${question.id_pregunta}"
                                    value="${val}"
                                    id="${optId}"
                                    ${question.is_mandatory ? 'required' : ''}
                                >
                                <span class="scale-number">${val}</span>
                            </label>
                        `;
                    }
                    questionHTML += '<span style="font-size:0.8rem; color:#999">De acuerdo</span>';
                    questionHTML += '</div>';
                } else if (question.type === 'si_no') {
                    const optionIdYes = `option-${question.id_pregunta}-yes`;
                    const optionIdNo = `option-${question.id_pregunta}-no`;
                    questionHTML += `
                        <div class="toggle-group">
                            <label class="toggle-option">
                                <input 
                                    type="radio" 
                                    name="response-${question.id_pregunta}"
                                    class="response-radio"
                                    data-question-id="${question.id_pregunta}"
                                    value="Sí"
                                    id="${optionIdYes}"
                                    ${question.is_mandatory ? 'required' : ''}
                                >
                                <div class="toggle-box">Sí</div>
                            </label>
                            <label class="toggle-option">
                                <input 
                                    type="radio" 
                                    name="response-${question.id_pregunta}"
                                    class="response-radio"
                                    data-question-id="${question.id_pregunta}"
                                    value="No"
                                    id="${optionIdNo}"
                                    ${question.is_mandatory ? 'required' : ''}
                                >
                                <div class="toggle-box">No</div>
                            </label>
                        </div>
                    `;
                }

                questionElement.innerHTML = questionHTML;
                questionsDisplay.appendChild(questionElement);
            });
        }

        // Cambiar vista
        surveysListContainer.style.display = 'none';
        surveyDetailsContainer.style.display = 'block';
    };

    /**
     * Valida que todas las preguntas obligatorias hayan sido respondidas
     * @returns {boolean} true si todas las respuestas son válidas
     */
    const validateResponses = () => {
        const requiredInputs = document.querySelectorAll('[required]');
        
        for (let input of requiredInputs) {
            if (input.type === 'radio') {
                const radioGroup = document.querySelector(`input[name="${input.name}"]:checked`);
                if (!radioGroup) {
                    window.showAppNotification(`Por favor responde la pregunta: "${input.name}"`, 'error');
                    return false;
                }
            } else if (input.tagName === 'TEXTAREA') {
                if (!input.value.trim()) {
                    window.showAppNotification('Por favor responde todas las preguntas obligatorias.', 'error');
                    return false;
                }
            }
        }

        return true;
    };

    /**
     * Recolecta todas las respuestas del formulario
     * @returns {Array} Array de respuestas con formato {id_pregunta, respuesta}
     */
    const collectResponses = () => {
        const responses = [];

        // Recolectar respuestas de texto
        document.querySelectorAll('.response-textarea').forEach(textarea => {
            if (textarea.value.trim()) {
                responses.push({
                    id_pregunta: parseInt(textarea.dataset.questionId),
                    respuesta: textarea.value.trim()
                });
            }
        });

        // Recolectar respuestas de opción múltiple y sí/no
        document.querySelectorAll('.response-radio:checked').forEach(radio => {
            responses.push({
                id_pregunta: parseInt(radio.dataset.questionId),
                respuesta: radio.value
            });
        });

        return responses;
    };

    /**
     * Envía las respuestas al servidor
     */
    const submitResponses = async () => {
        if (!validateResponses()) {
            return;
        }

        const responses = collectResponses();
        // Verificar asignación y estado pendiente antes de enviar
        const assigned = myAssignments.find(a => parseInt(a.id_encuesta) === parseInt(currentSurveyId));
        if (!assigned) {
            window.showAppNotification('Esta encuesta no está asignada a tu usuario.', 'error');
            return;
        }
        if (assigned.estado && assigned.estado !== 'pendiente') {
            window.showAppNotification('Esta encuesta no está pendiente o ya fue respondida.', 'error');
            return;
        }

        if (responses.length === 0) {
            window.showAppNotification('Por favor responde al menos una pregunta.', 'error');
            return;
        }

        window.setButtonLoadingState('submit-responses-btn', true, 'Enviar respuestas');

        try {
            const token = getAuthToken();
            if (!token) {
                window.showAppNotification('Tu sesión ha expirado.', 'error');
                window.location.href = 'index.html';
                return;
            }

            const response = await fetch(`${BASE}/surveys/${currentSurveyId}/responses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ responses })
            });

            const result = await response.json();

            if (response.ok) {
                window.showAppNotification('¡Respuestas enviadas correctamente!', 'success');
                setTimeout(() => {
                    // Volver a la lista de encuestas
                    surveysListContainer.style.display = 'block';
                    surveyDetailsContainer.style.display = 'none';
                    responsesForm.reset();
                    loadSurveysList();
                }, 2000);
            } else {
                window.showAppNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error al enviar respuestas:', error);
            window.showAppNotification('No se pudo conectar con el servidor.', 'error');
        } finally {
            window.setButtonLoadingState('submit-responses-btn', false, 'Enviar respuestas');
        }
    };

    // ========== EVENT LISTENERS ==========

    // Botón para volver al listado
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            surveysListContainer.style.display = 'block';
            surveyDetailsContainer.style.display = 'none';
            responsesForm.reset();
        });
    }

    // Botón para enviar respuestas
    if (submitResponsesBtn) {
        submitResponsesBtn.addEventListener('click', submitResponses);
    }

    // Cargar listado inicial de encuestas
    loadSurveysList();
});

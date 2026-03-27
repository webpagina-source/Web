// PROTEGER
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "index.html";
}

// CONTROL DE ROL (solo profesores)
const rol = localStorage.getItem("userRole");
if (rol !== "profesor") {
    if (rol === "estudiante") {
        window.location.href = "inicio-estudiante.html";
    } else {
        window.location.href = "index.html";
    }
}

// DATOS USUARIO
const nombre = localStorage.getItem("userName");
document.getElementById("nombre").textContent = nombre;
document.getElementById("userName").textContent = "👨‍🏫 " + nombre;

// LOGOUT
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// CURSOS
async function crearCurso() {
    let nombreCurso = document.getElementById("cursoNombre").value;

    if (!nombreCurso) return alert("Escribe un curso");

    try {
        await api.createCourse(nombreCurso);
        mostrarCursos();
        document.getElementById("cursoNombre").value = "";
    } catch (error) {
        alert("Error creando curso: " + error.message);
    }
}

async function mostrarCursos() {
    try {
        const courses = await api.getCourses();
        let html = "";

        courses.forEach(c => {
            html += `<div class="card">${c.name}</div>`;
        });

        document.getElementById("listaCursos").innerHTML = html;
    } catch (error) {
        console.error("Error cargando cursos:", error);
        // Fallback a localStorage
        let cursos = JSON.parse(localStorage.getItem("cursos")) || [];
        let html = "";
        cursos.forEach(c => {
            html += `<div class="card">${c}</div>`;
        });
        document.getElementById("listaCursos").innerHTML = html;
    }
}

// TAREAS
async function crearTarea() {
    let tarea = document.getElementById("tareaTexto").value;

    if (!tarea) return alert("Escribe una tarea");

    try {
        await api.createTask(tarea, "", null); // courseId null por ahora
        mostrarTareas();
        document.getElementById("tareaTexto").value = "";
    } catch (error) {
        alert("Error creando tarea: " + error.message);
    }
}

async function mostrarTareas() {
    try {
        const tasks = await api.getTasks();
        let html = "";

        tasks.forEach(t => {
            html += `<div class="card">${t.title}</div>`;
        });

        document.getElementById("listaTareas").innerHTML = html;
    } catch (error) {
        console.error("Error cargando tareas:", error);
        // Fallback
        let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
        let html = "";
        tareas.forEach(t => {
            html += `<div class="card">${t}</div>`;
        });
        document.getElementById("listaTareas").innerHTML = html;
    }
}

// ESTUDIANTES
async function mostrarEstudiantes() {
    try {
        const students = await api.getStudents();
        let html = "";

        students.forEach(u => {
            html += `<div class="card">${u.fullName}</div>`;
        });

        document.getElementById("listaEstudiantes").innerHTML = html;
    } catch (error) {
        console.error("Error cargando estudiantes:", error);
        // Fallback
        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        let html = "";
        usuarios.forEach(u => {
            if (u.role === "estudiante") {
                html += `<div class="card">${u.fullName}</div>`;
            }
        });
        document.getElementById("listaEstudiantes").innerHTML = html;
    }
}

// CUESTIONARIOS
async function crearCuestionario() {
    let nombreCuestionario = document.getElementById("cuestionarioNombre").value;

    if (!nombreCuestionario) return alert("Escribe un nombre para el cuestionario");

    try {
        await api.createQuestionnaire(nombreCuestionario);
        mostrarCuestionarios();
        document.getElementById("cuestionarioNombre").value = "";
    } catch (error) {
        alert("Error creando cuestionario: " + error.message);
    }
}

async function mostrarCuestionarios() {
    try {
        const cuestionarios = await api.getQuestionnaires();
        let html = "";

        cuestionarios.forEach(c => {
            html += `<div class="card">${c.title}</div>`;
        });

        document.getElementById("listaCuestionarios").innerHTML = html;
    } catch (error) {
        console.error("Error cargando cuestionarios:", error);
        let cuestionarios = JSON.parse(localStorage.getItem("cuestionarios")) || [];
        let html = "";
        cuestionarios.forEach(c => {
            html += `<div class="card">${c.title}</div>`;
        });
        document.getElementById("listaCuestionarios").innerHTML = html;
    }
}

// REVISAR ENTREGAS DE TAREAS
function mostrarEntregasTareas() {
    const entregas = JSON.parse(localStorage.getItem("entregas")) || [];
    const tareas = JSON.parse(localStorage.getItem("tareas")) || [];
    let html = "";

    if (entregas.length === 0) {
        html = "<p>No hay entregas de tareas.</p>";
    } else {
        entregas.forEach(entrega => {
            const tarea = tareas.find(t => t.id === entrega.tareaId);
            const nombreTarea = tarea ? tarea.title : "Tarea desconocida";
            html += `
                <div class="card">
                    <h3>${nombreTarea}</h3>
                    <p>Estudiante: ${entrega.estudiante}</p>
                    <p>Fecha: ${entrega.fecha}</p>
                    <input type="number" id="calif-${entrega.tareaId}-${entrega.estudiante}" placeholder="Calificación" min="0" max="100" value="${entrega.calificacion || ''}">
                    <button onclick="calificarTarea('${entrega.tareaId}', '${entrega.estudiante}')">Calificar</button>
                </div>
            `;
        });
    }

    document.getElementById("entregasTareas").innerHTML = html;
}

function calificarTarea(tareaId, estudiante) {
    const calif = document.getElementById(`calif-${tareaId}-${estudiante}`).value;
    if (!calif) return alert("Ingresa una calificación");

    const entregas = JSON.parse(localStorage.getItem("entregas")) || [];
    const entrega = entregas.find(e => e.tareaId === tareaId && e.estudiante === estudiante);
    if (entrega) {
        entrega.calificacion = calif;
        entrega.fechaCalificacion = new Date().toLocaleDateString('es-ES');
        localStorage.setItem("entregas", JSON.stringify(entregas));
        alert("Calificación guardada");
        mostrarEntregasTareas();
    }
}

// REVISAR RESPUESTAS DE CUESTIONARIOS
function mostrarRespuestasCuestionarios() {
    const respuestas = JSON.parse(localStorage.getItem("respuestas")) || [];
    let html = "";

    if (respuestas.length === 0) {
        html = "<p>No hay respuestas de cuestionarios.</p>";
    } else {
        respuestas.forEach(respuesta => {
            html += `
                <div class="card">
                    <h3>${respuesta.cuestionario}</h3>
                    <p>Estudiante: ${respuesta.estudiante}</p>
                    <p>Puntaje: ${respuesta.puntaje}/${respuesta.totalPuntos}</p>
                    <div id="detalles-${respuesta.id}"></div>
                    <button onclick="verRespuestas(${respuesta.id})">Ver Respuestas</button>
                </div>
            `;
        });
    }

    document.getElementById("respuestasCuestionarios").innerHTML = html;
}

function verRespuestas(id) {
    const respuestas = JSON.parse(localStorage.getItem("respuestas")) || [];
    const respuesta = respuestas.find(r => r.id === id);
    if (!respuesta) return;

    const cuestionarios = JSON.parse(localStorage.getItem("cuestionarios")) || [];
    const cuestionario = cuestionarios.find(c => c.id === respuesta.cuestionarioId);
    if (!cuestionario) return;

    let html = "<h4>Respuestas:</h4>";
    cuestionario.preguntas.forEach((q, index) => {
        const respEstudiante = respuesta.answers ? respuesta.answers[index] || "No respondida" : "No respondida";
        const correcta = q.respuesta;
        html += `
            <div class="question">
                <p><strong>Pregunta ${index + 1}:</strong> ${q.texto}</p>
                <p><strong>Respuesta del estudiante:</strong> ${respEstudiante}</p>
                <p><strong>Respuesta correcta:</strong> ${correcta}</p>                <p><strong>Justificación:</strong> ${q.justification || 'Sin justificación'}</p>                <input type="number" id="puntaje-${id}-${index}" placeholder="Puntaje" min="0" max="${q.puntos || 1}" value="${respuesta.puntajes ? respuesta.puntajes[index] || 0 : 0}">
            </div>
        `;
    });
    html += `<button onclick="guardarCalificacionCuestionario(${id})">Guardar Calificaciones</button>`;

    document.getElementById(`detalles-${id}`).innerHTML = html;
}

function guardarCalificacionCuestionario(id) {
    const respuestas = JSON.parse(localStorage.getItem("respuestas")) || [];
    const respuesta = respuestas.find(r => r.id === id);
    if (!respuesta) return;

    const cuestionarios = JSON.parse(localStorage.getItem("cuestionarios")) || [];
    const cuestionario = cuestionarios.find(c => c.id === respuesta.cuestionarioId);
    if (!cuestionario) return;

    respuesta.puntajes = [];
    let total = 0;
    cuestionario.preguntas.forEach((q, index) => {
        const puntaje = parseFloat(document.getElementById(`puntaje-${id}-${index}`).value) || 0;
        respuesta.puntajes.push(puntaje);
        total += puntaje;
    });
    respuesta.totalPuntaje = total;

    localStorage.setItem("respuestas", JSON.stringify(respuestas));
    alert("Calificaciones guardadas");
    mostrarRespuestasCuestionarios();
}

// INICIAR
mostrarCursos();
mostrarTareas();
mostrarEstudiantes();
mostrarCuestionarios();
mostrarEntregasTareas();
mostrarRespuestasCuestionarios();
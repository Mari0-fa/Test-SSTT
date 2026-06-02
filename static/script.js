let preguntas = [];
let indiceActual = 0;
let correctas = 0;
let falladas = 0;
let enBlanco = 0;
let esSimulacro = false;

// Variables específicas para el nuevo Modo Examen Real
let respuestasUsuario = []; 
let modoExamenReal = false; 

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function cargarListaTemas() {
    try {
        const res = await fetch('/get_tests');
        const archivos = await res.json();
        const select = document.getElementById('test-select');
        
        select.innerHTML = '';
        archivos.forEach(archivo => {
            const option = document.createElement('option');
            option.value = archivo;
            option.innerText = archivo.replace('.txt', '').replace(/_/g, ' ');
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando temas:", error);
    }
}

function volverAlMenu() {
    if (confirm("¿Seguro que quieres abandonar el test actual y volver al menú?")) {
        location.reload();
    }
}

async function iniciarTest() {
    const archivoSeleccionado = document.getElementById('test-select').value;
    if (!archivoSeleccionado) return alert("Selecciona un archivo");

    const res = await fetch('/preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivo: archivoSeleccionado })
    });
    
    const data = await res.json();
    if (data.length === 0) return alert("Archivo vacío o formato incorrecto");

    preguntas = shuffle(data);
    esSimulacro = false;
    modoExamenReal = false;
    
    resetearVariables();
    
    document.getElementById('btn-abandonar').style.display = 'block';
    cambiarPantallas();
    mostrarPregunta();
}

// Lanza el flujo abriendo primero el modal de selección de tipo
async function iniciarSimulacro() {
    const cantidad = document.getElementById('num-preguntas').value;
    
    const res = await fetch('/simulacro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: cantidad })
    });
    
    const data = await res.json();
    if (data.length === 0) return alert("No hay preguntas disponibles.");

    preguntas = data;
    
    // Mostramos el modal HTML para decidir el tipo de simulacro
    document.getElementById('mode-modal').style.display = 'flex';
}

// Configura los flags según la opción elegida en el menú modal
function seleccionarModoSimulacro(tipo) {
    document.getElementById('mode-modal').style.display = 'none';
    esSimulacro = true;
    modoExamenReal = (tipo === 'examen');
    
    resetearVariables();
    
    // Inicializar el array de respuestas del usuario vacío para el modo real
    if (modoExamenReal) {
        respuestasUsuario = new Array(preguntas.length).fill(null);
    }
    
    document.getElementById('btn-abandonar').style.display = 'none';
    cambiarPantallas();
    mostrarPregunta();
}

function resetearVariables() {
    indiceActual = 0;
    correctas = 0;
    falladas = 0;
    enBlanco = 0;
}

function cambiarPantallas() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('progress-container').style.display = 'block';
}

function mostrarPregunta() {
    // En modo examen interactivo o normal saltamos al finalizar al agotar el array
    if (indiceActual >= preguntas.length && !modoExamenReal) {
        finalizarTest();
        return;
    }

    const p = preguntas[indiceActual];
    document.getElementById('question-number').innerText = `Pregunta ${indiceActual + 1} de ${preguntas.length}`;
    document.getElementById('question-text').innerText = p.pregunta;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.style.display = 'none';

    const specialContainer = document.getElementById('special-actions-container');
    specialContainer.innerHTML = '';

    document.getElementById('progress-bar').style.width = `${(indiceActual / preguntas.length) * 100}%`;

    // En modo examen mantenemos el orden original de opciones para poder navegar sin que cambien de sitio
    const opcionesArray = Object.entries(p.opciones);
    if (!modoExamenReal) {
        shuffle(opcionesArray);
    }
    
    opcionesArray.forEach(([letraOriginal, texto]) => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        
        // Si estamos en modo examen real y ya se había marcado esta opción, se ilumina el borde
        if (modoExamenReal && respuestasUsuario[indiceActual] === letraOriginal) {
            btn.classList.add('selected');
        }
        
        btn.innerHTML = `<strong>${letraOriginal})</strong> ${texto}`;
        
        btn.onclick = () => {
            if (modoExamenReal) {
                // Si vuelve a pulsar la opción que ya estaba marcada, la desmarca (vuelve a quedar en blanco)
                respuestasUsuario[indiceActual] = (respuestasUsuario[indiceActual] === letraOriginal) ? null : letraOriginal;
                mostrarPregunta(); // Renderiza de nuevo para actualizar clases visuales
            } else {
                verificar(btn, letraOriginal, p.respuesta);
            }
        };
        container.appendChild(btn);
    });

    // Inyección dinámica de botones según el modo
    if (modoExamenReal) {
        const navDiv = document.createElement('div');
        navDiv.className = 'nav-container';
        
        const btnPrev = document.createElement('button');
        btnPrev.className = 'btn-nav';
        btnPrev.innerText = "← Anterior";
        btnPrev.disabled = (indiceActual === 0);
        btnPrev.onclick = () => { indiceActual--; mostrarPregunta(); };

        const btnNext = document.createElement('button');
        btnNext.className = 'btn-nav';
        
        // Si es la última pregunta, el botón de avanzar se convierte en el gatillo de entrega final
        if (indiceActual === preguntas.length - 1) {
            btnNext.innerText = "🏁 ENTREGAR EXAMEN";
            btnNext.classList.add('btn-entrega');
            btnNext.onclick = finalizarExamenReal;
        } else {
            btnNext.innerText = "Siguiente →";
            btnNext.onclick = () => { indiceActual++; mostrarPregunta(); };
        }

        navDiv.appendChild(btnPrev);
        navDiv.appendChild(btnNext);
        specialContainer.appendChild(navDiv);
        
    } else if (esSimulacro) {
        // Botón clásico de dejar en blanco para el modo simulacro interactivo
        const btnBlank = document.createElement('button');
        btnBlank.className = 'btn-blank';
        btnBlank.innerText = "🏳️ Dejar pregunta en blanco";
        btnBlank.onclick = () => responderEnBlanco(p.respuesta);
        specialContainer.appendChild(btnBlank);
    }
}

function verificar(btn, seleccionada, correcta) {
    const p = preguntas[indiceActual];
    const botones = document.querySelectorAll('.btn-option');
    const feedbackDiv = document.getElementById('feedback');
    const btnBlank = document.querySelector('.btn-blank');
    
    botones.forEach(b => b.disabled = true);
    if(btnBlank) btnBlank.disabled = true;
    
    feedbackDiv.style.display = 'block';
    let htmlFeedback = `<h4>Análisis de la respuesta:</h4>`;
    
    if (seleccionada === correcta) {
        btn.classList.add('correct');
        feedbackDiv.className = 'feedback-area feedback-success';
        correctas++;
        htmlFeedback += `<p><strong>¡Correcto!</strong> ${p.explicacion}</p>`;
    } else {
        btn.classList.add('wrong');
        feedbackDiv.className = 'feedback-area feedback-error';
        falladas++;
        
        botones.forEach(b => {
            if (b.querySelector('strong').innerText.includes(correcta)) {
                b.classList.add('correct');
            }
        });

        htmlFeedback += `<p><strong>Incorrecto.</strong> ${p.explicacion}</p>`;
        if(p.errores) {
            htmlFeedback += `<span class="error-list"><strong>Por qué no las otras:</strong> ${p.errores}</span>`;
        }
    }

    htmlFeedback += `<button onclick="siguiente()" class="btn-next">Siguiente Pregunta →</button>`;
    feedbackDiv.innerHTML = htmlFeedback;
}

function responderEnBlanco(correcta) {
    const p = preguntas[indiceActual];
    const botones = document.querySelectorAll('.btn-option');
    const feedbackDiv = document.getElementById('feedback');
    const btnBlank = document.querySelector('.btn-blank');

    botones.forEach(b => b.disabled = true);
    if(btnBlank) btnBlank.disabled = true;

    feedbackDiv.style.display = 'block';
    feedbackDiv.className = 'feedback-area';
    feedbackDiv.style.backgroundColor = '#334155';
    feedbackDiv.style.border = '1px solid #64748b';
    
    enBlanco++;

    botones.forEach(b => {
        if (b.querySelector('strong').innerText.includes(correcta)) {
            b.classList.add('correct');
        }
    });

    let htmlFeedback = `<h4>Pregunta dejada en blanco</h4>`;
    htmlFeedback += `<p>${p.explicacion}</p>`;
    htmlFeedback += `<button onclick="siguiente()" class="btn-next">Siguiente Pregunta →</button>`;
    feedbackDiv.innerHTML = htmlFeedback;
}

function siguiente() {
    indiceActual++;
    mostrarPregunta();
}

// Lógica de cálculo diferida para el modo examen real
function finalizarExamenReal() {
    if (!confirm("¿Seguro que quieres entregar el examen? Al aceptar se calculará tu nota final.")) return;
    
    // Recorremos las respuestas almacenadas y las evaluamos frente a la solución del .txt
    preguntas.forEach((p, i) => {
        const solucionUsuario = respuestasUsuario[i];
        if (solucionUsuario === null) {
            enBlanco++;
        } else if (solucionUsuario === p.respuesta) {
            correctas++;
        } else {
            falladas++;
        }
    });
    
    finalizarTest();
}

function finalizarTest() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('progress-bar').style.width = '100%';
    document.getElementById('btn-abandonar').style.display = 'none';

    let nota = 0;
    if (esSimulacro) {
        // En cualquier tipo de simulacro (interactivo o real), 2 mal quitan 1 bien (-0.50 por fallo)
        nota = (((correctas - (falladas * 0.5)) / preguntas.length) * 10);
    } else {
        // En Modo Estudio los fallos no restan
        nota = ((correctas / preguntas.length) * 10);
    }
    
    nota = Math.max(nota, 0).toFixed(2);
    document.getElementById('final-score').innerText = nota;
    
    if (esSimulacro) {
        document.getElementById('final-stats').innerText = `Aciertos: ${correctas} | Fallos: ${falladas} | En Blanco: ${enBlanco}`;
    } else {
        document.getElementById('final-stats').innerText = `Aciertos: ${correctas} | Fallos: ${falladas}`;
    }
}

window.onload = cargarListaTemas;
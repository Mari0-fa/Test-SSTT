# Turbo Test Pro 🚀

Plataforma web adaptativa para el entrenamiento y simulación de exámenes tipo test de **Servicios Telemáticos**. Desarrollada con Flask (Python) en el backend y JavaScript nativo en el frontend.

## 🛠️ Características y Modos de Juego

- **Modo Estudiar Tema:** Preguntas barajadas con feedback inmediato, desgloses explicativos analíticos ("Por qué no las otras") y sin penalización por fallos.
- **Simulacro Interactivo:** Bloque de preguntas aleatorias multi-tema con corrección instantánea y penalización de examen real.
- **Simulacro Examen Real:** Simulación fidedigna con estado y navegación libre. Permite avanzar, retroceder, marcar/desmarcar respuestas y entrega diferida con cálculo final automático.

## 📊 Sistema de Calificación (Algoritmo de Ingeniería)
- **Acierto:** +1.00 punto.
- **Fallo:** -0.50 puntos (Dos respuestas incorrectas anulan una correcta).
- **En Blanco:** 0.00 puntos (Actúa como escudo defensivo, no resta).

## 🚀 Despliegue rápido
Para ejecutar en local con entorno virtual:
```bash
python -m venv venv
.\venv\Scripts\activate
pip install flask
python app.py
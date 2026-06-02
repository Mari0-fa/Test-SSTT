from flask import Flask, render_template, jsonify, request
from parser import leer_txt
import os
import random
import re  # Importación necesaria para extraer los números de los temas

app = Flask(__name__)

# Obtener la ruta absoluta de la carpeta del proyecto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def extraer_numero_tema(nombre_archivo):
    # Busca cualquier secuencia de dígitos en el nombre (ej: "tema5.txt" -> 5)
    match = re.search(r'\d+', nombre_archivo)
    return int(match.group()) if match else 0

@app.route("/")
def inicio():
    return render_template("index.html")

@app.route("/preguntas", methods=["POST"])
def preguntas():
    datos_recibidos = request.get_json()
    nombre_archivo = datos_recibidos.get("archivo")
    
    ruta_final = os.path.join(BASE_DIR, "tests", nombre_archivo)
    
    if not os.path.exists(ruta_final):
        return jsonify({"error": "No encuentro el archivo"}), 404

    try:
        data = leer_txt(ruta_final)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_tests", methods=["GET"])
def get_tests():
    ruta_tests = os.path.join(BASE_DIR, "tests")
    archivos = [f for f in os.listdir(ruta_tests) if f.endswith('.txt')]
    
    # Ordenación natural para evitar que el 'tema10' vaya antes que el 'tema2'
    archivos.sort(key=extraer_numero_tema)
    
    return jsonify(archivos)

@app.route("/simulacro", methods=["POST"])
def simulacro():
    cantidad = request.json.get("cantidad", 20)
    ruta_tests = os.path.join(BASE_DIR, "tests")
    archivos = [f for f in os.listdir(ruta_tests) if f.endswith('.txt')]
    
    # Ordenamos también aquí por consistencia interna
    archivos.sort(key=extraer_numero_tema)
    
    todas_las_preguntas = []
    for nombre_archivo in archivos:
        ruta = os.path.join(ruta_tests, nombre_archivo)
        todas_las_preguntas.extend(leer_txt(ruta))
    
    total_disponibles = len(todas_las_preguntas)
    if total_disponibles == 0:
        return jsonify([])
        
    cantidad_final = min(int(cantidad), total_disponibles)
    seleccion = random.sample(todas_las_preguntas, cantidad_final)
    
    return jsonify(seleccion)

if __name__ == "__main__":
    app.run(debug=True)
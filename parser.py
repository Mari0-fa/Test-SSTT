import os
import re

def leer_txt(ruta):
    if not os.path.exists(ruta):
        return []

    preguntas = []
    actual = None

    # Abrimos con encoding UTF-8 para que no se rompan las tildes ni las 'ñ' en Windows/Linux
    with open(ruta, 'r', encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if not linea:
                continue

            # 1. Detectar el inicio de una nueva pregunta
            if linea.upper().startswith("PREGUNTA:"):
                if actual:
                    preguntas.append(actual)
                
                actual = {
                    "pregunta": linea[9:].strip(), # Corta "PREGUNTA:" y limpia espacios
                    "opciones": {},
                    "respuesta": "",
                    "explicacion": "",
                    "errores": ""
                }

            # 2. Detectar las opciones de respuesta (A, B, C...)
            elif re.match(r"^[A-D]\)", linea):
                if actual:
                    letra = linea[0]
                    texto = linea[2:].strip() # Corta el "A)" o "B)"
                    actual["opciones"][letra] = texto

            # 3. Detectar la respuesta correcta
            elif linea.upper().startswith("RESPUESTA:"):
                if actual:
                    actual["respuesta"] = linea.split(":", 1)[1].strip().upper()

            # 4. Detectar la explicación técnica
            elif linea.upper().startswith("EXPLICACION:"):
                if actual:
                    actual["explicacion"] = linea.split(":", 1)[1].strip()

            # 5. Detectar el desglose de errores
            elif linea.upper().startswith("ERRORES:"):
                if actual:
                    actual["errores"] = linea.split(":", 1)[1].strip()

    # Guardar la última pregunta procesada al salir del bucle
    if actual:
        preguntas.append(actual)

    return preguntas
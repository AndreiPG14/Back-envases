#!/usr/bin/env python3
"""
Script para sincronizar trabajadores desde Excel a Supabase
Se ejecuta automáticamente cada lunes a las 6am UTC via GitHub Actions
"""

import os
import sys
import requests
from datetime import datetime
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

API_URL = os.getenv('API_URL')
EXCEL_PATH = os.getenv('EXCEL_PATH', 'trabajadores.xlsx')  # Ruta del Excel en el repo

if not API_URL:
    print("❌ Error: API_URL no configurada")
    sys.exit(1)

def get_trabajadores_from_excel():
    """
    Obtener datos de trabajadores desde un archivo Excel
    """
    print(f"📂 Buscando Excel en: {EXCEL_PATH}")

    try:
        if not os.path.exists(EXCEL_PATH):
            print(f"❌ Archivo no encontrado: {EXCEL_PATH}")
            return []

        print(f"📖 Leyendo Excel...")
        df = pd.read_excel(EXCEL_PATH)

        # Convertir DataFrame a lista de diccionarios
        rows = df.to_dict('records')
        print(f"✅ Obtenidos {len(rows)} registros del Excel")

        return rows
    except Exception as e:
        print(f"❌ Error leyendo Excel: {e}")
        return []

def sync_to_api(rows):
    """
    Enviar datos de trabajadores a la API
    """
    if not rows:
        print("⚠️  No hay datos para sincronizar")
        return True

    print(f"📤 Enviando {len(rows)} registros a la API...")
    print(f"🎯 URL: {API_URL}/api/trabajadores-qbiz/sync")

    try:
        response = requests.post(
            f"{API_URL}/api/trabajadores-qbiz/sync",
            json={"rows": rows},
            timeout=60
        )
        response.raise_for_status()

        result = response.json()
        if result.get('success'):
            print(f"✅ Sincronización exitosa:")
            print(f"   - Insertados: {result['data']['insertados']}")
            print(f"   - Omitidos: {result['data']['omitidos']}")
            return True
        else:
            print(f"❌ Error en sincronización: {result.get('error')}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error enviando datos a API: {e}")
        return False

def main():
    """
    Flujo principal de sincronización
    """
    print("\n" + "="*60)
    print("🔄 Iniciando sincronización de trabajadores")
    print(f"⏰ {datetime.now().isoformat()}")
    print("="*60 + "\n")

    # Paso 1: Obtener datos del Excel
    print("[1/2] Leyendo Excel...")
    rows = get_trabajadores_from_excel()
    print(f"✅ Total: {len(rows)} registros\n")

    # Paso 2: Sincronizar a API
    print("[2/2] Sincronizando a API...")
    success = sync_to_api(rows)

    # Resultado final
    print("\n" + "="*60)
    if success:
        print("✅ Sincronización completada exitosamente")
    else:
        print("❌ Sincronización falló")
    print("="*60 + "\n")

    return 0 if success else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

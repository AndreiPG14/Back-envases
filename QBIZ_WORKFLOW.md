# 🔄 Workflow de Sincronización QBIZ

Este proyecto utiliza **GitHub Actions** para sincronizar automáticamente los trabajadores desde QBIZ cada lunes a las 6am UTC.

## Configuración

### 1. Variables de Entorno (GitHub Secrets)

Ve a tu repositorio en GitHub → **Settings → Secrets and variables → Actions**

Agrega estos secrets:

```
API_URL          = https://tu-dominio.vercel.app  (tu API en Vercel/Railway)
QBIZ_URL         = https://api.qbiz.com           (URL de API de QBIZ)
QBIZ_USER        = tu_usuario_qbiz
QBIZ_PASS        = tu_contraseña_qbiz
```

### 2. Script Python

El script `scripts/sync_trabajadores_qbiz.py` hace:

1. **Conecta a QBIZ** y obtiene los datos de trabajadores
2. **Envía a la API** `/api/trabajadores-qbiz/sync`
3. **Actualiza la BD** con los nuevos registros (upsert por DNI)

### 3. Ejecución

**Automática:**
- Cada **lunes a las 6am UTC** (editable en `.github/workflows/sync-trabajadores-qbiz.yml`)

**Manual:**
- Ve a **Actions → Sync Trabajadores QBIZ → Run workflow**

## Flujo de Datos

```
QBIZ API
    ↓
Python Script (obtiene datos)
    ↓
POST /api/trabajadores-qbiz/sync
    ↓
Supabase (upsert por DNI)
    ↓
Base de datos actualizada
```

## Formato de Datos Esperado

El script debe enviar un JSON con esta estructura:

```json
{
  "rows": [
    {
      "DNI": "12345678",
      "NOMBRES": "Juan",
      "APELLIDO PATERNO": "Pérez",
      "APELLIDO MATERNO": "García",
      "EMPRESA": "AQU_ANQA",
      "ÁREA": "Almacén",
      "CARGO": "Supervisor",
      "TIPO TRABAJADOR": "EMPLEADO",
      "RÉGIMEN": "Permanente",
      "CENTROCOSTO": "CC-001",
      "VIGENCIA": "2024",
      "FECHA DE INGRESO": "01/01/2024",
      "FECHA DE CESE": null,
      "COD FUNCIONARIO": "F001",
      "PLANILLA NISIRA": "P001"
    }
  ]
}
```

## Mapeos de Empresas

En `scripts/sync_trabajadores_qbiz.py`:

```python
empresaIdMap = {
    'AQU_ANQA': 1,
    'AQU_ANQA2': 2,
}
```

Actualiza los IDs según tu configuración en Supabase.

## Mapeos de Tipos de Trabajador

```python
tipoTrabajadorIdMap = {
    'OBRERO AGRARIO LEY 31110': 1,
    'EMPLEADO': 2,
}
```

## Cómo Conectar a QBIZ

En el script `sync_trabajadores_qbiz.py`, función `get_trabajadores_from_qbiz()`:

**Opción A: API REST de QBIZ**
```python
response = requests.get(
    f"{QBIZ_URL}/api/trabajadores",
    auth=(QBIZ_USER, QBIZ_PASS)
)
return response.json()
```

**Opción B: Archivo CSV/Excel**
```python
import pandas as pd
df = pd.read_excel("trabajadores.xlsx")
return df.to_dict('records')
```

**Opción C: Base de datos SQL**
```python
import pyodbc
conn = pyodbc.connect(...)
query = "SELECT DNI, NOMBRES, ... FROM trabajadores"
```

## Logs y Debugging

Los logs del workflow se ven en:
- **GitHub → Actions → Sync Trabajadores QBIZ → [run] → sync**

Busca el botón **"Run workflow"** para ejecutar manualmente y ver los logs en tiempo real.

## Troubleshooting

### ❌ "API_URL no configurada"
→ Revisa que el secret `API_URL` esté en GitHub Settings

### ❌ "Error conectando a QBIZ"
→ Verifica credenciales QBIZ_URL, QBIZ_USER, QBIZ_PASS

### ❌ "Error enviando datos a API"
→ Revisa que tu API esté disponible en el URL configurado

### ❌ "Omitidos muchos registros"
→ Verifica que los campos del CSV coincidan con los esperados (DNI, NOMBRES, etc)

## Próximos Pasos

1. [ ] Configurar secrets en GitHub
2. [ ] Conectar a la API real de QBIZ
3. [ ] Actualizar mapeos de empresas
4. [ ] Ejecutar manualmente desde Actions para probar
5. [ ] Verificar que los datos se sincronicen correctamente en Supabase

---

**Última actualización:** 2024

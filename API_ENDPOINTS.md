# 📚 Documentación de Endpoints - Almacén App

## Configuración Inicial

### 1. Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

Obtener en: `https://app.supabase.com/project/[tu-proyecto]/settings/api`

### 2. Instalar dependencias
```bash
npm install @supabase/supabase-js
```

---

## 📋 Endpoints Disponibles

### Base URL
```
http://localhost:3000/api
```

---

## 1. ROLES

### GET /api/roles
Obtener todos los roles
```bash
curl http://localhost:3000/api/roles
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "descripcion": "Admin",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

### POST /api/roles
Crear nuevo rol
```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Gerente"}'
```

### GET /api/roles/[id]
Obtener rol por ID
```bash
curl http://localhost:3000/api/roles/1
```

### PUT /api/roles/[id]
Actualizar rol
```bash
curl -X PUT http://localhost:3000/api/roles/1 \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Gerente General"}'
```

### DELETE /api/roles/[id]
Eliminar rol
```bash
curl -X DELETE http://localhost:3000/api/roles/1
```

---

## 2. TRABAJADORES

### GET /api/trabajadores
Obtener todos los trabajadores
```bash
curl http://localhost:3000/api/trabajadores
```

### POST /api/trabajadores
Crear nuevo trabajador
```bash
curl -X POST http://localhost:3000/api/trabajadores \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "12345678",
    "nombres": "Juan",
    "apellido_paterno": "Pérez",
    "apellido_materno": "García"
  }'
```

### GET /api/trabajadores/[id]
Obtener trabajador por ID

### PUT /api/trabajadores/[id]
Actualizar trabajador

### DELETE /api/trabajadores/[id]
Eliminar trabajador

---

## 3. EMPRESA

### GET /api/empresa
Obtener todas las empresas

### POST /api/empresa
Crear empresa
```bash
curl -X POST http://localhost:3000/api/empresa \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Empresa XYZ"}'
```

### GET /api/empresa/[id]
### PUT /api/empresa/[id]
### DELETE /api/empresa/[id]

---

## 4. OPERACION

### GET /api/operacion
Obtener todas las operaciones

### POST /api/operacion
Crear operación
```bash
curl -X POST http://localhost:3000/api/operacion \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "INGRESO"}'
```

**Tipos de operación sugeridos:**
- INGRESO (suma stock)
- SALIDA (resta stock)
- AJUSTE
- DEVOLUCIÓN

---

## 5. MATERIALES

### GET /api/materiales
Obtener todos los materiales

### POST /api/materiales
Crear material
```bash
curl -X POST http://localhost:3000/api/materiales \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Tubo de acero 1m",
    "stock": 50
  }'
```

### GET /api/materiales/[id]
### PUT /api/materiales/[id]
### DELETE /api/materiales/[id]

---

## 6. VEHICULO

### GET /api/vehiculo
Obtener todos los vehículos

### POST /api/vehiculo
Crear vehículo
```bash
curl -X POST http://localhost:3000/api/vehiculo \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "ABC-123",
    "marca": "Toyota"
  }'
```

### GET /api/vehiculo/[id]
### PUT /api/vehiculo/[id]
### DELETE /api/vehiculo/[id]

---

## 7. FUNDO

### GET /api/fundo
Obtener todos los fundos con empresa
```bash
curl http://localhost:3000/api/fundo
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "descripcion": "Fundo La Molina",
      "idempresa": 1,
      "empresa": {
        "id": 1,
        "descripcion": "Empresa XYZ"
      }
    }
  ]
}
```

### POST /api/fundo
Crear fundo
```bash
curl -X POST http://localhost:3000/api/fundo \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Fundo Nueva",
    "idempresa": 1
  }'
```

### GET /api/fundo/[id]
### PUT /api/fundo/[id]
### DELETE /api/fundo/[id]

---

## 8. USUARIO

### GET /api/usuario
Obtener todos los usuarios con sus relaciones
```bash
curl http://localhost:3000/api/usuario
```

**Response incluye:**
- Trabajador asociado (dni, nombres, etc)
- Rol asignado

### POST /api/usuario
Crear usuario
```bash
curl -X POST http://localhost:3000/api/usuario \
  -H "Content-Type: application/json" \
  -d '{
    "grupo": "Almacén",
    "trabajadorid": 1,
    "rolid": 2
  }'
```

### GET /api/usuario/[id]
### PUT /api/usuario/[id]
### DELETE /api/usuario/[id]

---

## 9. MOVIMIENTO ⭐ (MÁS IMPORTANTE)

### GET /api/movimiento
Obtener todos los movimientos con trazabilidad completa
```bash
curl http://localhost:3000/api/movimiento
```

**Response incluye:**
- Usuario origen y destino con datos del trabajador
- Material con stock actual
- Vehículo usado
- Fundo origen y destino
- Operación realizada

### POST /api/movimiento
**Crear movimiento (ACTUALIZA AUTOMÁTICAMENTE EL STOCK)**

```bash
curl -X POST http://localhost:3000/api/movimiento \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2024-01-15",
    "idusuarioorigen": 1,
    "idusuariodestino": 2,
    "idmaterial": 5,
    "idvehiculo": 1,
    "idfundoorigen": 1,
    "idfundodestino": 2,
    "idoperacion": 1,
    "cantidad": 10,
    "precinto": "PREC-001",
    "observaciones": "Envío urgente"
  }'
```

**Campos requeridos:**
- `fecha`: Fecha del movimiento (YYYY-MM-DD)
- `idusuarioorigen`: ID del usuario que envía
- `idmaterial`: ID del material
- `idfundoorigen`: Fundo de origen
- `idfundodestino`: Fundo de destino
- `idoperacion`: Tipo de operación (INGRESO/SALIDA)

**Campos opcionales:**
- `idusuariodestino`: Usuario que recibe
- `idvehiculo`: Vehículo usado
- `precinto`: Número de precinto
- `observaciones`: Notas adicionales

**Lógica de stock:**
- Si `operacion = "INGRESO"` → `stock += cantidad`
- Si `operacion = "SALIDA"` → `stock -= cantidad`

### GET /api/movimiento/[id]
Obtener movimiento por ID con trazabilidad

### PUT /api/movimiento/[id]
Actualizar movimiento (solo observaciones y precinto)
```bash
curl -X PUT http://localhost:3000/api/movimiento/1 \
  -H "Content-Type: application/json" \
  -d '{
    "observaciones": "Entregado correctamente",
    "precinto": "PREC-001-SELLADO"
  }'
```

### DELETE /api/movimiento/[id]
**PROHIBIDO** - No se pueden eliminar movimientos por auditoría
```json
{
  "success": false,
  "error": "No se pueden eliminar movimientos (auditoría requerida)"
}
```

---

## 🔍 Ejemplos de Consultas por Trazabilidad

### Obtener todos los movimientos de un material específico
```bash
# Necesitarás filtrar en el frontend después de obtener los datos
GET /api/movimiento
# Luego filtrar por: data.filter(m => m.idmaterial === 5)
```

### Obtener movimientos por fecha
```bash
# Similarmente, filtrar en frontend
GET /api/movimiento
# data.filter(m => m.fecha >= "2024-01-01" && m.fecha <= "2024-01-31")
```

### Obtener historial de un fundo
```bash
GET /api/fundo/[id]
# Luego consultar GET /api/movimiento y filtrar por idfundoorigen o idfundodestino
```

---

## 📊 Estructura de Respuestas

### Success
```json
{
  "success": true,
  "data": {...},
  "message": "Descripción del éxito"
}
```

### Error
```json
{
  "success": false,
  "error": "Mensaje de error detallado"
}
```

---

## 🔐 Seguridad (TODO)

- [ ] Implementar autenticación JWT
- [ ] Agregar validación de permisos por rol
- [ ] Implementar rate limiting
- [ ] Agregar CORS configuration
- [ ] Validar entrada en todos los endpoints

---

## 📝 Notas

1. **Stock**: Se actualiza automáticamente cuando creas movimientos
2. **Auditoría**: No se pueden eliminar movimientos, solo crear nuevos
3. **Trazabilidad**: Todos los movimientos quedan registrados con fecha y usuario
4. **Relaciones**: Los datos vienen con sus relaciones anidadas (empresa → fundo, etc)


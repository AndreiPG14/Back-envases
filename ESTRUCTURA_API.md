# 🏗️ Estructura de la API - Almacén App

## ✅ Archivos Creados

```
almacen-app/
├── lib/
│   ├── supabase.ts              # Cliente Supabase configurado
│   └── types.ts                 # Tipos TypeScript de todas las tablas
│
├── app/api/
│   ├── roles/
│   │   ├── route.ts             ✅ GET todos, POST crear
│   │   └── [id]/route.ts        ✅ GET por id, PUT, DELETE
│   │
│   ├── trabajadores/
│   │   ├── route.ts             ✅ GET todos, POST crear
│   │   └── [id]/route.ts        ✅ GET por id, PUT, DELETE
│   │
│   ├── empresa/
│   │   ├── route.ts             ✅ GET todos, POST crear
│   │   └── [id]/route.ts        ✅ GET por id, PUT, DELETE
│   │
│   ├── operacion/
│   │   ├── route.ts             ✅ GET todos, POST crear
│   │   └── (TODO: copiar template para [id])
│   │
│   ├── materiales/
│   │   ├── route.ts             (TODO: copiar template)
│   │   └── [id]/route.ts        (TODO: copiar template)
│   │
│   ├── vehiculo/
│   │   ├── route.ts             (TODO: copiar template)
│   │   └── [id]/route.ts        (TODO: copiar template)
│   │
│   ├── fundo/
│   │   ├── route.ts             ✅ GET todos, POST crear + relaciones
│   │   └── [id]/route.ts        ✅ GET por id, PUT, DELETE + relaciones
│   │
│   ├── usuario/
│   │   ├── route.ts             ✅ GET todos, POST crear + relaciones
│   │   └── [id]/route.ts        ✅ GET por id, PUT, DELETE + relaciones
│   │
│   └── movimiento/
│       ├── route.ts             ✅ GET todos, POST crear + ACTUALIZA STOCK
│       └── [id]/route.ts        ✅ GET por id, PUT (solo observaciones), DELETE PROHIBIDO
│
├── .env.local                   ✅ Variables de entorno (llenar con tus datos)
├── API_ENDPOINTS.md             ✅ Documentación completa de todos los endpoints
├── API_TEMPLATE.md              ✅ Template para crear endpoints faltantes
└── ESTRUCTURA_API.md            ✅ Este archivo
```

---

## 🚀 Próximos Pasos

### 1. Completar Endpoints Faltantes

Copiar el template en `API_TEMPLATE.md` para crear:

#### Operacion [id]/route.ts
```bash
# Usar template de [id]/route.ts y reemplazar:
# - "nombre_tabla" → "operacion"
# - NombreTabla → Operacion
```

#### Materiales route.ts y [id]/route.ts
```bash
# Usar template
# - "nombre_tabla" → "materiales"
# - NombreTabla → Materiales
```

#### Vehiculo route.ts y [id]/route.ts
```bash
# Usar template
# - "nombre_tabla" → "vehiculo"
# - NombreTabla → Vehiculo
```

---

### 2. Configurar Variables de Entorno

Editar `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Obtener en: https://app.supabase.com/project/[TU-PROYECTO]/settings/api

---

### 3. Probar los Endpoints

#### Opción A: Usar curl
```bash
curl http://localhost:3000/api/roles
```

#### Opción B: Usar Postman
1. Importar la collection en `API_ENDPOINTS.md`
2. Setear variable `base_url = http://localhost:3000`

#### Opción C: Usar cliente Fetch en el frontend
```javascript
// Ejemplo:
const response = await fetch('/api/roles');
const data = await response.json();
console.log(data);
```

---

### 4. Próximos Pasos Recomendados

- [ ] Crear endpoints faltantes (operacion, materiales, vehiculo)
- [ ] Probar todos los endpoints con Postman/curl
- [ ] Implementar autenticación y autorización
- [ ] Crear filtros y búsqueda avanzada
- [ ] Agregar paginación a los GET
- [ ] Crear un frontend con React para consumir la API
- [ ] Agregar validaciones más estrictas
- [ ] Implementar auditoría (quién cambió qué y cuándo)

---

## 📝 Notas Importantes

### Stock Automático
Cuando creas un movimiento, el stock se actualiza automáticamente según la operación:
```javascript
// En POST /api/movimiento
if (operacion = "INGRESO") stock += cantidad
if (operacion = "SALIDA") stock -= cantidad
```

### Sin Eliminación de Movimientos
Los movimientos NO se pueden eliminar (auditoría). Si hay error, crear un movimiento inverso.

### Trazabilidad Completa
Todos los endpoints GET retornan datos anidados:
- Usuario con sus datos del trabajador
- Fundo con datos de la empresa
- Material con stock actual
- Operación realizada

### RLS en Supabase
Ya está habilitada (Row Level Security). Necesitarás configurar políticas para que cada usuario vea solo lo que le corresponde.

---

## 🛠️ Stack Utilizado

- **Framework**: Next.js 16.2.10
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (Supabase)
- **Cliente BD**: @supabase/supabase-js
- **Estilos**: Tailwind CSS (ya incluido en el proyecto)

---

## 📞 Debugging

### Error: "relation X does not exist"
Verificar que las tablas en Supabase existan y el nombre sea exacto (minúsculas).

### Error: 403 Forbidden
Verificar RLS policies en Supabase. Agregar políticas en:
https://app.supabase.com/project/[TU-PROYECTO]/auth/policies

### Error: 500 Internal Server
Ver los logs de Next.js en la terminal donde corres `npm run dev`

---

## 🔗 URLs Útiles

- Dashboard Supabase: https://app.supabase.com
- Documentación Supabase: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- TypeScript Docs: https://www.typescriptlang.org/docs/

---

**¿Necesitas ayuda con algún endpoint específico?** Avísame 🚀

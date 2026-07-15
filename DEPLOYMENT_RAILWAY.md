# 🚀 Deployment en Railway

## Paso 1: Crear cuenta en Railway

1. Ve a https://railway.app
2. Inicia sesión con GitHub
3. Autoriza la conexión

## Paso 2: Crear nuevo proyecto

1. Dashboard → **New Project**
2. Selecciona **Deploy from GitHub repo**
3. Elige tu repo `backend-envases`
4. Selecciona la rama `main`

## Paso 3: Configurar variables de entorno

En Railway Dashboard → Tu proyecto → **Variables**

Agrega estas variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NODE_ENV=production
```

## Paso 4: Configurar GitHub Secret

Para que el workflow pueda acceder a tu API en Railway:

1. Ve a tu repo GitHub → **Settings → Secrets and variables → Actions**
2. Agrega: 
   ```
   API_URL = https://tu-app.up.railway.app
   ```

   (Obtendrás esta URL de Railway después del primer deploy)

## Paso 5: Sube el archivo Excel

1. Crea/sube `trabajadores.xlsx` a la raíz del repo
2. O colócalo en una carpeta `data/` del repo
3. El workflow lo leerá automáticamente

## Paso 6: Test del workflow

1. Ve a GitHub → Actions → **"Sync Trabajadores → Supabase"**
2. Click en **"Run workflow"**
3. Observa los logs

## 📋 Checklist

- [ ] Railway account creada
- [ ] Proyecto deployado en Railway
- [ ] Variables de entorno configuradas
- [ ] Secret `API_URL` en GitHub
- [ ] `trabajadores.xlsx` en el repo
- [ ] Workflow ejecutado exitosamente
- [ ] Datos sincronizados en Supabase

## Estructura esperada del Excel

Columnas requeridas:
```
| DNI | NOMBRES | APELLIDO PATERNO | APELLIDO MATERNO | EMPRESA | ÁREA | CARGO | ... |
|-----|---------|------------------|------------------|---------|------|-------|-----|
```

## URLs importantes

- Railway Dashboard: https://railway.app/dashboard
- GitHub Actions: https://github.com/tu-usuario/backend-envases/actions
- Supabase: https://app.supabase.com
- API en Railway: https://tu-app.up.railway.app

## Troubleshooting

### Error: "API_URL no configurada"
- Verifica que agregaste el secret en GitHub

### Error: "400 Bad Request"
- Revisa que el Excel tenga las columnas correctas
- Los nombres de las columnas deben coincidir exactamente

### Error: "Timeout"
- El servidor tarda más de 60s
- Aumenta el timeout en el script

## Próximos pasos

1. [x] Desplegar en Railway
2. [x] Configurar secrets
3. [ ] Subir Excel con datos reales
4. [ ] Ejecutar workflow manualmente
5. [ ] Verificar datos en Supabase
6. [ ] Activar ejecución automática (lunes 6am UTC)

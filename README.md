# Registro de Vehículos — Netlify

Aplicación web React/Vite para llevar el registro de vehículos, gastos, documentos y vencimientos.

## Qué incluye

- Registro de vehículos por patente, marca, modelo, año y kilometraje.
- Próxima mantención por fecha y kilómetros.
- Fechas de revisión técnica, permiso de circulación, SOAP y seguro.
- Registro de gastos: TAG, bencina, electricidad, mantenciones, seguros, permisos y otros.
- Dashboard mensual con gasto total y desglose por categoría.
- Subida local de documentos: pólizas, SOAP, revisión técnica, permisos y facturas.
- Alertas automáticas de vencimientos próximos o vencidos.
- Exportación/importación de respaldo en JSON.
- Exportación de gastos a CSV.

## Importante

Esta versión guarda los datos en el navegador usando `localStorage`. Funciona bien como MVP, pero los datos no quedan sincronizados entre dispositivos. Para una versión definitiva conviene agregar Supabase, Firebase o una base de datos propia.

## Cómo correr localmente

```bash
npm install
npm run dev
```

## Cómo publicar en Netlify

### Opción recomendada: GitHub + Netlify

1. Sube esta carpeta a un repositorio de GitHub.
2. Entra a Netlify.
3. Elige **Add new site** > **Import an existing project**.
4. Conecta tu repositorio.
5. Netlify detectará la configuración, pero confirma:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Publica el sitio.

### Opción rápida: arrastrar carpeta `dist`

1. Ejecuta:

```bash
npm install
npm run build
```

2. En Netlify, usa la opción de deploy manual y sube la carpeta `dist`.


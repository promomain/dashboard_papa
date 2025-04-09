# Dashboard de Entrenamientos

Un dashboard web para gestionar y dar seguimiento a los entrenamientos realizados con clientes. Permite registrar entrenamientos, marcar pagos y visualizar la información en un calendario.

## Características

- Registro de entrenamientos con información detallada
- Seguimiento de pagos (pagado/pendiente)
- Visualización en calendario
- Indicadores visuales para entrenamientos pagados y pendientes
- Almacenamiento local en el navegador
- Interfaz responsiva

## Tecnologías utilizadas

- React
- TypeScript
- Local Storage para persistencia de datos
- react-calendar para la visualización del calendario
- date-fns para el manejo de fechas
- Styled Components para los estilos

## Instalación

1. Clona este repositorio:
```
git clone <url-del-repositorio>
cd dashboard-entrenamientos
```

2. Instala las dependencias:
```
npm install
```

3. Ejecuta el proyecto en modo desarrollo:
```
npm run dev
```

4. Para construir para producción:
```
npm run build
```

## Despliegue en GitHub Pages

1. Asegúrate de actualizar la propiedad `base` en `vite.config.ts` con el nombre de tu repositorio.

2. Construye el proyecto para producción:
```
npm run build
```

3. Despliega en GitHub Pages:
```
npm run deploy
```

## Uso

1. Selecciona una fecha en el calendario
2. Añade un nuevo entrenamiento usando el botón "Añadir Entrenamiento"
3. Completa el formulario con los detalles del entrenamiento
4. Marca si el entrenamiento está pagado o pendiente
5. Visualiza, edita o elimina entrenamientos existentes

## Licencia

MIT 
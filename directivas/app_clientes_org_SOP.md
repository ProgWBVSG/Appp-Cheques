# Directiva: Construcción APP de Clientes (Cheques)

## 1. Objetivo
Construir una Single Page Application (SPA) para la gestión financiera de descuento de cheques. La aplicación será ultra rápida, con un diseño apto para móviles (menú lateral/inferior), y facilitará el cálculo de comisiones, intereses y generación de mensajes para los clientes.

## 2. Entradas y Stack Tecnológico
- **Frontend**: Vite + React (TypeScript) + TailwindCSS.
- **Backend/Base de Datos**: Supabase (PostgreSQL).
- **Tablas Principales**: `clientes`, `cheques`.

## 3. Salidas Esperadas
Una aplicación web desplegable que contenga 5 pantallas principales:
1. Login
2. Dashboard (KPIs, Atajos)
3. Módulo de Clientes (Listado, Fichas)
4. Carga y Gestión de Cheques (Formulario con Motor Financiero)
5. Calendario y Flujo de Caja

## 4. Lógica de Ejecución (Paso a Paso)
1. **Inicialización**: Crear el proyecto base de Vite y configurar TailwindCSS.
2. **Base de Datos**: Configurar Supabase y crear el schema para `clientes` y `cheques`.
3. **Core Lógico**: Implementar función `calcularOperacionCheque`.
4. **Desarrollo UI/UX**:
   - Crear sistema de enrutamiento (React Router).
   - Diseñar UI premium (colores armoniosos, modo oscuro o limpio, micro-interacciones).
   - Implementar vistas de las 5 pantallas detalladas en el requerimiento.
5. **Integración WhatsApp**: Crear componente o utilidad `generarMensajeWhatsApp` con el template predefinido e integrarlo a la vista del cheque y ficha del cliente.

## 5. Restricciones y Casos Borde (Trampas Conocidas)
- **Cálculo de Días**: Asegurarse de que el cálculo de fechas maneje correctamente las zonas horarias para evitar diferencias de +/- 1 día.
- **Precisión Financiera**: Asegurar el uso de redondeo seguro a 2 decimales para evitar problemas de coma flotante en JS.
- **Base TNA vs Directa**: Validar qué tipo de base anual se utiliza para dividir (360 o 365 días).
- **Ruteo Móvil**: La navegación debe sentirse como app nativa; no recargar la página.

## 6. Mantenimiento de la Directiva
- *Esta directiva debe ser actualizada si durante el desarrollo o uso de la base de datos se encuentran límites o comportamientos inesperados.*

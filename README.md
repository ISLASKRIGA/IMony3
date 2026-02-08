# 💰 IMony - Finanzas Personales Inteligentes

Una aplicación web minimalista de finanzas personales con entrada de voz inteligente multi-transacción, inspirada en MonAi.

## ✨ Características Principales

### 🎤 Entrada por Voz Inteligente Multi-Transacción
- **Permiso único del micrófono** - Solo se solicita una vez al abrir la app
- **Micrófono siempre listo** - No necesitas dar permiso cada vez que lo uses
- **Detección de múltiples transacciones** - Detecta varias transacciones en una sola frase
- **Detección automática** de ingresos vs gastos
- **Procesamiento de lenguaje natural** en español
- **Categorización automática** basada en palabras clave
- **Extracción inteligente** de montos y descripciones
- **Notificaciones visuales** para feedback instantáneo

#### Ejemplos de uso por voz multi-transacción:
- 💸 **"Gasté 500 en hamburguesa y 200 en uber"** → Detecta: 2 gastos separados
- 👔 **"Pantalón 800 y zapatos 600"** → Detecta: 2 gastos en categoría Ropa
- 🍕 **"Pizza 300, gasolina 500 y cine 150"** → Detecta: 3 gastos en diferentes categorías
- 💰 **"Gané 5000 en mi trabajo"** → Detecta: Ingreso

### 📊 Gráfica Visual Inteligente
- **Barras animadas** que muestran gastos por categoría
- **Ordenamiento automático** por categoría más gastada
- **Colores vibrantes** para cada categoría
- **Actualización en tiempo real** al agregar transacciones
- **Top 6 categorías** más gastadas

### 📱 Diseño Minimalista Estilo iPhone
- Colores blancos y grises suaves
- Tipografía Inter (estilo San Francisco)
- Animaciones suaves y micro-interacciones
- Emojis para categorías visuales
- Sombras sutiles y bordes redondeados

### 💡 Funcionalidades

1. **Onboarding Personalizado**
   - Selección de categorías favoritas
   - Creación de categorías personalizadas
   - Asignación automática de emojis y colores

2. **Dashboard Inteligente**
   - Balance total en tiempo real
   - Desglose de ingresos vs gastos
   - Gráfica de barras por categoría
   - Resumen horizontal de categorías
   - Lista de transacciones ordenadas

3. **Múltiples Formas de Entrada**
   - 🎤 Voz multi-transacción (principal)
   - ✍️ Manual con formulario
   - 🔍 Búsqueda de transacciones

## 🛠️ Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Diseño moderno con variables CSS y animaciones
- **JavaScript Vanilla** - Sin dependencias
- **Web Speech API** - Reconocimiento de voz
- **LocalStorage** - Persistencia de datos

## 🚀 Cómo Usar

1. Abre `index.html` en tu navegador (o ejecuta `INICIAR.bat`)
2. Acepta el permiso del micrófono (solo una vez)
3. Selecciona tus categorías favoritas
4. Prueba la entrada por voz multi-transacción
5. ¡Comienza a rastrear tus finanzas!

## 🎯 Inteligencia de Voz Avanzada

### Detección de Múltiples Transacciones
La app puede detectar varias transacciones en una sola frase usando separadores como:
- "y" → "Gasté 500 en pizza **y** 200 en uber"
- "también" → "Hamburguesa 300 **también** gasolina 400"
- "además" → "Pantalón 800 **además** zapatos 600"
- "," → "Pizza 300**,** uber 200**,** cine 150"

### Detección de Tipo de Transacción
**Ingresos:** gané, ganancia, ingreso, cobré, me pagaron, recibí, salario, sueldo, bono, premio, apuesta, venta, vendí

**Gastos:** Todo lo demás (por defecto)

### Reconocimiento de Números
- Números en dígitos: "500", "1000"
- Números con símbolos: "$500", "500 pesos"
- Números en palabras: "quinientos", "mil", "doscientos"

### Categorización Automática por Palabras Clave

- 🍔 **Comer afuera:** hamburguesa, pizza, tacos, comida, restaurante, papas, francesa, burrito, torta, sushi
- 🛍️ **Compras:** compras, compré, tienda, mercado, supermercado, walmart, soriana, oxxo
- 🚗 **Transporte:** uber, taxi, gasolina, transporte, metro, autobús, didi, viaje
- 🎮 **Entretenimiento:** cine, película, concierto, juego, diversión, fiesta, bar, antro
- 💊 **Salud:** medicina, doctor, farmacia, hospital, consulta, medicamento, pastilla
- 👔 **Ropa:** ropa, zapatos, camisa, pantalón, vestido, playera, tenis, calcetines, chamarra
- 🚙 **Auto:** auto, carro, coche, mecánico, lavado, aceite, llanta, refacción
- 🐶 **Mascotas:** mascota, perro, gato, veterinario, comida para, alimento
- 💎 **Lujo:** lujo, joya, reloj, perfume, spa, masaje

## 📊 Estructura de Datos

```javascript
{
  categories: [
    { id, name, emoji, color, selected }
  ],
  transactions: [
    { id, type, amount, description, category, date, method }
  ]
}
```

## 🎨 Paleta de Colores

- **Blanco:** #FFFFFF
- **Gris Claro:** #F9F9F9, #F2F2F7
- **Gris Medio:** #E5E5EA
- **Texto:** #000000, #6C6C70
- **Rojo (Gastos):** #FF3B30
- **Verde (Ingresos):** #34C759
- **Azul (Acento):** #007AFF

### Colores de Gráfica
- **Morado:** #5856D6
- **Naranja:** #FF9500
- **Rosa:** #FF2D55
- **Verde:** #34C759
- **Turquesa:** #00C7BE
- **Púrpura:** #AF52DE

## 🎬 Animaciones

- **fadeIn** - Entrada suave de pantallas
- **slideDown** - Notificaciones desde arriba
- **slideUp** - Modales desde abajo
- **slideInLeft** - Transacciones nuevas
- **pulse** - Micrófono activo
- **pulseRing** - Anillo de pulso al escuchar

## 🔮 Próximas Características

- [x] Detección de múltiples transacciones
- [x] Gráfica visual por categoría
- [x] Ordenamiento automático
- [ ] Menú de configuración
- [ ] Exportar/Importar CSV
- [ ] Presupuestos por categoría
- [ ] Modo oscuro
- [ ] Sincronización en la nube
- [ ] Compartir listas
- [ ] Widgets de resumen

## 📝 Notas de Producción

- La aplicación solicita **permiso del micrófono una sola vez** al cargar
- Una vez concedido, el micrófono está **siempre disponible** sin pedir permiso nuevamente
- La aplicación usa **Web Speech API** que requiere HTTPS en producción
- Los datos se guardan localmente en el navegador con **LocalStorage**
- Compatible con navegadores modernos (Chrome, Safari, Edge)
- **Mejor experiencia en Chrome** para reconocimiento de voz
- Optimizada para dispositivos móviles y desktop
- **Lista para producción** - Código completo y funcional

## 🚀 Deploy a Producción

### Opción 1: Netlify
1. Sube la carpeta completa a un repositorio Git
2. Conecta con Netlify
3. Deploy automático

### Opción 2: Vercel
1. `npm install -g vercel`
2. `vercel` en la carpeta del proyecto
3. Sigue las instrucciones

### Opción 3: GitHub Pages
1. Sube a GitHub
2. Settings → Pages → Deploy from main branch
3. Listo

## 🙏 Inspiración

Inspirada en [MonAi](https://get-monai.app/) - The expense tracker you'll actually use.

---

**Hecho con ❤️ para hacer las finanzas personales más simples y accesibles.**

## 📞 Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.



# Autobilling

<p align="center">
  <img src="assets/icon.png" alt="Autobilling icon" width="128" height="128">
</p>

<p align="center">
  <b>Genera tarjetas de prueba válidas y autocompleta cualquier formulario de pago con un solo clic.</b>
</p>

<p align="center">
  <a href="LICENSE">Licencia MIT</a> ·
  <a href="PRIVACY.md">Privacidad</a> ·
  <a href="CHANGELOG.md">Registo de cambios</a> ·
  <a href="README.ru.md">Русский</a>
</p>

## ¿Qué es Autobilling?

Autobilling es una extensión para navegador que genera **números de tarjeta válidos según el algoritmo de Luhn** con datos de facturación coincidentes (nombre, dirección, ciudad, código postal, país, teléfono, correo electrónico) y los **autocompleta en formularios de pago** — Stripe, Stripe Elements y campos de pago HTML estándar.

Úsalo para probar flujos de pago, control de calidad (QA) o desarrollo, no para transacciones reales.

## ¿Qué genera?

- Número de tarjeta (pasa la validación de Luhn)
- Fecha de expiración (MM/AA)
- CVV (3 o 4 dígitos según la red de la tarjeta)
- Nombre completo
- Dirección postal
- Ciudad, estado/provincia, código postal
- País (se admiten más de 27 países)
- Número de teléfono con prefijos de país realistas
- Dirección de correo electrónico

## Instalación rápida

### Chrome / Edge / Brave / Opera

1. Descarga o clona este repositorio
2. Ejecuta en la terminal:
   ```bash
   npm install
   npm run build
   ```
3. Abre la página de extensiones de tu navegador:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
4. Habilita el **modo de desarrollador** (interruptor en la esquina superior derecha)
5. Haz clic en **Cargar desempaquetado** y selecciona la carpeta `dist`
6. Fija la extensión en tu barra de herramientas

### Firefox

Requiere Firefox 142 o superior.

1. Descarga o clona este repositorio
2. Ejecuta en la terminal:
   ```bash
   npm install
   npm run build
   ```
3. Abre `about:debugging#/runtime/this-firefox`
4. Haz clic en **Cargar complemento temporal**
5. Selecciona `dist-firefox/manifest.json`

### Instalación con un clic en Windows

Ejecuta `install.bat`: instala las dependencias, compila la extensión y abre la página de extensiones.

## Cómo usarlo

| Acción | Cómo |
| --- | --- |
| Generar nueva tarjeta y perfil | Haz clic en **Generar** |
| Completar un formulario de pago | Haz clic en **Autocompletar formulario** o presiona `Ctrl+Shift+F` |
| Autocompletar con clic derecho | Clic derecho en cualquier página → **Autocompletar tarjeta** |
| Copiar todos los datos a la vez | Haz clic en **Copiar todo** |
| Copiar un solo campo | Haz clic en cualquier valor (número de tarjeta, expiración, CVV, nombre, etc.) |
| Cambiar red de tarjeta | Selecciona un **BIN** (prefijo bancario) del menú desplegable |
| Cambiar país | Selecciona un **País** del menú desplegable |
| Agregar tu propio prefijo BIN | Escríbelo en **BIN personalizado** → **Agregar** |
| Marcar un BIN o país como favorito | Haz clic en la estrella ☆ junto al selector |
| Cambiar perfil de facturación | Elige **Generado**, **EE. UU.**, **NL** o **Personalizado** en la sección de Facturación |
| Abrir configuración | Haz clic en **⚙ Configuración** en el encabezado del menú emergente |

## Configuración

Haz clic en **Configuración** en el menú emergente para configurar:

- **Solo sesión** — los datos de la tarjeta y el perfil no se guardan entre sesiones
- **País automático por URL** — detecta el país según el dominio de la pestaña actual (.de, .fr, .jp, etc.)
- **Retención del historial** — borrado automático tras 15 min, 1 hora, 24 horas, o mantener hasta borrar manualmente
- **Tarjeta compacta** — vista de tarjeta reducida de forma predeterminada
- **Búsqueda en vivo de BIN** — muestra información del banco/país para BIN desconocidos (opcional, usa binlist.net)
- **Teléfono y correo electrónico** — activa/desactiva la generación de los campos de teléfono y correo
- **Perfil personalizado** — guarda tu propio nombre, dirección, ciudad, código postal, estado, teléfono, correo y país
- **BINs personalizados** — administra los prefijos BIN guardados (ver, eliminar individualmente)
- **Exportar / Importar** — respalda y restaura tu configuración como JSON
- **Restablecer** — borra el historial o restablece toda la configuración a los valores predeterminados

## Perfiles de facturación

| Perfil | Descripción |
| --- | --- |
| **Generado** | Nombre, dirección y ciudad aleatorios del conjunto del país seleccionado |
| **EE. UU.** | Dirección fija en EE. UU.: 221B Baker Street, New York, NY 10001 |
| **NL** | Dirección fija en Países Bajos: Damrak 1, Amsterdam, 1012 LG |
| **Personalizado** | Tu propio perfil guardado (edítalo en Configuración) |

## Redes de tarjetas compatibles

Visa, Mastercard, American Express, Discover, UnionPay, JCB, Diners Club: mediante BINs incorporados y personalizados, además de búsqueda en vivo.

## Países compatibles (más de 27)

US, GB, DE, FR, IT, ES, JP, CA, AU, NL, BR, MX, IN, KR, TR, AE, AR, CL, TH, GR, HU, RO, ZA, IL, ID, PH, VN, TW, HK, AT, BE, CH, CZ, DK, FI, IE, NO, NZ, PL, PT, SE, SG — cada uno con ciudades realistas, estados/provincias, formatos de código postal y prefijos telefónicos.

## Privacidad

Todo permanece en tu dispositivo. La única solicitud externa es una búsqueda de BIN **opcional** en `lookup.binlist.net` (envía únicamente los primeros 6–8 dígitos del número de tarjeta, es decir, el prefijo bancario). Los números de tarjeta completos, CVVs, nombres y direcciones nunca se envían a ningún lado.

Consulta [PRIVACY.md](PRIVACY.md) para más detalles.

## Aviso de responsabilidad

Autobilling es **únicamente para desarrollo, control de calidad (QA) y pruebas legítimas**. No lo uses para fraude, transacciones no autorizadas, eludir sistemas de pago o infringir leyes o términos de plataformas. Eres responsable de su uso.

## Desarrollo

```bash
npm install          # instalar dependencias
npm test             # ejecutar todas las pruebas
npm run lint         # verificar código fuente
npm run build        # compilar dist/ y dist-firefox/
npm run zip          # crear ambos archivos .zip
npm run setup        # un paso: instalar → compilar → abrir página de extensiones
```

Consulta [CHANGELOG.md](CHANGELOG.md) para el historial de versiones.

## Créditos

- [adxptived](https://github.com/adxptived) — autor
- Lógica de BIN basada en [CreditsCardTools](https://github.com/NjProVk/CreditsCardTools)
- Metadatos de BIN de [binlist.net](https://binlist.net)

## Licencia

MIT — consulta [LICENSE](LICENSE).

/**
 * Config del sitio estático (Ronda 5). Cada quien configura su propio /exec acá.
 *
 * scripts/construir-web.js copia este archivo a web/config.js SOLO la primera vez
 * (si web/config.js no existe todavía) — así reconstruir el sitio nunca borra la URL
 * ya configurada. Para cambiarla después, se edita web/config.js directamente.
 */
window.APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVKv2u-IVzC-0OLsatWhwp9vRIXXiHLS4lvlldkfNab_bILAPVFDjF17_8KD672eoz/exec';

// 'fetch' (por defecto) o 'jsonp' — cambiar a 'jsonp' solo si el spike de CORS
// (ver docs/INSTALACION.md, sección PWA) muestra que fetch() queda bloqueado.
window.APPSCRIPT_TRANSPORTE = 'fetch';

// Bridge simple para hacer el player accesible sin modificar game.js
// Este script se ejecuta después de que el juego cargue

(function() {
    // Esperar a que el juego esté listo
    const checkPlayer = setInterval(() => {
        // Buscar el player en el scope global
        if (typeof player !== 'undefined' && player !== null) {
            window.player = player;
            console.log('✅ Player bridge conectado');
            clearInterval(checkPlayer);
        }
    }, 100);

    // Timeout de seguridad (10 segundos)
    setTimeout(() => {
        clearInterval(checkPlayer);
    }, 10000);
})();

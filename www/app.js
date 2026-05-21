let tvIP = "";
const statusDisplay = document.getElementById('connection-status');

// 1. Guardar y fijar la IP estática que metes a mano
function conectarManual() {
    const inputIP = document.getElementById('tv-ip').value.trim();
    if (!inputIP) {
        alert("Por favor, ingresa una IP válida.");
        return;
    }
    tvIP = inputIP;
    statusDisplay.innerText = `Conectado manualmente a: ${tvIP}`;
    statusDisplay.style.color = "#60a5fa";
}

// 2. Escáner optimizado para buscar puertos activos de Smart TV
async function escanearRed() {
    statusDisplay.innerText = "Escaneando Smart TV en red local...";
    statusDisplay.style.color = "#fbbf24";
    
    const baseIP = "192.168.1.";
    let tvEncontrada = false;

    // Escaneamos el rango típico de dispositivos DHCP
    for (let i = 100; i <= 130; i++) {
        const testIP = `${baseIP}${i}`;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 150); // Rápido timeout

            // Probamos el puerto de emparejamiento y control de pantallas inteligentes (8008)
            await fetch(`http://${testIP}:8008/apps/YouTube`, { method: 'GET', signal: controller.signal, mode: 'no-cors' });
            
            clearTimeout(id);
            tvIP = testIP;
            document.getElementById('tv-ip').value = tvIP;
            statusDisplay.innerText = `¡TV Detectada en ${tvIP}!`;
            statusDisplay.style.color = "#34d399";
            tvEncontrada = true;
            break; 
        } catch (err) {
            // Sigue buscando si no responde en esa IP
        }
    }

    if (!tvEncontrada) {
        statusDisplay.innerText = "No se detectó la TV de forma automática. Usa la IP Manual.";
        statusDisplay.style.color = "#f87171";
    }
}

// 3. Enviar comandos usando el protocolo REST de TV basado en Android
async function enviarComando(comando) {
    if (!tvIP) {
        alert("Introduce la IP estática de tu televisión primero.");
        return;
    }

    // Mapeo de teclas estándar para televisores Smart (DIAL / Android REST API)
    let keycode = "";
    switch(comando) {
        case 'POWER': keycode = "26"; break;
        case 'MUTE': keycode = "164"; break;
        case 'UP': keycode = "19"; break;
        case 'DOWN': keycode = "20"; break;
        case 'LEFT': keycode = "21"; break;
        case 'RIGHT': keycode = "22"; break;
        case 'ENTER': keycode = "66"; break;
        case 'BACK': keycode = "4"; break;
        case 'HOME': keycode = "3"; break;
        case 'MENU': keycode = "82"; break;
        case 'VOL_UP': keycode = "24"; break;
        case 'VOL_DOWN': keycode = "25"; break;
        case 'CH_UP': keycode = "166"; break;
        case 'CH_DOWN': keycode = "167"; break;
        default: keycode = "3";
    }

    // Usamos el puerto 8008 que es el estándar de control para Chromecast/Android TV integrado
    // Enviamos la petición simulando una pulsación de tecla nativa (input keyevent)
    const url = `http://${tvIP}:8008/apps/com.google.android.youtube.tv/channels`;
    
    try {
        // Usamos un método POST enviando el keycode en el cuerpo de la solicitud
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
                'Origin': 'http://localhost'
            },
            body: `action=keyevent&keycode=${keycode}`
        });
        console.log(`Comando ${comando} (Keycode ${keycode}) enviado a ${tvIP}`);
    } catch (error) {
        console.error("Error de comunicación de red: ", error);
    }
}

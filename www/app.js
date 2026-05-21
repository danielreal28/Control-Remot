let tvIP = "";
const statusDisplay = document.getElementById('connection-status');

// 1. Guardar y fijar la IP puesta a mano
function conectarManual() {
    const inputIP = document.getElementById('tv-ip').value.trim();
    if (!inputIP) {
        alert("Por favor, ingresa una IP válida.");
        return;
    }
    tvIP = inputIP;
    statusDisplay.innerText = `IP Fijada en: ${tvIP}`;
    statusDisplay.style.color = "#60a5fa";
}

// 2. Escáner automático de red local por Wi-Fi
async function escanearRed() {
    statusDisplay.innerText = "Escaneando red local (192.168.1.X)...";
    statusDisplay.style.color = "#fbbf24";
    
    // Rango base más común en routers domésticos
    const baseIP = "192.168.1.";
    let tvEncontrada = false;

    // Escaneamos las IPs más probables asignadas por DHCP (del 100 al 130)
    for (let i = 100; i <= 130; i++) {
        const testIP = `${baseIP}${i}`;
        try {
            // Hacemos una petición rápida con un tiempo de espera corto (Timeout)
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 200); // 200ms por IP

            // Probamos el puerto estándar de Smart TV (ej: 8080 o 1925)
            // Cambia el puerto si tu modelo usa uno específico
            await fetch(`http://${testIP}:8080/`, { method: 'GET', signal: controller.signal, mode: 'no-cors' });
            
            clearTimeout(id);
            tvIP = testIP;
            document.getElementById('tv-ip').value = tvIP;
            statusDisplay.innerText = `¡TV Tecnomaster encontrada en ${tvIP}!`;
            statusDisplay.style.color = "#34d399";
            tvEncontrada = true;
            break; 
        } catch (err) {
            // Si da error o timeout, pasamos a la siguiente IP
        }
    }

    if (!tvEncontrada) {
        statusDisplay.innerText = "No se detectó la TV automáticamente. Pon la IP manualmente.";
        statusDisplay.style.color = "#f87171";
    }
}

// 3. Enviar los comandos a la televisión por Wi-Fi
async function enviarComando(comando) {
    if (!tvIP) {
        alert("Primero debes escanear o ingresar la IP de tu TV.");
        return;
    }

    // Estructura de la petición HTTP POST hacia el Smart TV
    // Nota: Dependiendo del año del Tecnomaster, el endpoint puede ser /key o /webapi/control
    const url = `http://${tvIP}:8080/key/${comando}`;

    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors', // Evita problemas de seguridad entre la app y la TV
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(`Comando ${comando} enviado con éxito a ${tvIP}`);
    } catch (error) {
        console.error("Error al enviar el comando a la TV: ", error);
    }
}
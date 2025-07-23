document.getElementById('scanButton').addEventListener('click', async () => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true
    });

    const list = document.getElementById('deviceList');
    const item = document.createElement('li');
    item.textContent = `Dispositivo encontrado: ${device.name || 'Desconocido'}`;
    list.appendChild(item);
  } catch (error) {
    alert('Error al detectar: ' + error);
  }
});

// Registrar el service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('Service Worker registrado');
  });
}

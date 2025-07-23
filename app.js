// Variables globales
let currentUser = null;
const apiUrl = 'https://6878141b31d28a460e1d23cc.mockapi.io/68643bc188359a373e97e75c/UDataB/68643bc188359a373e97e75c/68643bc188359a373e97e75c/68643bc188359a373e97e75c/UserSinRed';
let messages = [];
let isOnline = navigator.onLine;

// Elementos del DOM
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const usernameInput = document.getElementById('usernameInput');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && usernameInput.value.trim()) {
        setUsername();
    }
});
window.addEventListener('online', handleConnectionChange);
window.addEventListener('offline', handleConnectionChange);

// Inicializar la aplicación
async function initApp() {
    // Verificar si hay un usuario guardado en caché
    currentUser = localStorage.getItem('messageUser');
    
    if (currentUser) {
        usernameInput.style.display = 'none';
        messageInput.disabled = false;
        sendButton.disabled = false;
        loadMessages();
    } else {
        showNotification('Por favor, ingresa tu nombre para comenzar');
    }
    
    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registrado');
        } catch (error) {
            console.error('Error al registrar el Service Worker:', error);
        }
    }
}

function setUsername() {
    const username = usernameInput.value.trim();
    if (username) {
        currentUser = username;
        localStorage.setItem('messageUser', username);
        usernameInput.style.display = 'none';
        messageInput.disabled = false;
        sendButton.disabled = false;
        showNotification(`Bienvenido, ${username}!`);
        loadMessages();
    }
}

async function loadMessages() {
    try {
        // Intentar cargar desde la API primero si hay conexión
        if (isOnline) {
            const response = await fetch(apiUrl);
            messages = await response.json();
            localStorage.setItem('cachedMessages', JSON.stringify(messages));
        } else {
            // Cargar desde caché si no hay conexión
            const cachedMessages = localStorage.getItem('cachedMessages');
            messages = cachedMessages ? JSON.parse(cachedMessages) : [];
            showNotification('Modo offline - Mostrando mensajes en caché');
        }
        
        renderMessages();
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        const cachedMessages = localStorage.getItem('cachedMessages');
        messages = cachedMessages ? JSON.parse(cachedMessages) : [];
        renderMessages();
        showNotification('Error al cargar mensajes. Mostrando caché local');
    }
}

function renderMessages() {
    chatContainer.innerHTML = '';
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(msg.user === currentUser ? 'message-sent' : 'message-received');
        
        messageElement.innerHTML = `
            <div class="message-text">${msg.text}</div>
            <div class="message-info">
                <span class="message-user">${msg.user}</span>
                <span class="message-time">${formatTime(msg.time)}</span>
            </div>
        `;
        
        chatContainer.appendChild(messageElement);
    });
    
    // Scroll al final
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    const newMessage = {
        user: currentUser,
        text: text,
        time: new Date().toISOString()
    };
    
    // Agregar a la interfaz inmediatamente
    messages.push(newMessage);
    renderMessages();
    messageInput.value = '';
    
    // Guardar en caché local
    localStorage.setItem('cachedMessages', JSON.stringify(messages));
    
    // Intentar enviar a la API si hay conexión
    if (isOnline) {
        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessage)
            });
            
            // Actualizar la lista completa después de enviar
            await loadMessages();
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            showNotification('Mensaje guardado localmente. Se enviará cuando haya conexión');
        }
    } else {
        showNotification('Mensaje guardado localmente. Se enviará cuando haya conexión');
    }
}

function handleConnectionChange() {
    isOnline = navigator.onLine;
    if (isOnline) {
        showNotification('Conectado - Sincronizando mensajes...');
        loadMessages();
    } else {
        showNotification('Sin conexión - Modo offline');
    }
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

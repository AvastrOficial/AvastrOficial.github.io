// Variables globales
let currentUser = null;
let currentChat = 'general';
let chats = {
    general: {
        name: 'Chat General',
        messages: []
    }
};
const apiUrl = 'https://6878141b31d28a460e1d23cc.mockapi.io/68643bc188359a373e97e75c/UDataB/68643bc188359a373e97e75c/68643bc188359a373e97e75c/68643bc188359a373e97e75c/UserSinRed';
let isOnline = navigator.onLine;

// Elementos del DOM
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const usernameInput = document.getElementById('usernameInput');
const setUsernameBtn = document.getElementById('setUsernameBtn');
const usernameContainer = document.getElementById('usernameContainer');
const messageInputContainer = document.getElementById('messageInputContainer');
const chatList = document.getElementById('chatList');
const currentUserName = document.getElementById('currentUserName');
const userStatus = document.getElementById('userStatus');
const newChatBtn = document.getElementById('newChatBtn');
const newChatModal = document.getElementById('newChatModal');
const newChatName = document.getElementById('newChatName');
const cancelNewChat = document.getElementById('cancelNewChat');
const confirmNewChat = document.getElementById('confirmNewChat');
const menuToggle = document.getElementById('menuToggle');
const chatSidebar = document.getElementById('chatSidebar');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
setUsernameBtn.addEventListener('click', setUsername);
usernameInput.addEventListener('keypress', (e) => e.key === 'Enter' && setUsername());
newChatBtn.addEventListener('click', () => newChatModal.classList.add('active'));
cancelNewChat.addEventListener('click', () => newChatModal.classList.remove('active'));
confirmNewChat.addEventListener('click', createNewChat);
menuToggle.addEventListener('click', toggleSidebar);
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// Inicializar la aplicación
async function initApp() {
    // Cargar datos del usuario y chats desde localStorage
    currentUser = localStorage.getItem('bszMessengerUser');
    loadChatsFromLocalStorage();
    
    if (currentUser) {
        setupUserSession();
    } else {
        showNotification('Por favor, ingresa tu nombre para comenzar');
    }
    
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registrado');
        } catch (error) {
            console.error('Error al registrar SW:', error);
        }
    }
    
    // Cargar mensajes iniciales
    loadMessages();
    updateConnectionStatus();
    renderChatList();
}

function setupUserSession() {
    usernameContainer.style.display = 'none';
    messageInput.disabled = false;
    sendButton.disabled = false;
    currentUserName.textContent = currentUser;
    userStatus.textContent = isOnline ? 'En línea' : 'Offline';
}

function setUsername() {
    const username = usernameInput.value.trim();
    if (username) {
        currentUser = username;
        localStorage.setItem('bszMessengerUser', username);
        setupUserSession();
        showNotification(`Bienvenido, ${username}!`);
        
        // Agregar mensaje de sistema
        addSystemMessage(`${username} se ha unido al chat`);
    }
}

function loadChatsFromLocalStorage() {
    const savedChats = localStorage.getItem('bszMessengerChats');
    if (savedChats) {
        chats = JSON.parse(savedChats);
    }
}

function saveChatsToLocalStorage() {
    localStorage.setItem('bszMessengerChats', JSON.stringify(chats));
}

async function loadMessages() {
    try {
        if (isOnline) {
            const response = await fetch(apiUrl);
            const apiMessages = await response.json();
            
            // Procesar mensajes de la API
            apiMessages.forEach(msg => {
                const chatId = msg.chatId || 'general';
                if (!chats[chatId]) {
                    chats[chatId] = {
                        name: msg.chatName || `Chat ${chatId}`,
                        messages: []
                    };
                }
                
                // Evitar duplicados
                if (!chats[chatId].messages.some(m => m.id === msg.id)) {
                    chats[chatId].messages.push({
                        id: msg.id,
                        user: msg.user,
                        text: msg.text,
                        time: msg.time || new Date().toISOString()
                    });
                }
            });
            
            saveChatsToLocalStorage();
            showNotification('Mensajes sincronizados');
        }
        
        renderMessages();
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        renderMessages();
        showNotification('Error al cargar mensajes. Usando caché local');
    }
}

function renderMessages() {
    if (!chats[currentChat]) return;
    
    chatContainer.innerHTML = '';
    
    // Mostrar mensajes de bienvenida si no hay mensajes
    if (chats[currentChat].messages.length === 0 && currentChat === 'general') {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="message left">
                <div class="username">Sistema</div>
                <div class="message-text">¡Bienvenido al ${chats[currentChat].name}!</div>
                <div class="message-time">Ahora</div>
            </div>
            <div class="message left">
                <div class="username">Sistema</div>
                <div class="message-text">Escribe un mensaje para comenzar</div>
                <div class="message-time">Ahora</div>
            </div>
        `;
        chatContainer.appendChild(welcomeDiv);
        return;
    }
    
    // Mostrar mensajes del chat actual
    chats[currentChat].messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        const isCurrentUser = msg.user === currentUser;
        
        messageDiv.className = `message ${isCurrentUser ? 'right' : 'left'}`;
        messageDiv.innerHTML = `
            <div class="username">${msg.user}</div>
            <div class="message-text">${msg.text}</div>
            <div class="message-time">${formatTime(msg.time)}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
    });
    
    // Scroll al final
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderChatList() {
    chatList.innerHTML = '';
    
    Object.keys(chats).forEach(chatId => {
        const chat = chats[chatId];
        const lastMessage = chat.messages[chat.messages.length - 1];
        
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chatId === currentChat ? 'active' : ''}`;
        chatItem.dataset.chat = chatId;
        chatItem.innerHTML = `
            <div class="chat-name">${chat.name}</div>
            <div class="chat-preview">${lastMessage ? `${lastMessage.user}: ${lastMessage.text}` : 'No hay mensajes'}</div>
        `;
        
        chatItem.addEventListener('click', () => switchChat(chatId));
        chatList.appendChild(chatItem);
    });
}

function switchChat(chatId) {
    currentChat = chatId;
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.chat === chatId);
    });
    renderMessages();
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    const newMessage = {
        id: Date.now().toString(),
        user: currentUser,
        text: text,
        time: new Date().toISOString(),
        chatId: currentChat,
        chatName: chats[currentChat].name
    };
    
    // Agregar al chat local
    if (!chats[currentChat]) {
        chats[currentChat] = {
            name: `Chat ${currentChat}`,
            messages: []
        };
    }
    
    chats[currentChat].messages.push(newMessage);
    saveChatsToLocalStorage();
    renderMessages();
    messageInput.value = '';
    
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
            
            // Actualizar la lista de chats
            renderChatList();
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            showNotification('Mensaje guardado localmente. Se enviará cuando haya conexión');
        }
    } else {
        showNotification('Mensaje guardado localmente. Se enviará cuando haya conexión');
    }
}

function addSystemMessage(text) {
    if (!chats[currentChat]) return;
    
    const systemMessage = {
        id: `sys-${Date.now()}`,
        user: 'Sistema',
        text: text,
        time: new Date().toISOString()
    };
    
    chats[currentChat].messages.push(systemMessage);
    saveChatsToLocalStorage();
    renderMessages();
}

function createNewChat() {
    const chatName = newChatName.value.trim();
    if (!chatName) return;
    
    const chatId = `chat-${Date.now()}`;
    chats[chatId] = {
        name: chatName,
        messages: []
    };
    
    saveChatsToLocalStorage();
    renderChatList();
    newChatName.value = '';
    newChatModal.classList.remove('active');
    switchChat(chatId);
    
    // Mensaje de sistema
    addSystemMessage(`Chat "${chatName}" creado por ${currentUser}`);
}

function toggleSidebar() {
    chatSidebar.classList.toggle('active');
}

function updateConnectionStatus() {
    isOnline = navigator.onLine;
    userStatus.textContent = isOnline ? 'En línea' : 'Offline';
    
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
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }, 10);
}

// URLs de las APIs
const USERS_API = 'https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/User/1';
const CHATS_API = 'https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/Chats';
const MESSAGES_API = 'https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/Chats/2';

// Variables globales
let currentUser = null;
let currentChat = 'general';
let chats = {
    general: {
        id: 'general',
        name: 'Chat General',
        admin: 'system',
        messages: [],
        users: [],
        isPrivate: false,
        createdAt: new Date().toISOString()
    }
};
let isOnline = navigator.onLine;
let allUsers = [];

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
const menuToggle = document.getElementById('menuToggle');
const chatSidebar = document.getElementById('chatSidebar');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
setUsernameBtn.addEventListener('click', setUsername);
usernameInput.addEventListener('keypress', (e) => e.key === 'Enter' && setUsername());
newChatBtn.addEventListener('click', redirectToCreateChat);
menuToggle.addEventListener('click', toggleSidebar);
window.addEventListener('online', handleConnectionChange);
window.addEventListener('offline', handleConnectionChange);

// Inicialización de la aplicación
async function initApp() {
    // Cargar datos del usuario desde localStorage
    currentUser = localStorage.getItem('bszMessengerUser');
    
    // Configurar UI según estado del usuario
    if (currentUser) {
        await setupUserSession();
    } else {
        showNotification('Por favor, ingresa tu nombre para comenzar');
    }
    
    // Registrar Service Worker para PWA
    registerServiceWorker();
    
    // Cargar datos iniciales
    await loadInitialData();
    
    // Configurar estado de conexión
    updateConnectionStatus();
    
    // Procesar parámetros de URL
    processURLParams();
}

async function setupUserSession() {
    // Configurar UI
    usernameContainer.style.display = 'none';
    messageInput.disabled = false;
    sendButton.disabled = false;
    currentUserName.textContent = currentUser;
    
    // Registrar usuario en la API si está online
    if (isOnline) {
        await registerUser(currentUser);
    }
    
    // Agregar mensaje de sistema
    addSystemMessage(`${currentUser} se ha unido al chat`);
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registrado correctamente');
        } catch (error) {
            console.error('Error al registrar el Service Worker:', error);
        }
    }
}

async function loadInitialData() {
    try {
        // Cargar datos desde APIs si está online
        if (isOnline) {
            await Promise.all([
                loadUsersFromAPI(),
                loadChatsFromAPI(),
                loadMessagesFromAPI()
            ]);
        } else {
            // Cargar desde localStorage si está offline
            loadFromLocalStorage();
        }
        
        // Renderizar la interfaz
        renderChatList();
        renderMessages();
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showNotification('Error al cargar datos. Usando caché local');
        loadFromLocalStorage();
        renderMessages();
    }
}

async function loadUsersFromAPI() {
    try {
        const response = await fetch(USERS_API);
        const data = await response.json();
        allUsers = data.users || [];
        
        // Registrar usuario actual si no existe
        if (currentUser && !allUsers.includes(currentUser)) {
            await registerUser(currentUser);
            allUsers.push(currentUser);
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        throw error;
    }
}

async function registerUser(username) {
    try {
        const updatedUsers = {
            users: [...allUsers, username]
        };
        
        await fetch(USERS_API, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedUsers)
        });
        
        console.log(`Usuario ${username} registrado correctamente`);
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        throw error;
    }
}

async function loadChatsFromAPI() {
    try {
        const response = await fetch(CHATS_API);
        const apiChats = await response.json();
        
        apiChats.forEach(chat => {
            if (!chats[chat.id]) {
                chats[chat.id] = {
                    id: chat.id,
                    name: chat.name,
                    description: chat.description || '',
                    admin: chat.admin,
                    isPrivate: chat.isPrivate || false,
                    createdAt: chat.createdAt,
                    users: chat.users || [],
                    messages: []
                };
            }
        });
        
        saveToLocalStorage();
    } catch (error) {
        console.error('Error al cargar chats:', error);
        throw error;
    }
}

async function loadMessagesFromAPI() {
    try {
        const response = await fetch(MESSAGES_API);
        const apiMessages = await response.json();
        
        // Verificar si la respuesta es un array
        if (!Array.isArray(apiMessages)) {
            console.error('La API de mensajes no devolvió un array:', apiMessages);
            return;
        }
        
        apiMessages.forEach(msg => {
            const chatId = msg.chatId || 'general';
            
            // Crear chat si no existe
            if (!chats[chatId]) {
                chats[chatId] = {
                    id: chatId,
                    name: msg.chatName || `Chat ${chatId}`,
                    admin: msg.admin || 'system',
                    isPrivate: msg.isPrivate || false,
                    createdAt: msg.createdAt || new Date().toISOString(),
                    users: msg.users || [],
                    messages: []
                };
            }
            
            // Agregar mensaje si no existe
            if (!chats[chatId].messages.some(m => m.id === msg.id)) {
                chats[chatId].messages.push({
                    id: msg.id,
                    user: msg.user,
                    text: msg.text,
                    time: msg.time || new Date().toISOString()
                });
                
                // Agregar usuario al chat si no existe
                if (msg.user && !chats[chatId].users.includes(msg.user)) {
                    chats[chatId].users.push(msg.user);
                }
            }
        });
        
        saveToLocalStorage();
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        throw error;
    }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('bszMessengerData');
    if (savedData) {
        const { chats: savedChats, currentUser: savedUser, allUsers: savedAllUsers } = JSON.parse(savedData);
        if (savedChats) chats = savedChats;
        if (savedUser && !currentUser) currentUser = savedUser;
        if (savedAllUsers) allUsers = savedAllUsers;
    }
}

function saveToLocalStorage() {
    const dataToSave = {
        chats,
        currentUser,
        allUsers
    };
    localStorage.setItem('bszMessengerData', JSON.stringify(dataToSave));
}

function processURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatParam = urlParams.get('chat');
    
    if (chatParam && chats[chatParam]) {
        switchChat(chatParam);
    }
}

function redirectToCreateChat() {
    if (!currentUser) {
        showNotification('Debes ingresar tu nombre primero');
        return;
    }
    
    // Verificar si estamos en GitHub Pages (ruta relativa)
    const basePath = window.location.hostname.includes('github.io') ? '/mi-mensaje-pwa' : '';
    window.location.href = `${basePath}/creacionchat.html`;
}

// Funciones de renderizado
function renderChatList() {
    chatList.innerHTML = '';
    
    Object.values(chats).forEach(chat => {
        const lastMessage = chat.messages[chat.messages.length - 1];
        const isActive = chat.id === currentChat;
        const isPrivate = chat.isPrivate;
        
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${isActive ? 'active' : ''}`;
        chatItem.dataset.chat = chat.id;
        chatItem.innerHTML = `
            <div class="chat-name">
                ${chat.name}
                ${isPrivate ? ' <span class="private-badge">(Privado)</span>' : ''}
                ${chat.admin === currentUser ? ' <span class="admin-badge">(Admin)</span>' : ''}
            </div>
            <div class="chat-preview">
                ${lastMessage ? `${lastMessage.user}: ${lastMessage.text}` : 'No hay mensajes'}
            </div>
            <div class="chat-info">
                <span class="chat-users">${chat.users.length} usuarios</span>
                <span class="chat-date">${formatDate(chat.createdAt)}</span>
            </div>
        `;
        
        chatItem.addEventListener('click', () => switchChat(chat.id));
        chatList.appendChild(chatItem);
    });
}

function renderMessages() {
    if (!chats[currentChat]) return;
    
    chatContainer.innerHTML = '';
    
    // Mostrar información del chat
    const chatInfo = document.createElement('div');
    chatInfo.className = 'chat-header';
    chatInfo.innerHTML = `
        <h3>${chats[currentChat].name}</h3>
        <div class="chat-meta">
            <span>Creado por: ${chats[currentChat].admin}</span>
            <span>${chats[currentChat].users.length} usuarios</span>
            <span>${formatDate(chats[currentChat].createdAt)}</span>
        </div>
    `;
    chatContainer.appendChild(chatInfo);
    
    // Mostrar mensajes de bienvenida si no hay mensajes
    if (chats[currentChat].messages.length === 0) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="message left">
                <div class="username">Sistema</div>
                <div class="message-text">¡Bienvenido al ${chats[currentChat].name}!</div>
                <div class="message-time">Ahora</div>
            </div>
        `;
        chatContainer.appendChild(welcomeDiv);
    }
    
    // Mostrar todos los mensajes
    chats[currentChat].messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        const isCurrentUser = msg.user === currentUser;
        
        messageDiv.className = `message ${isCurrentUser ? 'right' : 'left'}`;
        messageDiv.innerHTML = `
            <div class="username">${msg.user} ${msg.user === chats[currentChat].admin ? '(Admin)' : ''}</div>
            <div class="message-text">${msg.text}</div>
            <div class="message-time">${formatTime(msg.time)}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
    });
    
    // Scroll al final
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Funciones de mensajería
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
    
    // Agregar mensaje localmente
    chats[currentChat].messages.push(newMessage);
    
    // Agregar usuario al chat si no existe
    if (!chats[currentChat].users.includes(currentUser)) {
        chats[currentChat].users.push(currentUser);
    }
    
    saveToLocalStorage();
    renderMessages();
    messageInput.value = '';
    
    // Enviar a la API si está online
    if (isOnline) {
        try {
            await saveMessageToAPI(newMessage);
            // Actualizar lista de chats para mostrar último mensaje
            renderChatList();
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            showNotification('Mensaje guardado localmente. Se enviará cuando haya conexión');
        }
    } else {
        showNotification('Mensaje guardado localmente. Se enviará cuando haya conexión');
    }
}

async function saveMessageToAPI(message) {
    const response = await fetch(MESSAGES_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
    });
    
    if (!response.ok) {
        throw new Error('Error al guardar mensaje en API');
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
    saveToLocalStorage();
    renderMessages();
}

// Funciones de chat
function switchChat(chatId) {
    if (!chats[chatId]) return;
    
    currentChat = chatId;
    renderChatList();
    renderMessages();
    
    // Actualizar URL sin recargar
    const url = new URL(window.location);
    url.searchParams.set('chat', chatId);
    window.history.pushState({}, '', url);
}

// Funciones de utilidad
function handleConnectionChange() {
    isOnline = navigator.onLine;
    updateConnectionStatus();
    
    if (isOnline) {
        showNotification('Conectado - Sincronizando mensajes...');
        syncDataWithAPI();
    } else {
        showNotification('Sin conexión - Modo offline');
    }
}

async function syncDataWithAPI() {
    try {
        await Promise.all([
            loadUsersFromAPI(),
            loadChatsFromAPI(),
            loadMessagesFromAPI()
        ]);
        
        renderChatList();
        renderMessages();
        showNotification('Datos sincronizados correctamente');
    } catch (error) {
        console.error('Error al sincronizar datos:', error);
        showNotification('Error al sincronizar datos');
    }
}

function updateConnectionStatus() {
    isOnline = navigator.onLine;
    userStatus.textContent = isOnline ? 'En línea' : 'Offline';
    userStatus.style.color = isOnline ? '#00ff00' : '#ff0000';
}

function toggleSidebar() {
    chatSidebar.classList.toggle('active');
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
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

// Función para establecer el nombre de usuario
function setUsername() {
    const username = usernameInput.value.trim();
    if (!username) return;
    
    // Validar nombre de usuario
    if (username.length < 3 || username.length > 20) {
        showNotification('El nombre debe tener entre 3 y 20 caracteres');
        return;
    }
    
    // Verificar si el usuario ya existe (solo si está online)
    if (isOnline && allUsers.includes(username)) {
        showNotification('Este nombre de usuario ya está en uso');
        return;
    }
    
    currentUser = username;
    localStorage.setItem('bszMessengerUser', username);
    setupUserSession();
    showNotification(`Bienvenido, ${username}!`);
    
    // Agregar a la lista de usuarios si no existe
    if (!allUsers.includes(username)) {
        allUsers.push(username);
        saveToLocalStorage();
    }
    
    // Registrar en API si está online
    if (isOnline) {
        registerUser(username).catch(error => {
            console.error('Error al registrar usuario:', error);
        });
    }
}

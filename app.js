// URLs de las APIs
const USERS_API = 'https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/User/1';
const CHATS_API = 'https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/Chats';
const MESSAGES_API = 'https://6878141b31d28a460e1d23cc.mockapi.io/68643bc188359a373e97e75c/UDataB/68643bc188359a373e97e75c/68643bc188359a373e97e75c/68643bc188359a373e97e75c/UserSinRed';

// Variables globales
let currentUser = null;
let currentChat = 'general';
let chats = {
    general: {
        id: 'general',
        name: 'Chat General',
        admin: 'system',
        messages: [],
        users: []
    }
};
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
const menuToggle = document.getElementById('menuToggle');
const chatSidebar = document.getElementById('chatSidebar');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
setUsernameBtn.addEventListener('click', setUsername);
usernameInput.addEventListener('keypress', (e) => e.key === 'Enter' && setUsername());
newChatBtn.addEventListener('click', () => window.location.href = 'creacionchat.html');
menuToggle.addEventListener('click', toggleSidebar);
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// Inicializar la aplicación
async function initApp() {
    // Cargar datos del usuario
    currentUser = localStorage.getItem('bszMessengerUser');
    
    if (currentUser) {
        await setupUserSession();
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
    
    // Cargar datos iniciales
    await loadInitialData();
    updateConnectionStatus();
}

async function setupUserSession() {
    usernameContainer.style.display = 'none';
    messageInput.disabled = false;
    sendButton.disabled = false;
    currentUserName.textContent = currentUser;
    userStatus.textContent = isOnline ? 'En línea' : 'Offline';
    
    // Registrar usuario en la API si está online
    if (isOnline) {
        await registerUser(currentUser);
    }
}

async function registerUser(username) {
    try {
        // Obtener datos actuales de usuarios
        const response = await fetch(USERS_API);
        const userData = await response.json();
        
        // Si el usuario no existe, agregarlo
        if (!userData.users.includes(username)) {
            const updatedUsers = {
                users: [...userData.users, username]
            };
            
            await fetch(USERS_API, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedUsers)
            });
        }
    } catch (error) {
        console.error('Error al registrar usuario:', error);
    }
}

async function loadInitialData() {
    try {
        // Cargar chats desde la API si está online
        if (isOnline) {
            const [chatsResponse, usersResponse] = await Promise.all([
                fetch(CHATS_API),
                fetch(USERS_API)
            ]);
            
            const apiChats = await chatsResponse.json();
            const apiUsers = await usersResponse.json();
            
            // Procesar chats de la API
            apiChats.forEach(chat => {
                if (!chats[chat.id]) {
                    chats[chat.id] = {
                        id: chat.id,
                        name: chat.name,
                        admin: chat.admin,
                        messages: [],
                        users: chat.users || []
                    };
                }
            });
            
            // Procesar usuarios de la API
            if (apiUsers.users && currentUser && !apiUsers.users.includes(currentUser)) {
                await registerUser(currentUser);
            }
        }
        
        // Cargar mensajes
        await loadMessages();
        renderChatList();
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showNotification('Error al cargar datos. Usando caché local');
        loadFromLocalStorage();
    }
}

async function loadMessages() {
    try {
        if (isOnline) {
            const response = await fetch(MESSAGES_API);
            const apiMessages = await response.json();
            
            apiMessages.forEach(msg => {
                const chatId = msg.chatId || 'general';
                
                if (!chats[chatId]) {
                    chats[chatId] = {
                        id: chatId,
                        name: msg.chatName || `Chat ${chatId}`,
                        admin: msg.admin || 'system',
                        messages: [],
                        users: msg.users || []
                    };
                }
                
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
        }
        
        renderMessages();
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        loadFromLocalStorage();
        renderMessages();
    }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('bszMessengerData');
    if (savedData) {
        const { chats: savedChats, currentUser: savedUser } = JSON.parse(savedData);
        if (savedChats) chats = savedChats;
        if (savedUser && !currentUser) currentUser = savedUser;
    }
}

function saveToLocalStorage() {
    const dataToSave = {
        chats,
        currentUser
    };
    localStorage.setItem('bszMessengerData', JSON.stringify(dataToSave));
}

// ... (resto de las funciones como renderMessages, sendMessage, etc. se mantienen similares pero actualizadas para usar la nueva estructura)

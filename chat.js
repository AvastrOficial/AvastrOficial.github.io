document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const chatNameInput = document.getElementById('chatName');
    const chatDescriptionInput = document.getElementById('chatDescription');
    const chatPrivacySelect = document.getElementById('chatPrivacy');
    const cancelButton = document.getElementById('cancelCreateChat');
    const confirmButton = document.getElementById('confirmCreateChat');
    const nameError = document.getElementById('nameError');
    
    // Obtener usuario actual
    const currentUser = localStorage.getItem('bszMessengerUser');
    if (!currentUser) {
        redirectToIndex();
        return;
    }

    // Cargar chats existentes
    let existingChats = [];
    loadExistingChats();

    // Event Listeners
    cancelButton.addEventListener('click', redirectToIndex);
    confirmButton.addEventListener('click', handleCreateChat);
    chatNameInput.addEventListener('input', clearNameError);

    // Funciones
    async function loadExistingChats() {
        try {
            const response = await fetch('https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/Chats');
            if (response.ok) {
                existingChats = await response.json();
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    function redirectToIndex() {
        window.location.href = getBasePath() + '/index.html';
    }

    async function handleCreateChat() {
        const chatName = chatNameInput.value.trim();
        const description = chatDescriptionInput.value.trim();
        const isPrivate = chatPrivacySelect.value === 'private';
        
        if (!validateChatName(chatName)) return;

        const newChat = {
            name: chatName,
            description,
            admin: currentUser,
            isPrivate,
            createdAt: new Date().toISOString(),
            users: [currentUser]
        };

        await createNewChat(newChat);
    }

    function validateChatName(name) {
        if (!name) {
            showError('El nombre del chat es requerido');
            return false;
        }
        
        if (existingChats.some(chat => chat.name.toLowerCase() === name.toLowerCase())) {
            showError('Ya existe un chat con ese nombre');
            return false;
        }
        
        return true;
    }

    function showError(message) {
        nameError.textContent = message;
        nameError.style.display = 'block';
    }

    function clearNameError() {
        nameError.style.display = 'none';
    }

    async function createNewChat(chatData) {
        try {
            setLoading(true);
            const response = await fetch('https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/Chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chatData)
            });
            
            if (response.ok) {
                const createdChat = await response.json();
                window.location.href = `${getBasePath()}/index.html?chat=${createdChat.id}`;
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Error al crear el chat. Por favor, intenta nuevamente.');
            setLoading(false);
        }
    }

    function setLoading(loading) {
        confirmButton.disabled = loading;
        confirmButton.textContent = loading ? 'Creando...' : 'Crear Chat';
    }

    function getBasePath() {
        return window.location.hostname.includes('github.io') ? '/mi-mensaje-pwa' : '';
    }
});

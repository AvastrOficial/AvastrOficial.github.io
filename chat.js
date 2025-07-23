document.addEventListener('DOMContentLoaded', async function() {
    const chatNameInput = document.getElementById('chatName');
    const chatDescriptionInput = document.getElementById('chatDescription');
    const chatPrivacySelect = document.getElementById('chatPrivacy');
    const cancelButton = document.getElementById('cancelCreateChat');
    const confirmButton = document.getElementById('confirmCreateChat');
    
    // Obtener usuario actual del cache
    const currentUser = localStorage.getItem('bszMessengerUser');
    
    if (!currentUser) {
        alert('Debes iniciar sesión primero');
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar chats existentes para validar nombres únicos
    let existingChats = [];
    try {
        const response = await fetch('https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/Chats');
        existingChats = await response.json();
    } catch (error) {
        console.error('Error al cargar chats:', error);
    }
    
    cancelButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    confirmButton.addEventListener('click', async () => {
        const chatName = chatNameInput.value.trim();
        const description = chatDescriptionInput.value.trim();
        const isPrivate = chatPrivacySelect.value === 'private';
        
        if (!chatName) {
            alert('El nombre del chat es requerido');
            return;
        }
        
        // Validar nombre único
        if (existingChats.some(chat => chat.name.toLowerCase() === chatName.toLowerCase())) {
            alert('Ya existe un chat con ese nombre');
            return;
        }
        
        const newChat = {
            id: `chat-${Date.now()}`,
            name: chatName,
            description: description,
            admin: currentUser,
            isPrivate: isPrivate,
            createdAt: new Date().toISOString(),
            users: [currentUser]
        };
        
        try {
            // Guardar en la API
            const response = await fetch('https://688172a166a7eb81224ae8f4.mockapi.io/Api/Bszapp/Chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newChat)
            });
            
            if (response.ok) {
                // Redirigir al chat recién creado
                window.location.href = `index.html?chat=${newChat.id}`;
            } else {
                throw new Error('Error al crear chat');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear el chat. Intenta nuevamente.');
        }
    });
});

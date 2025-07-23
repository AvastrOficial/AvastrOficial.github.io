const API_URL = "https://6878141b31d28a460e1d23cc.mockapi.io/68643bc188359a373e97e75c/UDataB/68643bc188359a373e97e75c/68643bc188359a373e97e75c/68643bc188359a373e97e75c/UserSinRed"; // Reemplaza con tu backend real

const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("msgInput");

async function fetchMessages() {
  const res = await fetch(API_URL);
  const messages = await res.json();
  chatBox.innerHTML = "";
  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message" + (msg.sender === "yo" ? "" : " received");
    div.textContent = msg.text;
    chatBox.appendChild(div);
  });
}

async function sendMessage(text) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender: "yo", text })
  });
  msgInput.value = "";
  await fetchMessages();
}

sendBtn.addEventListener("click", () => {
  const text = msgInput.value.trim();
  if (text) sendMessage(text);
});

setInterval(fetchMessages, 5000); // auto-actualiza cada 5s

// Soporte para Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service Worker registrado");
  });
}

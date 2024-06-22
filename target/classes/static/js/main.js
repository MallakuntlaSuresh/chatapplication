'use strict';

document.addEventListener('DOMContentLoaded', function() {
    const usernamePage = document.querySelector('#username-page');
    const chatPage = document.querySelector('#chat-page');
    const usernameForm = document.querySelector('#usernameForm');
    const messageForm = document.querySelector('#messageForm');
    const messageInput = document.querySelector('#message');
    const messageArea = document.querySelector('#messageArea');
    const connectingElement = document.querySelector('.connecting');

    let stompClient = null;
    let username = null;

    const colors = [
        '#2196F3', '#32c787', '#00BCD4', '#ff5652',
        '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
    ];

    function connect(event) {
        username = document.querySelector('#name').value.trim();

        if (username) {
            usernamePage.classList.add('hidden');
            chatPage.classList.remove('hidden');

            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);

            stompClient.connect({}, onConnected, onError);
        }
        event.preventDefault();
    }

    function onConnected() {
        // Subscribe to the Public Topic
        stompClient.subscribe('/topic/public', onMessageReceived);

        // Tell your username to the server
        stompClient.send("/app/chat.addUser",
            {},
            JSON.stringify({ sender: username, type: 'JOIN' })
        );

        connectingElement.classList.add('hidden');
    }

    function onError(error) {
        connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
        connectingElement.style.color = 'red';
    }

    function sendMessage(event) {
        const messageContent = messageInput.value.trim();
        if (messageContent && stompClient) {
            const chatMessage = {
                sender: username,
                content: messageInput.value,
                type: 'CHAT'
            };
            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
            messageInput.value = '';
        }
        event.preventDefault();
    }

    function onMessageReceived(payload) {
        const message = JSON.parse(payload.body);

        let messageElement = document.createElement('li');
        messageElement.setAttribute('data-id', message.originalMessageId);

        if (message.type === 'JOIN' || message.type === 'LEAVE') {
            messageElement.classList.add('event-message');
            message.content = message.sender + (message.type === 'JOIN' ? ' joined!' : ' left!');
        } else {
            messageElement.classList.add('chat-message');

            let avatarElement = document.createElement('i');
            let avatarText = document.createTextNode(message.sender[0]);
            avatarElement.appendChild(avatarText);
            avatarElement.style.backgroundColor = getAvatarColor(message.sender);

            messageElement.appendChild(avatarElement);

            let usernameElement = document.createElement('span');
            let usernameText = document.createTextNode(message.sender);
            usernameElement.appendChild(usernameText);
            messageElement.appendChild(usernameElement);

            let textElement = document.createElement('p');
            let messageText = document.createTextNode(message.content);
            textElement.appendChild(messageText);
            messageElement.appendChild(textElement);

            // Add edit button if message sender is the current user
            if (message.sender === username) {
                let editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('edit-button');
                editButton.onclick = function () {
                    showEditInput(message);
                };
                messageElement.appendChild(editButton);
            }
        }

        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    function showEditInput(message) {
        let messageElement = document.querySelector(`li[data-id="${message.originalMessageId}"]`);
        let textElement = messageElement.querySelector('p');
        let currentText = textElement.textContent;

        // Hide text element and create input for editing
        textElement.classList.add('hidden');
        let editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = currentText.trim();
        editInput.classList.add('edit-input');

        // Create save button for edited message
        let saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.classList.add('save-button');
        saveButton.onclick = function () {
            sendEditedMessage(message, editInput.value);
        };

        // Append input and save button to message element
        messageElement.appendChild(editInput);
        messageElement.appendChild(saveButton);
    }

    function sendEditedMessage(originalMessage, newContent) {
        if (newContent && stompClient) {
            const chatMessage = {
                sender: username,
                content: newContent,
                type: 'EDIT',
                originalMessageId: originalMessage.originalMessageId
            };
            stompClient.send("/app/chat.editMessage", {}, JSON.stringify(chatMessage));
        }
    }

    function getAvatarColor(messageSender) {
        let hash = 0;
        for (let i = 0; i < messageSender.length; i++) {
            hash = 31 * hash + messageSender.charCodeAt(i);
        }
        let index = Math.abs(hash % colors.length);
        return colors[index];
    }

    usernameForm.addEventListener('submit', connect, true);
    messageForm.addEventListener('submit', sendMessage, true);
});

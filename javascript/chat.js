const CONFIG = {
    BACKEND_URL: 'https://api.fertilityforlife.com'
    //BACKEND_URL: 'http://127.0.0.1:5000'
};

// Function to toggle the chat popup
function toggleChatPopup() {
    const chatPopup = document.getElementById('chat-popup');
    if (chatPopup.style.display === 'none' || chatPopup.style.display === '') {
        chatPopup.style.display = 'flex';
        chatPopup.classList.add('expand-animation');
    } else {
        chatPopup.style.display = 'none';
        chatPopup.classList.remove('expand-animation');
    }
}

// Ensure the chat popup is hidden by default on page load and add event listener to the chat bubble
window.onload = function() {
    const chatPopup = document.getElementById('chat-popup');
    chatPopup.style.display = 'none';

    const chatBubble = document.getElementById('chat-bubble');
    chatBubble.addEventListener('click', toggleChatPopup);
}

// Function to load the chat HTML
async function loadChat() {
    console.log('Loading chat HTML...');
    fetch('chat.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            document.body.insertAdjacentHTML('beforeend', data);
            console.log('Chat HTML loaded');
            const chatBubble = document.getElementById('chat-bubble');
            if (chatBubble) {
                chatBubble.addEventListener('click', toggleChatPopup);
            } else {
                console.error('Chat bubble element not found');
            }
        })
        .catch(error => {
            console.error('Error loading chat HTML:', error);
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500); // Adjust the timeout as needed
        });
}

// Add a single DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Call loadChat when the page loads
        await loadChat();

        // Add event listener to the send button to make button disabled when input is empty
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('send-button');
        chatBody = document.getElementById('chat-box');
        const chatLogo = document.getElementById('chat-logo');

        userInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                sendButton.disabled = true;
            } else {
                sendButton.disabled = false;
            }
        });

        
        // Create a MutationObserver to monitor changes in the chat body
        const observer = new MutationObserver(function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    // Check if the chat body has any content
                    if (chatBody.innerHTML.trim() !== '') {
                        chatLogo.style.display = 'none';
                    } else {
                        chatLogo.style.display = 'block';
                    }
                }
            }
        });

        // Start observing the chat body for changes
        observer.observe(chatBody, { childList: true, subtree: true, characterData: true });
    } catch (error) {
        console.error('Error loading chat HTML:', error);
    }
});

async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    document.getElementById('userInput').value = '';  // Clear the input field
    document.getElementById('chat-box').innerHTML += `<div class="user-message"><div class="user-message-wrapper"><p>${userInput}</p></div></div>`;
    const thread_id = localStorage.getItem('thread_id');  // Retrieve the thread ID from local storage
    console.log(thread_id);
    const requestBody = { message: userInput };
    if (thread_id) {
        console.log('Thread ID exists');
        requestBody.thread_id = thread_id;  // Include the thread ID  in the request body if it exists
    }

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    document.getElementById('chat-box').innerHTML += `<div class="assistant-message"><img src="/images/seagul.png"><p>${data.response}</p></div>`;
    localStorage.setItem('thread_id', data.thread_id);  // Store the thread ID in local storage
    if (data.thread_id) {
        // Add event listener to the send button to make button disabled when input is empty
        const endChatButton = document.getElementById('end-chat');
        endChatButton.disabled = false;
    }
}

async function endChat() {
    const thread_id = localStorage.getItem('thread_id');  // Retrieve the thread ID from local storage
    const requestBody = {};
    if (thread_id) {
        requestBody.thread_id = thread_id;  // Include the thread ID if it exists
        localStorage.removeItem('thread_id');  // Remove the thread ID from local storage
    }
    document.getElementById('chat-box').innerHTML = '';  // Clear the chat box
    document.getElementById('end-chat').disabled = true;  // Disable the end chat button
    //send a request to backend to end the chat.
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/endChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    console.log(await response.json());
    console.log('Chat ended and thread ID cleared');
}

let unloadConfirmed = false;

window.addEventListener('beforeunload', function(event) {
    const thread_id = localStorage.getItem('thread_id');  // Retrieve the thread ID from local storage
    if (thread_id) {
        unloadConfirmed = true;

        // Display a confirmation dialog to delay the unload
        event.returnValue = 'Are you sure you want to leave? You will lose your chat.';
        return 'Are you sure you want to leave? You will lose your chat.';
    }
});
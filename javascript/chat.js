const CONFIG = {
    BACKEND_URL: 'https://api.fertilityforlife.com'
    //BACKEND_URL: 'http://127.0.0.1:5000'
};

let isPopupOpen = false; // Flag to track the state of the popup
let isToggling = false; // Flag to prevent multiple toggles

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

// Function to toggle the chat popup
function toggleChatPopup() {
    if (isToggling) return; // Prevent multiple toggles
    isToggling = true;

    const chatPopup = document.getElementById('chat-popup');
    const backgroundOverlay = document.getElementById('background-overlay');
    const body = document.body;
    const userInput = document.getElementById('userInput');

    if (!chatPopup || !backgroundOverlay) {
        console.error('Chat popup or background overlay element not found');
        isToggling = false;
        return;
    }

    if (!isPopupOpen) {
        // Open the chat popup
        chatPopup.style.display = 'flex';
        chatPopup.classList.add('expand-animation');
        chatPopup.classList.remove('collapse-animation');
        backgroundOverlay.style.opacity = '1';
        backgroundOverlay.style.pointerEvents = 'auto';
        chatPopup.style.pointerEvents = 'auto';  // Enable pointer events on the chat popup
        body.classList.add('no-scroll');
        isPopupOpen = true;
    } else {
        // Close the chat popup
        chatPopup.classList.remove('expand-animation');
        chatPopup.classList.add('collapse-animation');
        //chatPopup.style.display = 'none';
        backgroundOverlay.style.opacity = '0';
        backgroundOverlay.style.pointerEvents = 'none';
        chatPopup.style.pointerEvents = 'none';  // Disable pointer events on the chat popup
        body.classList.remove('no-scroll');
        userInput.blur();
        isPopupOpen = false;
        setTimeout(() => {
            chatPopup.style.display = 'none';
            isPopupOpen = false;
        }, 300); // Match the duration of the CSS transition
    }

    // Allow toggling again after a short delay
    setTimeout(() => {
        isToggling = false;
    }, 300); // Adjust the delay as needed
}

function setChatType (chosenValue) {
    let chat_type = chosenValue;
    const userInput = document.getElementById('userInput');
    if (chat_type === 'none') {
        userInput.disabled = true;
        userInput.placeholder = 'Select a chat type to enable the chat';
    }
    else {
        userInput.disabled = false;
        userInput.placeholder = 'Type your message here...';
        document.getElementById(`chat-type-${chat_type}`).style.border = 'solid #007bff 4px'; // Highlight the selected chat type
        userInput.focus();
    }
    return chat_type;
}

// Ensure the chat popup is hidden by default on page load and add event listener to the chat bubble
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Call loadChat when the page loads
        await loadChat();
        let chat_type = setChatType('none');

        // Add event listener to the send button to make button disabled when input is empty
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('send-button');
        const chatBody = document.getElementById('chat-box');
        const chatLogo = document.getElementById('chat-logo');

        userInput.addEventListener('input', function() {
            sendButton.disabled = this.value.trim() === '';
        });

        // Create a MutationObserver to monitor changes in the chat body
        const observer = new MutationObserver(function(mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    // Check if the chat body has any content
                    chatLogo.style.display = chatBody.innerHTML.trim() !== '' ? 'none' : 'block';
                }
            }
        });

        observer.observe(chatBody, { childList: true, characterData: true, subtree: true });

        // Ensure the chat popup and background overlay are hidden by default
        const chatPopup = document.getElementById('chat-popup');
        const backgroundOverlay = document.getElementById('background-overlay');
        if (chatPopup) {
            chatPopup.style.display = 'none';
            chatPopup.style.pointerEvents = 'none';  // Disable pointer events on the chat popup
        } else {
            console.error('Chat popup element not found');
        }

        if (backgroundOverlay) {
            backgroundOverlay.style.opacity = '0';
            backgroundOverlay.style.pointerEvents = 'none';  // Disable pointer events on the background overlay
        } else {
            console.error('Background overlay element not found');
        }

        // Add event listener to the background overlay
        if (backgroundOverlay) {
            backgroundOverlay.addEventListener('click', function(event) {
                // Check if the click is on the overlay and not on the popup itself
                if (event.target === backgroundOverlay) {
                    toggleChatPopup();
                }
            });
        }

        // Prevent event propagation on the chat popup
        if (chatPopup) {
            chatPopup.addEventListener('click', function(event) {
                event.stopPropagation();
            });
        }
    } catch (error) {
        console.error('Error during DOMContentLoaded:', error);
    }
});


async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (userInput.trim() === '') return;  // Do not send empty messages
    document.getElementById('chat-type').style.display = 'none'; 
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
    document.getElementById('chat-type').style.display = 'grid';  // Show the chat type selection
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
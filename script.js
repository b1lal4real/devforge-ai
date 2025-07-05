const API_KEY = 'your-api-here';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const stopButton = document.getElementById('stopButton');

let isTyping = false;
let typingInterval = null;
let currentAssistantMessage = null;
let fullResponse = '';
let responseIndex = 0;

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

// Send message on Enter (but allow Shift+Enter for new lines)
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendButton.addEventListener('click', sendMessage);
stopButton.addEventListener('click', stopTyping);

function createMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Format code blocks
    if (!isUser && content.includes('```')) {
        const parts = content.split('```');
        parts.forEach((part, index) => {
            if (index % 2 === 0) {
                // Regular text
                const textNode = document.createTextNode(part);
                contentDiv.appendChild(textNode);
            } else {
                // Code block
                const codeBlock = document.createElement('div');
                codeBlock.className = 'code-block';
                
                const firstLineBreak = part.indexOf('\n');
                let language = '';
                let codeContent = part;
                
                if (firstLineBreak !== -1) {
                    language = part.substring(0, firstLineBreak).trim();
                    codeContent = part.substring(firstLineBreak + 1);
                }
                
                const header = document.createElement('div');
                header.className = 'code-header';
                
                const langSpan = document.createElement('span');
                langSpan.className = 'code-lang';
                langSpan.textContent = language || 'code';
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.textContent = 'Copy';
                copyBtn.onclick = function() {
                    navigator.clipboard.writeText(codeContent).then(() => {
                        copyBtn.textContent = 'Copied!';
                        copyBtn.classList.add('copied');
                        setTimeout(() => {
                            copyBtn.textContent = 'Copy';
                            copyBtn.classList.remove('copied');
                        }, 2000);
                    });
                };
                
                header.appendChild(langSpan);
                header.appendChild(copyBtn);
                
                const codeDiv = document.createElement('div');
                codeDiv.className = 'code-content';
                
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.className = language ? `language-${language}` : '';
                code.textContent = codeContent;
                
                pre.appendChild(code);
                codeDiv.appendChild(pre);
                
                codeBlock.appendChild(header);
                codeBlock.appendChild(codeDiv);
                contentDiv.appendChild(codeBlock);
            }
        });
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    return messageDiv;
}

function createTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = 'typing-indicator';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        dotsDiv.appendChild(dot);
    }
    
    typingDiv.appendChild(dotsDiv);
    messageDiv.appendChild(typingDiv);
    
    return messageDiv;
}

function removeWelcomeMessage() {
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function stopTyping() {
    if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
    }
    
    if (currentAssistantMessage) {
        // Add blinking cursor to indicate stopped typing
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'live-typing';
        cursorSpan.textContent = fullResponse.substring(0, responseIndex);
        currentAssistantMessage.querySelector('.message-content').innerHTML = '';
        currentAssistantMessage.querySelector('.message-content').appendChild(cursorSpan);
        
        // Format code blocks if needed
        if (fullResponse.includes('```')) {
            const formattedMessage = createMessage(fullResponse.substring(0, responseIndex), false);
            currentAssistantMessage.replaceWith(formattedMessage);
            currentAssistantMessage = formattedMessage;
            
            // Highlight code blocks
            setTimeout(() => {
                document.querySelectorAll('.code-content code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }, 100);
        }
    }
    
    // Reset state
    isTyping = false;
    sendButton.disabled = false;
    stopButton.style.display = 'none';
    fullResponse = '';
    responseIndex = 0;
    currentAssistantMessage = null;
}

function simulateTyping(response) {
    fullResponse = response;
    responseIndex = 0;
    
    // Create a temporary element for typing
    const tempDiv = document.createElement('div');
    tempDiv.className = 'message assistant';
    tempDiv.innerHTML = '<div class="message-content"><span class="live-typing"></span></div>';
    messagesContainer.appendChild(tempDiv);
    currentAssistantMessage = tempDiv;
    
    // Show stop button
    stopButton.style.display = 'flex';
    
    // Start typing effect
    typingInterval = setInterval(() => {
        if (responseIndex < fullResponse.length) {
            const currentText = fullResponse.substring(0, responseIndex + 1);
            const typingSpan = currentAssistantMessage.querySelector('.live-typing');
            typingSpan.textContent = currentText;
            responseIndex++;
            scrollToBottom();
        } else {
            // Typing complete
            clearInterval(typingInterval);
            typingInterval = null;
            
            // Format code blocks if needed
            if (fullResponse.includes('```')) {
                const formattedMessage = createMessage(fullResponse, false);
                currentAssistantMessage.replaceWith(formattedMessage);
                currentAssistantMessage = formattedMessage;
                
                // Highlight code blocks
                setTimeout(() => {
                    document.querySelectorAll('.code-content code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }, 100);
            }
            
            // Reset state
            isTyping = false;
            sendButton.disabled = false;
            stopButton.style.display = 'none';
            fullResponse = '';
            responseIndex = 0;
            currentAssistantMessage = null;
        }
    }, 20); // Typing speed (milliseconds per character)
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;

    // Remove welcome message if it exists
    removeWelcomeMessage();

    // Add user message
    const userMessage = createMessage(message, true);
    messagesContainer.appendChild(userMessage);

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Show typing indicator
    const typingIndicator = createTypingIndicator();
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();

    // Disable sending while processing
    isTyping = true;
    sendButton.disabled = true;

    try {
        // Create a concise prompt that emphasizes action
        const concisePrompt = `Provide a concise, action-oriented response. 
        Focus on delivering working solutions with minimal explanation. 
        When code is requested, provide it immediately in a code block with appropriate syntax highlighting. 
        Only provide explanations when explicitly asked. 
        User request: ${message}`;

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: concisePrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        // Remove typing indicator
        typingIndicator.remove();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            let aiResponse = data.candidates[0].content.parts[0].text;
            
            // Remove unnecessary pleasantries
            aiResponse = aiResponse.replace(/^(Sure|Okay|Alright|Great|Yes|Of course)[,!.:]?\s*/i, '');
            
            // Add action-first indicator for solutions
            if (aiResponse.includes('```')) {
                aiResponse = `✅ <span class="action-first">Solution:</span>\n${aiResponse}`;
            }
            
            // Simulate typing effect
            simulateTyping(aiResponse);
        } else {
            throw new Error('Invalid response format');
        }

    } catch (error) {
        console.error('Error:', error);
        
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }

        // Show error message
        const errorMessage = createMessage('❌ Sorry, I encountered an error. Please try again.', false);
        errorMessage.querySelector('.message-content').style.background = '#da3633';
        messagesContainer.appendChild(errorMessage);
        
        // Reset state
        isTyping = false;
        sendButton.disabled = false;
        stopButton.style.display = 'none';
        scrollToBottom();
    }
}

// Focus on input when page loads
window.addEventListener('load', () => {
    messageInput.focus();
    // Adjust messages container height
    messagesContainer.style.height = `calc(100% - ${document.querySelector('.header').offsetHeight}px)`;
});

// Adjust on window resize
window.addEventListener('resize', () => {
    messagesContainer.style.height = `calc(100% - ${document.querySelector('.header').offsetHeight}px)`;
});

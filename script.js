// Legal Document Simplifier Chatbot
class LegalDocumentSimplifier {
    constructor() {
    this.apiKey = 'AIzaSyDVxE8knZh7JFxareGI6Ul4JX4u57_2YQE';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.systemPrompt = `You are a legal document simplifier. Your task is to rewrite legal documents in plain, easy-to-understand language for non-lawyers.

Rules:
- Always be clear, concise, and accurate
- Use simple words instead of complex legal terms
- Break down complex sentences into shorter ones
- Explain any remaining legal terms in parentheses
- Maintain the original meaning and intent
- Do not give legal advice or opinions
- Focus only on simplifying the text provided
- If the text is not legal content, politely explain that you only simplify legal documents`;

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupTheme();
        this.autoResizeTextarea();
        this.loadMessageHistory();

        // Initial greeting
        this.addMessage("Hello! I'm your Legal Document Simplifier. Paste a legal document or section in the box below, and I'll rewrite it in plain, easy-to-understand language. I don't provide legal advice—just clear explanations of legal text.", false);
    }

    bindEvents() {
        // DOM Elements
        this.elements = {
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            chatMessages: document.getElementById('chat-messages'),
            typingIndicator: document.getElementById('typing-indicator'),
            welcomeMessage: document.getElementById('welcome-message'),
            themeToggle: document.getElementById('theme-toggle'),
            clearChat: document.getElementById('clear-chat'),
            charCounter: document.getElementById('char-counter')
        };

        // Event Listeners
        this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.elements.messageInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        this.elements.messageInput.addEventListener('input', () => this.handleInputChange());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.clearChat.addEventListener('click', () => this.clearChat());
        
    // File input and upload button binding
    this.elements.fileUploadBtn = document.getElementById('file-upload-btn');
    this.elements.fileInput = document.getElementById('file-input');
    // When upload button clicked, open file dialog
    this.elements.fileUploadBtn.addEventListener('click', () => this.elements.fileInput.click());
    // Handle file selection
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.elements.themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
    }

    handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    }

    handleInputChange() {
        const text = this.elements.messageInput.value.trim();
        const charCount = text.length;

        // Update character counter
        this.elements.charCounter.textContent = `${charCount}/10000`;

        // Enable/disable send button
        this.elements.sendButton.disabled = charCount === 0;

        // Change counter color when approaching limit
        if (charCount > 9000) {
            this.elements.charCounter.style.color = 'var(--error-color)';
        } else if (charCount > 8000) {
            this.elements.charCounter.style.color = 'var(--warning-color)';
        } else {
            this.elements.charCounter.style.color = 'var(--text-muted)';
        }
    }

    async handleSendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, true);

        // Clear input
        this.elements.messageInput.value = '';
        this.handleInputChange();
        this.elements.messageInput.style.height = 'auto';

        // Hide welcome message
        if (this.elements.welcomeMessage) {
            this.elements.welcomeMessage.style.display = 'none';
        }

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to API
            const response = await this.sendToAPI(message);
            this.hideTypingIndicator();
            this.addMessage(response, false);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage(`Sorry, I encountered an error: ${error.message}. Please try again.`, false);
        }

        // Save to localStorage
        this.saveMessageHistory();
    }

    async sendToAPI(message) {
        if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
            throw new Error('Please set your API key in the script.js file');
        }

        const requestBody = {
            contents: [{
                parts: [{
                    text: `${this.systemPrompt}\n\nPlease simplify this legal text:\n\n${message}`
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid API response format');
        }
    }

    addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Format the text (handle line breaks, etc.)
        const formattedText = this.formatMessage(text);
        contentDiv.innerHTML = formattedText;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        this.elements.chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Convert line breaks to paragraphs
        return text.split('\n\n').map(paragraph => {
            if (paragraph.trim()) {
                return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
            }
            return '';
        }).join('');
    }

    showTypingIndicator() {
        this.elements.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }, 100);
    }

    clearChat() {
        this.elements.chatMessages.innerHTML = '';
        if (this.elements.welcomeMessage) {
            this.elements.welcomeMessage.style.display = 'block';
        }
        localStorage.removeItem('chatHistory');
    }

    saveMessageHistory() {
        const messages = [];
        const messageElements = this.elements.chatMessages.querySelectorAll('.message');

        messageElements.forEach(msg => {
            const isUser = msg.classList.contains('user-message');
            const text = msg.querySelector('.message-content').textContent;
            messages.push({ text, isUser });
        });

        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }

    loadMessageHistory() {
        const history = localStorage.getItem('chatHistory');
        if (history) {
            const messages = JSON.parse(history);
            messages.forEach(msg => {
                this.addMessage(msg.text, msg.isUser);
            });
        }
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;
        // Hide welcome message
        if (this.elements.welcomeMessage) {
            this.elements.welcomeMessage.style.display = 'none';
        }
        // Show typing indicator
        this.showTypingIndicator();
        try {
            for (let file of files) {
                let content;
                if (file.type.startsWith('image/')) {
                    content = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                } else {
                    content = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsText(file);
                    });
                }
                // Add user message for upload
                this.addMessage(`Uploaded file: ${file.name}`, true);
                // Send file content to API
                const response = await this.sendToAPI(content);
                this.addMessage(response, false);
            }
        } catch (error) {
            this.addMessage(`Sorry, I encountered an error: ${error.message}. Please try again.`, false);
        }
        this.hideTypingIndicator();
        this.saveMessageHistory();
        // Reset file input
        this.elements.fileInput.value = '';
    }
}

// Initialize the chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LegalDocumentSimplifier();
});
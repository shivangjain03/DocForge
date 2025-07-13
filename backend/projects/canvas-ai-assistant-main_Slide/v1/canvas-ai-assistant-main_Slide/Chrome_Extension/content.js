// Content script for Canvas AI Assistant
console.log('Canvas AI Assistant content script loaded');

// Function to get current page content
function getCurrentPageContent() {
    const content = {
        url: window.location.href,
        title: document.title,
        visibleContent: '',
        pageType: determinePageType(),
        specificContent: {}
    };

    // Get the main content area - SFU Canvas specific
    const mainContent = document.querySelector('#content-wrapper') || 
                       document.querySelector('#content') ||
                       document.querySelector('.ic-Layout-contentMain');
    
    if (mainContent) {
        // Get all text content recursively
        content.visibleContent = getAllTextContent(mainContent);
        console.log('Main content found:', content.visibleContent.substring(0, 100) + '...');
    } else {
        console.log('No main content found');
    }

    // Get specific content based on page type
    switch (content.pageType) {
        case 'syllabus':
            content.specificContent = getSyllabusContent();
            break;
        case 'module':
            content.specificContent = getModuleContent();
            break;
        case 'assignment':
            content.specificContent = getAssignmentContent();
            break;
        case 'discussion':
            content.specificContent = getDiscussionContent();
            break;
    }

    // Log the content for debugging
    console.log('Page type:', content.pageType);
    console.log('Specific content:', content.specificContent);

    return content;
}

// Helper function to get all text content recursively
function getAllTextContent(element) {
    let text = '';
    if (element.nodeType === Node.TEXT_NODE) {
        text += element.textContent.trim() + ' ';
    } else {
        for (const child of element.childNodes) {
            text += getAllTextContent(child);
        }
    }
    return text.trim();
}

// Function to determine the type of page
function determinePageType() {
    const url = window.location.href;
    const path = window.location.pathname;
    
    if (url.includes('/syllabus') || path.includes('/syllabus')) return 'syllabus';
    if (url.includes('/modules') || path.includes('/modules')) return 'module';
    if (url.includes('/assignments') || path.includes('/assignments')) return 'assignment';
    if (url.includes('/discussion_topics') || path.includes('/discussion_topics')) return 'discussion';
    
    // Check for specific SFU Canvas elements
    if (document.querySelector('.syllabus')) return 'syllabus';
    if (document.querySelector('.context_module')) return 'module';
    if (document.querySelector('.assignment')) return 'assignment';
    if (document.querySelector('.discussion')) return 'discussion';
    
    return 'unknown';
}

// Function to get syllabus content - SFU Canvas specific
function getSyllabusContent() {
    // Grab the entire page section that holds the syllabus
    const mainWrapper = document.querySelector('#content-wrapper') || document.querySelector('#content') || document.querySelector('.ic-Layout-contentMain');

    if (!mainWrapper) {
        console.log('No main content area found');
        return { content: '', html: '' };
    }

    // Extract all visible content from the main area
    const content = getAllTextContent(mainWrapper);
    const html = mainWrapper.innerHTML;

    console.log('[✓] Full syllabus content extracted');
    console.log('[Debug] Syllabus preview:', content.substring(0, 300));
    return { content, html };
}


// Function to get module content - SFU Canvas specific
function getModuleContent() {
    const moduleContent = {
        title: document.querySelector('.module-title')?.innerText || 
               document.querySelector('.context_module_title')?.innerText || 
               document.querySelector('.ic-Layout-contentMain h1')?.innerText || '',
        items: []
    };

    // Try different selectors for SFU Canvas modules
    const moduleItems = document.querySelectorAll('.context_module_item') || 
                       document.querySelectorAll('.module-item') ||
                       document.querySelectorAll('.ic-Layout-contentMain .item');
    
    moduleItems.forEach(item => {
        const title = item.querySelector('.title')?.innerText || 
                     item.querySelector('.item_name')?.innerText ||
                     item.querySelector('.ig-title')?.innerText || '';
        
        const type = item.querySelector('.type_icon')?.getAttribute('title') || 
                    item.querySelector('.item_type')?.innerText ||
                    item.querySelector('.ig-type')?.innerText || '';
        
        const url = item.querySelector('a')?.href || '';

        if (title || type || url) {
            moduleContent.items.push({ title, type, url });
        }
    });

    console.log('Module content found:', moduleContent);
    return moduleContent;
}

// Function to get assignment content - SFU Canvas specific
function getAssignmentContent() {
    const assignment = {
        title: document.querySelector('.assignment-title')?.innerText || 
               document.querySelector('.title')?.innerText || 
               document.querySelector('.ic-Layout-contentMain h1')?.innerText || '',
        description: document.querySelector('.description')?.innerText || 
                    document.querySelector('.user_content')?.innerText || 
                    document.querySelector('.ic-Layout-contentMain .description')?.innerText || '',
        dueDate: document.querySelector('.date_text')?.innerText || 
                 document.querySelector('.due_date')?.innerText || 
                 document.querySelector('.ic-Layout-contentMain .date')?.innerText || '',
        points: document.querySelector('.points_possible')?.innerText || 
                document.querySelector('.points')?.innerText || 
                document.querySelector('.ic-Layout-contentMain .points')?.innerText || ''
    };

    console.log('Assignment content found:', assignment);
    return assignment;
}

// Function to get discussion content - SFU Canvas specific
function getDiscussionContent() {
    const discussion = {
        title: document.querySelector('.discussion-title')?.innerText || 
               document.querySelector('.title')?.innerText || 
               document.querySelector('.ic-Layout-contentMain h1')?.innerText || '',
        content: document.querySelector('.message')?.innerText || 
                 document.querySelector('.discussion_entry')?.innerText || 
                 document.querySelector('.ic-Layout-contentMain .entry')?.innerText || '',
        replies: []
    };

    // Try different selectors for SFU Canvas discussions
    const replies = document.querySelectorAll('.discussion-entry') || 
                   document.querySelectorAll('.discussion_entry') ||
                   document.querySelectorAll('.ic-Layout-contentMain .entry');
    
    replies.forEach(reply => {
        const author = reply.querySelector('.author')?.innerText || 
                      reply.querySelector('.user_name')?.innerText || 
                      reply.querySelector('.entry-user')?.innerText || '';
        
        const content = reply.querySelector('.message')?.innerText || 
                       reply.querySelector('.entry_content')?.innerText || 
                       reply.querySelector('.entry-content')?.innerText || '';
        
        const date = reply.querySelector('.date')?.innerText || 
                    reply.querySelector('.posted_at')?.innerText || 
                    reply.querySelector('.entry-date')?.innerText || '';

        if (author || content || date) {
            discussion.replies.push({ author, content, date });
        }
    });

    console.log('Discussion content found:', discussion);
    return discussion;
}



// Create and inject the floating chat interface
function createChatInterface() {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'canvas-ai-chat';
    chatContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        height: 600px;
        background: #ffffff;
        border: 2px solid #8a1538;
        border-radius: 12px;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        font-family: 'Lato', 'Helvetica Neue', sans-serif;
        display: flex;
        flex-direction: column;
        z-index: 10000;
        `;


    // Chat header
    // Chat header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 15px;
        background: #4A90E2;
        color: white;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    // Header title
    const title = document.createElement('span');
    title.textContent = 'Canvas AI Assistant';
    header.appendChild(title);

    // Minimize button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.id = 'minimize-chat';
    minimizeBtn.textContent = '-';
    minimizeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        line-height: 20px;
    `;
    header.appendChild(minimizeBtn);

    chatContainer.appendChild(header);

    // Now safe to add event listener
    let isMinimized = false;
    minimizeBtn.addEventListener('click', () => {
        const messagesArea = document.getElementById('chat-messages');
        const inputArea = document.querySelector('#canvas-ai-chat > div:last-child');
        if (isMinimized) {
            messagesArea.style.display = 'block';
            inputArea.style.display = 'flex';
            chatContainer.style.height = '600px';
        } else {
            messagesArea.style.display = 'none';
            inputArea.style.display = 'none';
            chatContainer.style.height = 'auto';
        }
        isMinimized = !isMinimized;
    });


    
    // Create model label
    const modelLabel = document.createElement('div');
    modelLabel.innerText = 'Model: GPT-4o';
    modelLabel.style.cssText = `
    font-size: 12px;
    padding: 6px 15px;
    color: white;
    background-color: #a91e2c; /* SFU Canvas red */
    border-top: 1px solid #ccc;
    text-align: left;
    `;
    chatContainer.appendChild(modelLabel);




    // Chat messages area
    const messagesArea = document.createElement('div');
    messagesArea.id = 'chat-messages';
    messagesArea.style.cssText = `
        flex-grow: 1;
        padding: 15px;
        overflow-y: auto;
        background: #f5f5f5;
    `;
    chatContainer.appendChild(messagesArea);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
        padding: 15px;
        border-top: 1px solid #ddd;
        display: flex;
        gap: 10px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ask about the current page...';
    input.style.cssText = `
        flex-grow: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    `;
    
    const sendButton = document.createElement('button');
    sendButton.innerHTML = 'Send';
    sendButton.style.cssText = `
        padding: 8px 15px;
        background: #4A90E2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

    const fileSelect = document.createElement('select');
    fileSelect.id = 'file-select';
    fileSelect.style.cssText = `
        width: 100%;
        margin-bottom: 10px;
        padding: 6px;
        border-radius: 4px;
        border: 1px solid #ccc;
    `;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Choose a file (optional) --';
    fileSelect.appendChild(defaultOption);

    // Put file selector before chat input
    inputArea.prepend(fileSelect);


    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    chatContainer.appendChild(inputArea);

    // Add to page
    document.body.appendChild(chatContainer);
    fetchCanvasFiles("56122", "MX2kWV64Y9a3QNWuzvkccRDYc6kDRJErPQNvmvxrKXe4n3n4t7M2Jy3PEfnYkGUN");  // Replace with real values


    // Add event listeners
    

    // Handle sending messages
    function sendMessage() {
        const message = input.value.trim();
        if (message) {
            // Get current page content
            const pageContent = getCurrentPageContent();
            
            // Add user message to chat
            addMessageToChat('user', message);
            
            // Send to background script for processing
            const selectedFile = document.getElementById('file-select').value;

            chrome.runtime.sendMessage({
                action: 'processMessage',
                data: {
                    message,
                    pageContent,
                    file_url: selectedFile || null  // send null if no file selected
                }
            }, response => {
                if (response && response.reply) {
                    addMessageToChat('assistant', response.reply);
                } else if (response && response.error) {
                    addMessageToChat('assistant', `Error: ${response.error}`);
                }
            });

            input.value = '';
        }
    }

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function replaceSelectedText(replacement) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const newNode = document.createTextNode(replacement);
    range.insertNode(newNode);

    // Deselect after replacement
    selection.removeAllRanges();
}

// Function to add message to chat
function addMessageToChat(sender, message) {
    const messagesArea = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 80%;
        ${sender === 'user' ? 
            'background: #4A90E2; color: white; margin-left: auto;' : 
            'background: #e9ecef; color: black; margin-right: auto;'}
    `;
    messageDiv.textContent = message;
    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Initialize the chat interface when the page loads
if (document.readyState === 'complete') {
    createChatInterface();
} else {
    window.addEventListener('load', createChatInterface);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        const content = getCurrentPageContent();
        console.log('Sending page content:', content);
        sendResponse(content);
    }
    return true;
});

async function fetchCanvasFiles(courseId, token) {
  try {
    const response = await fetch(`http://localhost:5001/canvas/files?course_id=${courseId}&token=${token}`);
    const data = await response.json();

    const select = document.getElementById("file-select");
    select.innerHTML = '<option value="">-- Choose a file --</option>';

    data.files.forEach(file => {
      const option = document.createElement("option");
      option.value = file.url;
      option.textContent = file.display_name;
      select.appendChild(option);
    });
    console.log("Fetching files from backend...");

  } catch (error) {
    console.error("Error loading files:", error);
  }
}


// Floating edit button
const editButton = document.createElement('button');
editButton.innerText = '✏️ Edit with AI';
editButton.style.cssText = `
    position: absolute;
    display: none;
    z-index: 10001;
    padding: 6px 12px;
    background-color: #4A90E2;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
`;
document.body.appendChild(editButton);

// Show button on text selection
document.addEventListener('mouseup', (e) => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
        editButton.style.top = `${window.scrollY + rect.top - 40}px`;
        editButton.style.left = `${window.scrollX + rect.left}px`;
        editButton.style.display = 'block';
    } else {
        editButton.style.display = 'none';
    }
});

// On edit button click → fill chat input
editButton.addEventListener('click', () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length === 0) return;

    const userPrompt = prompt(`How should I edit this?\n\n"${selectedText}"`, "Make it more concise");

    if (!userPrompt) return;

    // Send message to background script with prompt + selected text
    chrome.runtime.sendMessage({
        action: 'editSelectedText',
        data: {
            text: selectedText,
            instruction: userPrompt
        }
    }, (response) => {
        if (response && response.editedText) {
            // Replace the text on the page
            replaceSelectedText(response.editedText);
        } else {
            alert("Sorry, something went wrong.");
        }
    });

    editButton.style.display = 'none';
});
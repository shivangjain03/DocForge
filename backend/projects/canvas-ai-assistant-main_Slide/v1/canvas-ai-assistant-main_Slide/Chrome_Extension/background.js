// Background script for Canvas AI Assistant
console.log('Background script loaded');

// Backend URL configuration
const BACKEND_URL = 'http://localhost:5001';

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in background:', request);

    if (request.action === 'processMessage') {
        console.log('Processing message with content:', request.data);
        processMessageWithContext(request.data)
            .then(response => {
                console.log('Sending response back to content script:', response);
                sendResponse(response);
            })
            .catch(error => {
                console.error('Error processing message:', error);
                sendResponse({ error: error.message });
            });
        return true; // Required for async sendResponse
    }

    // 🆕 Handle inline edit request
    if (request.action === 'editSelectedText') {
        const { text, instruction } = request.data;

        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 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', // Replace with your key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'You are a helpful editor. Only return the edited version of the input text.' },
                    { role: 'user', content: `Original: "${text}"\nInstruction: ${instruction}` }
                ],
                temperature: 0.7
            })
        })
        .then(res => res.json())
        .then(data => {
            const editedText = data.choices?.[0]?.message?.content?.trim();
            sendResponse({ editedText });
        })
        .catch(err => {
            console.error('Error editing text:', err);
            sendResponse({ error: 'API request failed' });
        });

        return true; // Required for async response
    }
});


async function processMessageWithContext(data) {
    try {
        const { message, pageContent, file_url } = data;
        console.log('Processing message:', message);
        console.log('Page content:', pageContent);
        console.log('File URL (if any):', file_url);

        // ✅ If a file is selected, use the /canvas/use-file endpoint
        if (file_url) {
            const response = await fetch(`${BACKEND_URL}/canvas/use-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_url: file_url,
                    token: 'YOUR_CANVAS_TOKEN_HERE',  // Replace or retrieve dynamically
                    prompt: message
                })
            });

            if (!response.ok) throw new Error(`HTTP error from file endpoint! status: ${response.status}`);
            const result = await response.json();
            return { reply: result.reply || result.error };
        }

        // 🔍 Otherwise: attempt to answer from visible page content
        const lowerPrompt = message.toLowerCase();
        const triggerPhrases = ["find on page", "on this page", "see above", "from the syllabus", "visible content"];
        const shouldSearchLocally = triggerPhrases.some(phrase => lowerPrompt.includes(phrase));

        if (shouldSearchLocally && pageContent?.visibleContent) {
            const strippedPrompt = lowerPrompt
                .replace("find on page", "")
                .replace("on this page", "")
                .replace("see above", "")
                .trim();

            const foundLine = pageContent.visibleContent
                .split('\n')
                .find(line => line.toLowerCase().includes(strippedPrompt));

            if (foundLine) {
                return { reply: `🔍 I found this on the page:\n\n"${foundLine}"` };
            }
        }

        // 🧠 Otherwise: use page context
        let context = '';
        if (pageContent.pageType === 'syllabus') {
            context = `Current page: Syllabus\nContent: ${pageContent.specificContent.content}`;
        } else if (pageContent.pageType === 'module') {
            context = `Current page: Module - ${pageContent.specificContent.title}\nContent: ${JSON.stringify(pageContent.specificContent.items)}`;
        } else if (pageContent.pageType === 'assignment') {
            context = `Current page: Assignment - ${pageContent.specificContent.title}\nDescription: ${pageContent.specificContent.description}`;
        } else {
            context = `Current page: ${pageContent.title}\nContent: ${pageContent.visibleContent}`;
        }

        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful AI assistant for Canvas. Use the content below to answer accurately.\n\n${context}`
                    },
                    { role: 'user', content: message }
                ]
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        return { reply: result.reply };
    } catch (error) {
        console.error('Error in processMessageWithContext:', error);
        return { error: error.message };
    }
}




// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab?.url?.includes('instructure.com')) {
        console.log('Canvas page loaded:', tab.url);
    }
});

// Function to get Canvas API token
async function getCanvasToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['canvasToken'], (result) => {
            resolve(result.canvasToken);
        });
    });
}

// Function to fetch content from Canvas API
async function fetchFromCanvasAPI(endpoint, courseId) {
    const token = await getCanvasToken();
    if (!token) {
        throw new Error('Canvas API token not found');
    }

    const response = await fetch(`https://canvas.instructure.com/api/v1/courses/${courseId}/${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch from Canvas API');
    }

    return await response.json();
} 
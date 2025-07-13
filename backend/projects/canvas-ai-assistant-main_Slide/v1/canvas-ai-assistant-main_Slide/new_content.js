// Canvas AI Assistant - Fixed Content Script
console.log("Canvas AI Assistant content script loaded")

// Global state management
let currentRoute = "start"
let chatContainer = null
let isMinimized = false

// Function to get current page content (keeping your existing logic)
function getCurrentPageContent() {
  const content = {
    url: window.location.href,
    title: document.title,
    visibleContent: "",
    pageType: determinePageType(),
    specificContent: {},
  }

  const mainContent =
    document.querySelector("#content-wrapper") ||
    document.querySelector("#content") ||
    document.querySelector(".ic-Layout-contentMain")

  if (mainContent) {
    content.visibleContent = getAllTextContent(mainContent)
    console.log("Main content found:", content.visibleContent.substring(0, 100) + "...")
  }

  switch (content.pageType) {
    case "syllabus":
      content.specificContent = getSyllabusContent()
      break
    case "module":
      content.specificContent = getModuleContent()
      break
    case "assignment":
      content.specificContent = getAssignmentContent()
      break
    case "discussion":
      content.specificContent = getDiscussionContent()
      break
  }

  return content
}

function getAllTextContent(element) {
  let text = ""
  if (element.nodeType === Node.TEXT_NODE) {
    text += element.textContent.trim() + " "
  } else {
    for (const child of element.childNodes) {
      text += getAllTextContent(child)
    }
  }
  return text.trim()
}

function determinePageType() {
  const url = window.location.href
  const path = window.location.pathname

  if (url.includes("/syllabus") || path.includes("/syllabus")) return "syllabus"
  if (url.includes("/modules") || path.includes("/modules")) return "module"
  if (url.includes("/assignments") || path.includes("/assignments")) return "assignment"
  if (url.includes("/discussion_topics") || path.includes("/discussion_topics")) return "discussion"

  if (document.querySelector(".syllabus")) return "syllabus"
  if (document.querySelector(".context_module")) return "module"
  if (document.querySelector(".assignment")) return "assignment"
  if (document.querySelector(".discussion")) return "discussion"

  return "unknown"
}

function getSyllabusContent() {
  const mainWrapper =
    document.querySelector("#content-wrapper") ||
    document.querySelector("#content") ||
    document.querySelector(".ic-Layout-contentMain")

  if (!mainWrapper) return { content: "", html: "" }

  const content = getAllTextContent(mainWrapper)
  const html = mainWrapper.innerHTML

  return { content, html }
}

function getModuleContent() {
  const moduleContent = {
    title:
      document.querySelector(".module-title")?.innerText ||
      document.querySelector(".context_module_title")?.innerText ||
      document.querySelector(".ic-Layout-contentMain h1")?.innerText ||
      "",
    items: [],
  }

  const moduleItems =
    document.querySelectorAll(".context_module_item") ||
    document.querySelectorAll(".module-item") ||
    document.querySelectorAll(".ic-Layout-contentMain .item")

  moduleItems.forEach((item) => {
    const title =
      item.querySelector(".title")?.innerText ||
      item.querySelector(".item_name")?.innerText ||
      item.querySelector(".ig-title")?.innerText ||
      ""
    const type =
      item.querySelector(".type_icon")?.getAttribute("title") ||
      item.querySelector(".item_type")?.innerText ||
      item.querySelector(".ig-type")?.innerText ||
      ""
    const url = item.querySelector("a")?.href || ""

    if (title || type || url) {
      moduleContent.items.push({ title, type, url })
    }
  })

  return moduleContent
}

function getAssignmentContent() {
  return {
    title:
      document.querySelector(".assignment-title")?.innerText ||
      document.querySelector(".title")?.innerText ||
      document.querySelector(".ic-Layout-contentMain h1")?.innerText ||
      "",
    description:
      document.querySelector(".description")?.innerText ||
      document.querySelector(".user_content")?.innerText ||
      document.querySelector(".ic-Layout-contentMain .description")?.innerText ||
      "",
    dueDate:
      document.querySelector(".date_text")?.innerText ||
      document.querySelector(".due_date")?.innerText ||
      document.querySelector(".ic-Layout-contentMain .date")?.innerText ||
      "",
    points:
      document.querySelector(".points_possible")?.innerText ||
      document.querySelector(".points")?.innerText ||
      document.querySelector(".ic-Layout-contentMain .points")?.innerText ||
      "",
  }
}

function getDiscussionContent() {
  const discussion = {
    title:
      document.querySelector(".discussion-title")?.innerText ||
      document.querySelector(".title")?.innerText ||
      document.querySelector(".ic-Layout-contentMain h1")?.innerText ||
      "",
    content:
      document.querySelector(".message")?.innerText ||
      document.querySelector(".discussion_entry")?.innerText ||
      document.querySelector(".ic-Layout-contentMain .entry")?.innerText ||
      "",
    replies: [],
  }

  const replies =
    document.querySelectorAll(".discussion-entry") ||
    document.querySelectorAll(".discussion_entry") ||
    document.querySelectorAll(".ic-Layout-contentMain .entry")

  replies.forEach((reply) => {
    const author =
      reply.querySelector(".author")?.innerText ||
      reply.querySelector(".user_name")?.innerText ||
      reply.querySelector(".entry-user")?.innerText ||
      ""
    const content =
      reply.querySelector(".message")?.innerText ||
      reply.querySelector(".entry_content")?.innerText ||
      reply.querySelector(".entry-content")?.innerText ||
      ""
    const date =
      reply.querySelector(".date")?.innerText ||
      reply.querySelector(".posted_at")?.innerText ||
      reply.querySelector(".entry-date")?.innerText ||
      ""

    if (author || content || date) {
      discussion.replies.push({ author, content, date })
    }
  })

  return discussion
}

// Enhanced Chat Interface with Routing
function createChatInterface() {
  // Inject enhanced styles
  const styles = document.createElement("style")
  styles.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .canvas-ai-chat {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 420px;
            height: 680px;
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8);
            display: flex;
            flex-direction: column;
            z-index: 10000;
            backdrop-filter: blur(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }
        
        .canvas-ai-chat.minimized {
            height: 70px;
        }
        
        .chat-header {
            padding: 20px 24px 16px;
            background: linear-gradient(135deg, #8B1538 0%, #A91E2C 100%);
            color: white;
            border-radius: 20px 20px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            overflow: hidden;
        }
        
        .chat-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
            pointer-events: none;
        }
        
        .chat-title {
            font-weight: 600;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .chat-title::before {
            content: '🎓';
            font-size: 18px;
        }
        
        .chat-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .control-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }
        
        .control-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }
        
        .model-indicator {
            padding: 8px 16px;
            background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
            color: #e2e8f0;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid rgba(226, 232, 240, 0.1);
        }
        
        .model-indicator::before {
            content: '⚡';
            font-size: 14px;
        }
        
        .chat-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .start-screen {
            padding: 32px 24px;
            text-align: center;
            background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 24px;
        }
        
        .start-screen h2 {
            color: #1e293b;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .start-screen p {
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .feature-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .feature-card:hover {
            border-color: #8B1538;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px -8px rgba(139, 21, 56, 0.2);
        }
        
        .feature-card .icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .feature-card .title {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .feature-card .desc {
            font-size: 12px;
            color: #64748b;
        }
        
        .start-chat-btn {
            background: linear-gradient(135deg, #8B1538 0%, #A91E2C 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .start-chat-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px -8px rgba(139, 21, 56, 0.4);
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 3px;
        }
        
        .message {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.5;
            position: relative;
            animation: messageSlideIn 0.3s ease-out;
            white-space: pre-wrap;
        }
        
        @keyframes messageSlideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.user {
            background: linear-gradient(135deg, #8B1538 0%, #A91E2C 100%);
            color: white;
            margin-left: auto;
            border-bottom-right-radius: 6px;
        }
        
        .message.assistant {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            color: #334155;
            margin-right: auto;
            border-bottom-left-radius: 6px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .message.typing {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            color: #64748b;
            margin-right: auto;
            border-bottom-left-radius: 6px;
            border: 1px solid rgba(226, 232, 240, 0.5);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dot {
            width: 6px;
            height: 6px;
            background: #64748b;
            border-radius: 50%;
            animation: typingDot 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typingDot {
            0%, 80%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .chat-input-area {
            padding: 20px;
            border-top: 1px solid rgba(226, 232, 240, 0.5);
            background: linear-gradient(to top, #ffffff 0%, #f8fafc 100%);
            border-radius: 0 0 20px 20px;
        }
        
        .file-selector {
            width: 100%;
            margin-bottom: 12px;
            padding: 10px 12px;
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 12px;
            background: white;
            font-size: 13px;
            color: #475569;
            transition: all 0.2s ease;
        }
        
        .file-selector:focus {
            outline: none;
            border-color: #8B1538;
            box-shadow: 0 0 0 3px rgba(139, 21, 56, 0.1);
        }
        
        .input-container {
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 16px;
            background: white;
            font-size: 14px;
            color: #334155;
            resize: none;
            min-height: 44px;
            max-height: 120px;
            transition: all 0.2s ease;
            font-family: inherit;
        }
        
        .chat-input:focus {
            outline: none;
            border-color: #8B1538;
            box-shadow: 0 0 0 3px rgba(139, 21, 56, 0.1);
        }
        
        .send-button {
            padding: 12px 16px;
            background: linear-gradient(135deg, #8B1538 0%, #A91E2C 100%);
            color: white;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 80px;
            justify-content: center;
        }
        
        .send-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px -8px rgba(139, 21, 56, 0.4);
        }
        
        .send-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .back-button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .back-button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .hidden {
            display: none !important;
        }
    `
  document.head.appendChild(styles)

  // Create main chat container
  chatContainer = document.createElement("div")
  chatContainer.className = "canvas-ai-chat"
  chatContainer.id = "canvas-ai-chat"

  // Chat header
  const header = document.createElement("div")
  header.className = "chat-header"

  const title = document.createElement("div")
  title.className = "chat-title"
  title.textContent = "SFU Canvas AI"

  const controls = document.createElement("div")
  controls.className = "chat-controls"

  const backBtn = document.createElement("button")
  backBtn.className = "back-button hidden"
  backBtn.id = "back-btn"
  backBtn.textContent = "← Back"

  const minimizeBtn = document.createElement("button")
  minimizeBtn.className = "control-btn"
  minimizeBtn.id = "minimize-chat"
  minimizeBtn.textContent = "−"
  minimizeBtn.title = "Minimize"

  controls.appendChild(backBtn)
  controls.appendChild(minimizeBtn)
  header.appendChild(title)
  header.appendChild(controls)
  chatContainer.appendChild(header)

  // Model indicator
  const modelIndicator = document.createElement("div")
  modelIndicator.className = "model-indicator"
  modelIndicator.textContent = "GPT-4o"
  chatContainer.appendChild(modelIndicator)

  // Chat content area
  const chatContent = document.createElement("div")
  chatContent.className = "chat-content"
  chatContent.id = "chat-content"
  chatContainer.appendChild(chatContent)

  document.body.appendChild(chatContainer)

  // Initialize with start screen
  showStartScreen()

  // Event listeners
  minimizeBtn.addEventListener("click", toggleMinimize)
  backBtn.addEventListener("click", () => showStartScreen())
}

function showStartScreen() {
  currentRoute = "start"
  const chatContent = document.getElementById("chat-content")
  const backBtn = document.getElementById("back-btn")

  backBtn.classList.add("hidden")

  chatContent.innerHTML = `
        <div class="start-screen">
            <div>
                <h2>Welcome to SFU Canvas AI! 🎓</h2>
                <p>Your intelligent study companion for Canvas courses. Get help with assignments, generate slides, create quizzes, and more.</p>
            </div>
            
            <div class="feature-grid">
                <div class="feature-card" data-feature="chat">
                    <div class="icon">💬</div>
                    <div class="title">Smart Chat</div>
                    <div class="desc">Ask questions about course content</div>
                </div>
                <div class="feature-card" data-feature="slides">
                    <div class="icon">📊</div>
                    <div class="title">Generate Slides</div>
                    <div class="desc">Create presentations from content</div>
                </div>
                <div class="feature-card" data-feature="quiz">
                    <div class="icon">📝</div>
                    <div class="title">Make Quizzes</div>
                    <div class="desc">Generate practice questions</div>
                </div>
                <div class="feature-card" data-feature="summary">
                    <div class="icon">📋</div>
                    <div class="title">Summarize</div>
                    <div class="desc">Get key points from materials</div>
                </div>
            </div>
            
            <button class="start-chat-btn" id="start-chat-btn">
                💬 Start Chatting
            </button>
        </div>
    `

  // Add event listeners for feature cards
  document.querySelectorAll(".feature-card").forEach((card) => {
    card.addEventListener("click", () => {
      const feature = card.dataset.feature
      startFeature(feature)
    })
  })

  document.getElementById("start-chat-btn").addEventListener("click", () => {
    showChatScreen()
  })
}

function startFeature(feature) {
  showChatScreen()
  const input = document.getElementById("chat-input")

  switch (feature) {
    case "slides":
      input.value = "Generate slides from this page content"
      break
    case "quiz":
      input.value = "Create a quiz based on this page"
      break
    case "summary":
      input.value = "Summarize the key points from this page"
      break
    default:
      input.value = ""
  }

  if (input.value) {
    setTimeout(() => sendMessage(), 500)
  }
}

function showChatScreen() {
  currentRoute = "chat"
  const chatContent = document.getElementById("chat-content")
  const backBtn = document.getElementById("back-btn")

  backBtn.classList.remove("hidden")

  chatContent.innerHTML = `
        <div class="chat-messages" id="chat-messages">
            <div class="message assistant">
                👋 Hi! I'm your SFU Canvas AI assistant. I can help you with course content, generate slides, create quizzes, and answer questions about the current page.
            </div>
        </div>
        
        <div class="chat-input-area">
            <select class="file-selector" id="file-select">
                <option value="">📎 Choose a file (optional)</option>
            </select>
            <div class="input-container">
                <textarea class="chat-input" id="chat-input" placeholder="Ask me anything about this page..." rows="1"></textarea>
                <button class="send-button" id="send-button">✈️ Send</button>
            </div>
        </div>
    `

  // Load Canvas files
  fetchCanvasFiles("56122", "MX2kWV64Y9a3QNWuzvkccRDYc6kDRJErPQNvmvxrKXe4n3n4t7M2Jy3PEfnYkGUN")

  // Set up chat functionality
  setupChatListeners()
}

function setupChatListeners() {
  const input = document.getElementById("chat-input")
  const sendButton = document.getElementById("send-button")

  // Auto-resize textarea
  input.addEventListener("input", function () {
    this.style.height = "auto"
    this.style.height = Math.min(this.scrollHeight, 120) + "px"
  })

  // Send message handlers
  sendButton.addEventListener("click", sendMessage)
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })
}

function sendMessage() {
  const input = document.getElementById("chat-input")
  const sendButton = document.getElementById("send-button")
  const fileSelect = document.getElementById("file-select")
  const message = input.value.trim()

  if (!message) return

  const pageContent = getCurrentPageContent()
  addMessageToChat("user", message)
  showTypingIndicator()

  sendButton.disabled = true
  sendButton.innerHTML = "⏳ Sending..."

  const selectedFile = fileSelect.value

  // Send to background script for processing
  window.chrome.runtime.sendMessage(
    {
      action: "processMessage",
      data: {
        message,
        pageContent,
        file_url: selectedFile || null,
      },
    },
    (response) => {
      hideTypingIndicator()
      sendButton.disabled = false
      sendButton.innerHTML = "✈️ Send"

      if (response && response.reply) {
        addMessageToChat("assistant", response.reply)
      } else if (response && response.error) {
        addMessageToChat("assistant", `❌ Error: ${response.error}`)
      } else {
        addMessageToChat("assistant", "❌ No response received. Please check if the backend is running.")
      }
    },
  )

  input.value = ""
  input.style.height = "auto"
}

function addMessageToChat(sender, message) {
  const messagesArea = document.getElementById("chat-messages")
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${sender}`
  messageDiv.textContent = message
  messagesArea.appendChild(messageDiv)
  messagesArea.scrollTop = messagesArea.scrollHeight
}

function showTypingIndicator() {
  const messagesArea = document.getElementById("chat-messages")
  const typingDiv = document.createElement("div")
  typingDiv.className = "message typing"
  typingDiv.id = "typing-indicator"
  typingDiv.innerHTML = `
        AI is thinking...
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `
  messagesArea.appendChild(typingDiv)
  messagesArea.scrollTop = messagesArea.scrollHeight
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator")
  if (typingIndicator) {
    typingIndicator.remove()
  }
}

function toggleMinimize() {
  const minimizeBtn = document.getElementById("minimize-chat")
  chatContainer.classList.toggle("minimized")
  isMinimized = !isMinimized
  minimizeBtn.textContent = isMinimized ? "+" : "−"
  minimizeBtn.title = isMinimized ? "Expand" : "Minimize"
}

async function fetchCanvasFiles(courseId, token) {
  try {
    const response = await fetch(`http://localhost:5001/canvas/files?course_id=${courseId}&token=${token}`)
    const data = await response.json()
    const select = document.getElementById("file-select")

    if (select) {
      select.innerHTML = '<option value="">📎 Choose a file (optional)</option>'

      data.files.forEach((file) => {
        const option = document.createElement("option")
        option.value = file.url
        option.textContent = `📄 ${file.display_name}`
        select.appendChild(option)
      })
    }

    console.log("Files loaded successfully")
  } catch (error) {
    console.error("Error loading files:", error)
  }
}

// Text selection and editing functionality
function replaceSelectedText(replacement) {
  const selection = window.getSelection()
  if (!selection.rangeCount) return

  const range = selection.getRangeAt(0)
  range.deleteContents()
  const newNode = document.createTextNode(replacement)
  range.insertNode(newNode)
  selection.removeAllRanges()
}

// Enhanced floating edit button
const editButton = document.createElement("button")
editButton.innerHTML = "✨ Edit with AI"
editButton.style.cssText = `
    position: absolute;
    display: none;
    z-index: 10001;
    padding: 8px 12px;
    background: linear-gradient(135deg, #8B1538 0%, #A91E2C 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
`
document.body.appendChild(editButton)

document.addEventListener("mouseup", (e) => {
  const selectedText = window.getSelection().toString().trim()
  if (selectedText.length > 0) {
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect()
    editButton.style.top = `${window.scrollY + rect.top - 50}px`
    editButton.style.left = `${window.scrollX + rect.left}px`
    editButton.style.display = "block"
  } else {
    editButton.style.display = "none"
  }
})

editButton.addEventListener("click", () => {
  const selectedText = window.getSelection().toString().trim()
  if (!selectedText.length) return

  const userPrompt = prompt(`How should I edit this text?\n\n"${selectedText}"`, "Make it more concise and clear")
  if (!userPrompt) return

  window.chrome.runtime.sendMessage(
    {
      action: "editSelectedText",
      data: {
        text: selectedText,
        instruction: userPrompt,
      },
    },
    (response) => {
      if (response && response.editedText) {
        replaceSelectedText(response.editedText)
      } else {
        alert("Sorry, something went wrong with the edit request.")
      }
    },
  )

  editButton.style.display = "none"
})

// Initialize the interface
if (document.readyState === "complete") {
  createChatInterface()
} else {
  window.addEventListener("load", createChatInterface)
}

// Message listener
window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const content = getCurrentPageContent()
    console.log("Sending page content:", content)
    sendResponse(content)
  }
  return true
})

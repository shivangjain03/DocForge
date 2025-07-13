// Background script for Canvas AI Assistant - Fixed for existing backend
console.log("SFU Canvas AI Assistant background script loaded")

const BACKEND_URL = "http://localhost:5001"
const chrome = window.chrome // Declare the chrome variable

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request)

  if (request.action === "processMessage") {
    processMessageWithContext(request.data)
      .then((response) => {
        console.log("Sending response:", response)
        sendResponse(response)
      })
      .catch((error) => {
        console.error("Error processing message:", error)
        sendResponse({ error: error.message })
      })
    return true
  }

  if (request.action === "editSelectedText") {
    const { text, instruction } = request.data

    if (!text || !instruction) {
      sendResponse({ error: "Missing text or instruction" })
      return true
    }

    // Use hardcoded API key for now (you can change this to use storage later)
    const apiKey =
      "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"

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful editor. Return only the edited version of the text.",
          },
          {
            role: "user",
            content: `Original: "${text}"\nInstruction: ${instruction}`,
          },
        ],
        temperature: 0.7,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const editedText = data.choices?.[0]?.message?.content?.trim()
        sendResponse({ editedText })
      })
      .catch((err) => {
        console.error("Edit error:", err)
        sendResponse({ error: "Edit failed" })
      })

    return true
  }
})

async function processMessageWithContext(data) {
  try {
    const { message, pageContent, file_url } = data
    console.log("Processing message:", message)
    console.log("Page content:", pageContent)
    console.log("File URL:", file_url)

    // Handle file-based requests
    if (file_url) {
      console.log("Sending file request to backend...")
      const response = await fetch(`${BACKEND_URL}/canvas/use-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: file_url,
          prompt: message,
          token: "MX2kWV64Y9a3QNWuzvkccRDYc6kDRJErPQNvmvxrKXe4n3n4t7M2Jy3PEfnYkGUN", // Your Canvas token
        }),
      })

      if (!response.ok) {
        throw new Error(`File processing failed: ${response.status}`)
      }

      const result = await response.json()
      return { reply: result.reply || result.error }
    }

    // Build context from page content for your backend's expected format
    let contextContent = ""

    if (pageContent.pageType === "syllabus") {
      contextContent = pageContent.specificContent.content || pageContent.visibleContent
    } else if (pageContent.pageType === "module") {
      const moduleInfo = pageContent.specificContent
      contextContent = `Module: ${moduleInfo.title}\nItems: ${JSON.stringify(moduleInfo.items)}`
    } else if (pageContent.pageType === "assignment") {
      const assignment = pageContent.specificContent
      contextContent = `Assignment: ${assignment.title}\nDescription: ${assignment.description}\nDue Date: ${assignment.dueDate}\nPoints: ${assignment.points}`
    } else if (pageContent.pageType === "discussion") {
      const discussion = pageContent.specificContent
      contextContent = `Discussion: ${discussion.title}\nContent: ${discussion.content}`
    } else {
      contextContent = pageContent.visibleContent || pageContent.title
    }

    // Format messages exactly as your backend expects
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI assistant for Canvas. Use the following context to provide specific and relevant answers.
        
        Context:
        ${contextContent}`,
      },
      {
        role: "user",
        content: message,
      },
    ]

    console.log("Sending to backend with messages:", messages)

    // Send to your existing backend
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend error response:", errorText)
      throw new Error(`Backend error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Backend response:", result)
    return { reply: result.reply }
  } catch (error) {
    console.error("Processing error:", error)
    return { error: `Failed to process message: ${error.message}` }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("SFU Canvas AI Assistant installed")
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab?.url?.includes("instructure.com")) {
    console.log("Canvas page loaded:", tab.url)
  }
})

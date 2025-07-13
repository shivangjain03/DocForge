from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import requests
import json
from canvas_api import list_files
from bs4 import BeautifulSoup
import tempfile
from google.oauth2 import service_account
from googleapiclient.discovery import build


import fitz  # this is pymupdf



app = Flask(__name__)
CORS(app, origins="*", allow_headers="*", methods=["GET", "POST", "OPTIONS"])

client = OpenAI(api_key="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")

# Canvas API configuration
CANVAS_API_URL = "https://canvas.instructure.com/api/v1"
CANVAS_API_TOKEN = "uhBEChVBxtHAXfJ7EknveAknrrHBuQMan9CUWCE2xE4BBcQEBzzByGtFwFyKcaw4"

def get_canvas_content(course_id, content_type):
    headers = {
        "Authorization": f"Bearer {CANVAS_API_TOKEN}"
    }
    
    if content_type == "syllabus":
        url = f"{CANVAS_API_URL}/courses/{course_id}/syllabus"
    elif content_type == "modules":
        url = f"{CANVAS_API_URL}/courses/{course_id}/modules"
    else:
        return None
    
    response = requests.get(url, headers=headers)
    return response.json() if response.status_code == 200 else None

def generate_quiz_from_content(content, num_questions=5):
    prompt = f"""Based on the following content, generate a quiz with {num_questions} questions.
    The content is from a Canvas page. Please create relevant questions that test understanding of the material.
    Format the response as JSON with the following structure:
    {{
        "questions": [
            {{
                "question": "question text",
                "options": ["option1", "option2", "option3", "option4"],
                "correct_answer": "correct option",
                "explanation": "brief explanation of why this is correct"
            }}
        ]
    }}
    
    Content to generate quiz from:
    {content}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"error": str(e)}

def generate_slides_from_content(content, num_slides=12):
    prompt = f"""You are a professional teaching assistant helping a university professor prepare concise, high-quality slides.
The content below is from a course material file. Your job is to distill this into exactly {num_slides} slides, each focusing on one key concept.

**Guidelines:**
- First slide should be an starting slide with the course title and an overview.
- Use professional academic tone suitable for professors.
- Avoid redundant or vague phrases.
- Focus only on core topics relevant to the course material.
- It should be suitable for a university-level audience.
- Each slide should be vvery informative and should be filled with relevant information.
- Dont leave the slides empty.
- Slide content shouldnt be that concise neither too verbose.
- Use concise slide titles (max 8 words).
- Use bullet points in slide content (no long paragraphs).
- Give very appropriate slide content from the content and do not make up content.
- Only use the content provided, do not invent or add any information.
- Provide 1-2 short speaker notes summarizing the slide's takeaway.
- The second last slide should be a conclusion slide summarizing the key points.
- The last slide should be a Q&A slide with a prompt for questions.


**Format your response as strict JSON with this structure:**
{{
    "slides": [
        {{
            "title": "short slide title",
            "content": "main points in bullet form",
            "notes": "speaker notes summary"
        }},
        ...
    ]
}}

**Content to generate slides from:**
{content}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        response_text = response.choices[0].message.content.strip()
        print("[DEBUG] Raw GPT response:", response_text)

        # 🔵 Remove Markdown code fences if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1].strip()

        # 🔵 Remove a leading 'json' keyword if present
        if response_text.lower().startswith("json"):
            response_text = response_text[4:].strip()

        return json.loads(response_text)
    except json.JSONDecodeError as e:
        print("[ERROR] JSON decoding failed:", str(e))
        return {"error": f"Invalid JSON response from OpenAI. Raw output: {response_text}"}
    except Exception as e:
        return {"error": str(e)}


@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return "", 200
        
    data = request.json
    messages = data.get("messages", [])
    
    # Extract the system message which contains the page context
    system_message = next((msg for msg in messages if msg["role"] == "system"), None)
    user_message = next((msg for msg in messages if msg["role"] == "user"), None)
    
    if not system_message or not user_message:
        return jsonify({"error": "Missing required messages"}), 400
    
    # Check if the user is requesting a quiz
    if "quiz" in user_message["content"].lower():
        # Extract content from the system message
        content = system_message["content"].split("Content:")[-1].strip()
        quiz = generate_quiz_from_content(content)
        return jsonify({"reply": json.dumps(quiz, indent=2)})
    
    # Check if the user is requesting slides
    elif "slides" in user_message["content"].lower():
        print("[INFO] Detected slides generation request in /chat.")
        content = system_message["content"].split("Content:")[-1].strip()
        slides = generate_slides_from_content(content)

        if "error" in slides:
            print("[ERROR] Failed to generate slide content:", slides["error"])
            return jsonify({"reply": f"❌ Failed to generate slides content: {slides['error']}"})

        try:
            slides_link = create_google_slides(slides, presentation_title="Slides from Chat Context")
            print("[INFO] Slides created successfully:", slides_link)
            return jsonify({"reply": f"✅ Slides created! View them here:\n{slides_link}"})
        except Exception as e:
            print("[ERROR] Failed to create Google Slides:", e)
            return jsonify({"reply": f"❌ Failed to create Google Slides: {str(e)}"})


    
    # For other queries, use the context to provide a relevant response
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a helpful AI assistant for Canvas. Use the following context to provide specific and relevant answers.
                    If the user asks about content, use the actual content provided to give detailed responses.
                    If they ask for a quiz or slides, tell them you can generate those from the current page content.
                    
                    Always end your response with a section listing key excerpts you used, formatted as:

                    📚 Sources:
                    - <sentence or phrase you used>
                    - ...

                    Context:
                    {system_message['content']}"""
                            },
                            {"role": "user", "content": user_message["content"]}
                        ]
                    )

        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

"""@app.route("/canvas/content", methods=["POST"])
def get_content():
    data = request.json
    course_id = data.get("course_id")
    content_type = data.get("content_type")
    
    content = get_canvas_content(course_id, content_type)
    if content:
        return jsonify({"content": content})
    return jsonify({"error": "Failed to fetch content"}), 400"""


@app.route("/canvas/files", methods=["GET"])
def get_canvas_files():
    course_id = request.args.get("course_id")
    token = request.args.get("token")

    if not course_id or not token:
        return jsonify({"error": "Missing course_id or token"}), 400

    try:
        files = list_files(course_id, token)
        simplified_files = [
            {
                "display_name": f["display_name"],
                "url": f["url"]
            } for f in files
        ]
        return jsonify({"files": simplified_files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/canvas/use-file", methods=["POST"])
def use_file_content():
    try:
        data = request.get_json()
        print("Received request JSON:", data)

        file_url = data.get("file_url")
        user_message = data.get("prompt")
        token = data.get("token")  # Optional, not used here

        if not file_url or not user_message:
            return jsonify({"error": "Missing file_url or prompt"}), 400

        print("Fetching file directly from:", file_url)
        response = requests.get(file_url)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(response.content)
            tmp_path = tmp_file.name

        print("PDF saved to:", tmp_path)
        print("Content-Type:", response.headers.get("Content-Type"))
        print("Content Size:", len(response.content))

        # Parse PDF with PyMuPDF
        doc = fitz.open(tmp_path)
        file_text = ""
        for page in doc:
            file_text += page.get_text()
        doc.close()

        print("Extracted text length:", len(file_text))

        # Truncate file text to avoid token overflow (adjust max_chars as needed)
        max_chars = 7000
        short_text = file_text[:max_chars]

        # ✅ NEW: Check if user specifically wants slides
        if "slides" in user_message.lower():
            print("[INFO] Detected slides generation request.")

            slides = generate_slides_from_content(short_text)
            if "error" in slides:
                print("[ERROR] Failed to generate slide content:", slides["error"])
                return jsonify({"reply": f"❌ Failed to generate slides content: {slides['error']}"})

            try:
                slides_link = create_google_slides(slides, presentation_title="Slides from File")
                print("[INFO] Slides created successfully:", slides_link)
                return jsonify({"reply": f"✅ Slides created! View them here:\n{slides_link}"})
            except Exception as e:
                print("[ERROR] Failed to create Google Slides:", e)
                return jsonify({"reply": f"❌ Failed to create Google Slides: {str(e)}"})

        # 🔵 Default behavior: generate text answer with OpenAI
        gpt_response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant. Use the provided course file content to answer the professor's question accurately. "
                        "At the end of your answer, always include a section listing 1-2 short excerpts from the course material that support your answer, formatted as:\n\n"
                        "📚 Sources:\n- <excerpt>\n- ...\n\n"
                        f"Course file content:\n{short_text}"
                    )
                },
                {
                    "role": "user",
                    "content": f"{user_message}"
                }
            ]
        )

        print("[INFO] Returning standard text response.")
        return jsonify({"reply": gpt_response.choices[0].message.content})

    except Exception as e:
        print("ERROR in /canvas/use-file:", e)
        return jsonify({"error": str(e)}), 500

def create_google_slides(slide_data, presentation_title="Canvas AI Slides"):
    creds = service_account.Credentials.from_service_account_file(
        "canvas-api-slide-b157b32eeedc.json",
        scopes=[
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/presentations"
        ],
    )

    slides_service = build("slides", "v1", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    # Create a new presentation
    presentation = slides_service.presentations().create(
        body={"title": presentation_title}
    ).execute()
    presentation_id = presentation["presentationId"]

    for slide in slide_data["slides"]:
        # Create slide with TITLE_AND_BODY layout
        create_response = slides_service.presentations().batchUpdate(
            presentationId=presentation_id,
            body={
                "requests": [
                    {
                        "createSlide": {
                            "slideLayoutReference": {"predefinedLayout": "TITLE_AND_BODY"},
                        }
                    }
                ]
            },
        ).execute()

        # Get created slide ID
        slide_id = create_response["replies"][0]["createSlide"]["objectId"]

        # Fetch elements (placeholders) on the new slide
        elements = slides_service.presentations().pages().get(
            presentationId=presentation_id, pageObjectId=slide_id
        ).execute().get("pageElements", [])

        # Find title & body placeholder IDs
        title_id, body_id = None, None
        for el in elements:
            shape = el.get("shape")
            if not shape: continue
            placeholder = shape.get("placeholder")
            if not placeholder: continue
            type_ = placeholder.get("type")
            if type_ == "TITLE":
                title_id = el["objectId"]
            elif type_ == "BODY":
                body_id = el["objectId"]

        requests = []
        if title_id:
            requests.append({
                "insertText": {
                    "objectId": title_id,
                    "text": slide["title"]
                }
            })
        if body_id:
            requests.append({
                "insertText": {
                    "objectId": body_id,
                    "text": slide["content"]
                }
            })

        # Insert text into placeholders
        if requests:
            slides_service.presentations().batchUpdate(
                presentationId=presentation_id,
                body={"requests": requests}
            ).execute()

    # Make the presentation publicly readable
    drive_service.permissions().create(
        fileId=presentation_id,
        body={"type": "anyone", "role": "reader"},
        fields="id"
    ).execute()

    return f"https://docs.google.com/presentation/d/{presentation_id}/edit"



@app.route("/", methods=["GET"])
def home():
    return "Canvas Chatbot API is running"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
    
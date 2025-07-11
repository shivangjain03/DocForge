# 📄 DocForge

> *"Because great code deserves great docs."*

DocForge is an AI-powered documentation platform that helps developers spend less time writing docs and more time building cool stuff. It auto-generates clean, readable documentation from your code, tracks changes across versions, and even integrates directly with GitHub — so you can focus on shipping, not explaining.

Built by devs, for devs. ❤️

---

## 🚀 What It Does

- Parses code and generates smart, human-readable documentation (Markdown).
- Tracks codebase changes and shows version diffs.
- Connects with GitHub for seamless repo syncing.
- Supports multi-user, multi-project workflows.
- In progress: a sleek frontend UI + scalable DevOps setup (Kubernetes, CI/CD).

---

## 📊 Project Status

| Feature                                      | Status         |
|---------------------------------------------|----------------|
| 🔁 LLM-based backend doc generation          | ✅ Completed    |
| 🔐 GitHub OAuth + Supabase integration       | ✅ Completed    |
| 💻 Frontend UI (React + Tailwind)            | 🟡 In Progress  |
| ☁️ Dockerized Backend                        | ✅ Completed    |
| ⚙️ Kubernetes deployment + CI/CD pipelines   | 🟡 In Progress  |

> TL;DR: The brain is working. The face and cloud brain are coming soon.

---


## 🗂️ Architecture

| Layer     | Tech Stack                          |
|-----------|-------------------------------------|
| Frontend  | React + TailwindCSS + Vite (WIP)    |
| Backend   | FastAPI                             |
| Auth      | OAuth2 + JWT                        |
| Database  | PostgreSQL via Supabase             |
| DevOps    | Docker, Kubernetes (in progress)    |

---

## 🔌 Service/API Dependencies

- **GitHub API** → fetch repo content & commit history  
- **OpenAI API (LLM)** → generate natural-language documentation  
- **Supabase** → auth, session handling, and PostgreSQL storage  

---

## 🗃️ Database Entity Diagram

```plaintext
Users ---< Projects ---< Versions
        \              \
         \              > Documents
          > Sessions

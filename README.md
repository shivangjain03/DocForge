# 📘 DocForge

> AI-powered documentation platform that automates code parsing, multi-language summarization, semantic version comparison, and GitHub integration — built to streamline complex software documentation workflows.

---

## 🚀 Overview

**DocForge** is an intelligent, end-to-end developer tool that automates the creation and management of software documentation. By integrating LLM-powered summarization, GitHub version tracking, and real-time diffing, DocForge eliminates the friction of maintaining clear, consistent documentation — especially in fast-moving codebases.

Built with scalable microservices using FastAPI and deployed via Docker and Kubernetes, DocForge is ready for cloud deployment and multi-tenant use cases.

---

## ✨ Key Features

- 🔍 **Code Parsing**: Extracts structure and logic from source files across languages like Python, JavaScript, and more.
- 🧠 **AI-Powered Summarization**: Uses OpenAI APIs to generate clean, human-readable documentation for each function, class, or module.
- 🔁 **Version Comparison**: Semantic diffing between versions with integrated UI to explore changes.
- 🔗 **GitHub Integration**: Pull public/private repos, track commits, and sync documentation across versions.
- 🔐 **OAuth2 Authentication**: Secure user login and protected routes using token-based auth.
- 🗃️ **Multi-Tenant Storage**: Isolated PostgreSQL schemas per user/project with version tracking.
- 🐳 **Containerized Architecture**: Each service runs in isolated Docker containers for full reproducibility.
- ☸️ **Kubernetes-Ready**: Modular deployments and rolling updates using Kubernetes and Minikube.

---

## 🧱 Tech Stack

| Layer         | Technology                            |
|---------------|----------------------------------------|
| Frontend      | Next.js (App Router, TypeScript)       |
| Backend       | FastAPI (Python), Pydantic, SQLAlchemy |
| Database      | PostgreSQL                             |
| Auth          | OAuth2, JWT                            |
| DevOps        | Docker, Docker Compose, Kubernetes     |
| AI/LLM        | OpenAI API (text-davinci, gpt-4.0)     |

---

## 🧩 Architecture Overview

```plaintext
 [Frontend - Next.js]
         |
 [FastAPI Backend API]
         |
 [PostgreSQL DB] <--> [LLM Summarizer]
         |
     [GitHub Repo Sync]
```

- Frontend handles authentication, documentation UI, and file uploads.
- Backend coordinates parsing, summarization, and version tracking.
- Database maintains user/project/doc/version data.
- LLM pipeline integrates OpenAI API for summarization.
- GitHub integration enables version control and sync.

---

## 📦 Local Development with Docker Compose

### 📋 Prerequisites
- Docker + Docker Compose installed
- OpenAI API key (optional for full AI functionality)



| Service     | URL                     |
|-------------|-------------------------|
| Frontend    | http://localhost:3000   |
| Backend API | http://localhost:8000/docs |
| PostgreSQL  | localhost:5432          |

Make sure `.env` is configured for DB and API keys.

---

## 🔐 Environment Variables

| Variable             | Purpose                                  |
|----------------------|-------------------------------------------|
| `OPENAI_API_KEY`     | Enables LLM-based summarization           |
| `DATABASE_URL`       | PostgreSQL connection string              |
| `JWT_SECRET_KEY`     | OAuth2 token generation                   |
| `FRONTEND_URL`       | CORS origin for client/frontend           |

---

## 💡 Use Cases

- ✅ Auto-generate documentation for unfamiliar codebases
- ✅ Review semantic differences between versions
- ✅ Improve code readability across multi-developer teams
- ✅ Onboard new engineers quickly using summarized logic
- ✅ Track code changes and documentation history together

---


## 🎯 Future Enhancements

- 🔍 Vector search + embedding-based doc retrieval
- 🌐 Public hosting with Ingress + domain routing
- 📊 Analytics for documentation engagement
- 🧩 Plugin system for Markdown, Jupyter, etc.

---

## 🤝 Contributing

Pull requests and contributions are welcome! For major changes, open an issue first to discuss.

---


Made with 💻 by [Shivang Jain](https://shivangjain.vercel.app)  

"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function GenerateDocsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;

    const formData = new FormData();
    if (file) formData.append("file", file);
    if (githubUrl) formData.append("github_url", githubUrl);

    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/generate-docs/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMarkdown(res.data.markdown);
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate docs: " + (err?.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Generate Documentation</h1>

      <div className="mb-4">
        <label className="block mb-2">Upload ZIP File:</label>
        <input type="file" accept=".zip" onChange={handleFileChange} />
      </div>

      <div className="mb-4">
        <label className="block mb-2">OR Enter GitHub URL:</label>
        <input
          type="text"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="border p-2 w-96"
          placeholder="https://github.com/username/repo"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white px-6 py-2 rounded mb-4"
      >
        {loading ? "Generating..." : "Generate Docs"}
      </button>

      {markdown && (
        <div className="bg-white p-4 w-full max-w-4xl rounded shadow">
          <h2 className="font-bold mb-2 text-xl">Generated Markdown:</h2>
          <pre className="whitespace-pre-wrap">{markdown}</pre>
        </div>
      )}
    </div>
  );
}

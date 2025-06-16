"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function PushDocsPage() {
  const [repoName, setRepoName] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [branch, setBranch] = useState("main");
  const [path, setPath] = useState("docs.md");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleSubmit = async () => {
    if (!token) {
      alert("Please login first");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("repo_name", repoName);
      formData.append("github_token", githubToken);
      formData.append("branch", branch);
      formData.append("path", path);

      const res = await axios.post(
        "http://127.0.0.1:8000/push-docs/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Docs pushed successfully: " + JSON.stringify(res.data));
    } catch (err: any) {
      console.error(err);
      alert("Failed to push docs: " + (err?.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Push Docs to GitHub</h1>

      <input
        type="text"
        placeholder="Repo name (username/repo)"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
        className="border p-2 w-96 mb-4"
      />
      <input
        type="text"
        placeholder="GitHub Token"
        value={githubToken}
        onChange={(e) => setGithubToken(e.target.value)}
        className="border p-2 w-96 mb-4"
      />
      <input
        type="text"
        placeholder="Branch (default: main)"
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        className="border p-2 w-96 mb-4"
      />
      <input
        type="text"
        placeholder="Path (default: docs.md)"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        className="border p-2 w-96 mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        {loading ? "Pushing..." : "Push Docs"}
      </button>
    </div>
  );
}

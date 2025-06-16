"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RestoreDocsPage() {
  const [repoName, setRepoName] = useState("");
  const [version, setVersion] = useState<number>(1);
  const [markdown, setMarkdown] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleRestore = async () => {
    if (!token) {
      alert("Please login first");
      router.push("/login");
      return;
    }

    try {
      const res = await axios.get("http://127.0.0.1:8000/restore-doc/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { repo_name: repoName, version },
      });

      setMarkdown(res.data.markdown);
    } catch (err: any) {
      console.error(err);
      alert("Failed to restore: " + (err?.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Restore Docs</h1>

      <input
        type="text"
        placeholder="Repo name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
        className="border p-2 w-96 mb-4"
      />

      <input
        type="number"
        placeholder="Version"
        value={version}
        onChange={(e) => setVersion(parseInt(e.target.value))}
        className="border p-2 w-96 mb-4"
      />

      <button
        onClick={handleRestore}
        className="bg-green-500 hover:bg-green-700 text-white px-6 py-2 rounded"
      >
        Restore
      </button>

      {markdown && (
        <div className="bg-white p-4 w-full max-w-4xl rounded shadow mt-6">
          <h2 className="font-bold mb-2 text-xl">Restored Markdown:</h2>
          <pre className="whitespace-pre-wrap">{markdown}</pre>
        </div>
      )}
    </div>
  );
}

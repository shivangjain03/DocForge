"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CompareDocsPage() {
  const [repoName, setRepoName] = useState("");
  const [version1, setVersion1] = useState("");
  const [version2, setVersion2] = useState("");
  const [diff, setDiff] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      alert("Please login first");
      router.push("/login");
    } else {
      setToken(storedToken);
    }
  }, [router]);

  const handleCompare = async () => {
    if (!repoName || !version1 || !version2) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await axios.get("http://127.0.0.1:8000/compare-docs/", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          repo_name: repoName,
          version1: parseInt(version1),
          version2: parseInt(version2),
        },
      });

      setDiff(res.data.diff);
    } catch (err: any) {
      console.error(err);
      alert("Failed to compare: " + (err?.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Compare Versions</h1>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Repository Name:</label>
          <input
            type="text"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="repo-name"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Version 1:</label>
          <input
            type="number"
            value={version1}
            onChange={(e) => setVersion1(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Version 2:</label>
          <input
            type="number"
            value={version2}
            onChange={(e) => setVersion2(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        <button
          onClick={handleCompare}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded w-full"
        >
          Compare
        </button>
      </div>

      {diff && (
        <div className="mt-10 bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
          <h2 className="text-xl font-bold mb-4">Unified Diff:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-y-scroll max-h-[60vh]">{diff}</pre>
        </div>
      )}
    </div>
  );
}

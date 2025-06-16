"use client"
import { useState } from "react";
import api from "@/lib/api";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (url) formData.append("github_url", url);

    const res = await api.post("/generate-docs/", formData);
    console.log(res.data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <input type="text" placeholder="GitHub URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Generate Docs</button>
    </form>
  );
}

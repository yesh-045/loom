"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/lib/types";
import submitMessage from "@/utils/submitMessage";

type Props = {
  userId: string;
  chatId?: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

export default function ImportIngest({ userId, chatId, setMessages }: Props) {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function persist(msg: ChatMessage) {
    setMessages(prev => [...prev, msg]);
    if (chatId) {
      try { await submitMessage(userId, chatId, msg); } catch {}
    }
  }

  async function handleImportUrl() {
    if (!url.trim()) return;
  setLoading(true); setError(null); setStatus('Importing from URL…');
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      const ct = res.headers.get('content-type') || '';
  let data: Record<string, unknown> | null = null;
      if (ct.includes('application/json')) {
  data = (await res.json()) as Record<string, unknown>;
      } else {
        const text = await res.text();
        if (!res.ok) {
          if (res.status === 404) throw new Error('Ingest API (POST /api/ingest) not found. Start or restart the dev server.');
          throw new Error(text?.slice(0, 180) || 'Failed to ingest URL');
        }
        throw new Error('Unexpected response from server.');
      }
      if (!res.ok) {
        if (res.status === 404) throw new Error('Ingest API (POST /api/ingest) not found. Start or restart the dev server.');
        const message = data && typeof (data as Record<string, unknown>).error === 'string'
          ? (data as { error: string }).error
          : 'Failed to ingest URL';
        throw new Error(message);
      }

      // Summary and keynotes first
      if (data.summary) {
        await persist({ role: 'assistant', content: `Summary:\n\n${data.summary}` });
      }
      if (Array.isArray(data.keynotes) && data.keynotes.length) {
        await persist({ role: 'assistant', content: `Keynotes:\n- ${data.keynotes.join('\n- ')}` });
      }

      if (Array.isArray(data.slides)) {
        await persist({ role: 'assistant', content: JSON.stringify({ slides: data.slides }), componentMessageType: 'ppt' });
      }
      if (Array.isArray(data.flashcards)) {
        await persist({ role: 'assistant', content: JSON.stringify({ flashcards: data.flashcards }), componentMessageType: 'flashcards' });
      }
      if (Array.isArray(data.questions)) {
        await persist({ role: 'assistant', content: JSON.stringify({ questions: data.questions }), componentMessageType: 'quiz' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to ingest.');
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  async function handleImportPdf() {
    if (!file) return;
  setLoading(true); setError(null); setStatus('Uploading and parsing PDF…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/ingest', { method: 'POST', body: fd });
      const ct = res.headers.get('content-type') || '';
  let data: Record<string, unknown> | null = null;
      if (ct.includes('application/json')) {
  data = (await res.json()) as Record<string, unknown>;
      } else {
        const text = await res.text();
        if (!res.ok) {
          if (res.status === 404) throw new Error('Ingest API (POST /api/ingest) not found. Start or restart the dev server.');
          throw new Error(text?.slice(0, 180) || 'Failed to ingest file');
        }
        throw new Error('Unexpected response from server.');
      }
      if (!res.ok) {
        if (res.status === 404) throw new Error('Ingest API (POST /api/ingest) not found. Start or restart the dev server.');
        const message = data && typeof (data as Record<string, unknown>).error === 'string'
          ? (data as { error: string }).error
          : 'Failed to ingest file';
        throw new Error(message);
      }

      if (data.summary) {
        await persist({ role: 'assistant', content: `Summary:\n\n${data.summary}` });
      }
      if (Array.isArray(data.keynotes) && data.keynotes.length) {
        await persist({ role: 'assistant', content: `Keynotes:\n- ${data.keynotes.join('\n- ')}` });
      }

      if (Array.isArray(data.slides)) {
        await persist({ role: 'assistant', content: JSON.stringify({ slides: data.slides }), componentMessageType: 'ppt' });
      }
      if (Array.isArray(data.flashcards)) {
        await persist({ role: 'assistant', content: JSON.stringify({ flashcards: data.flashcards }), componentMessageType: 'flashcards' });
      }
      if (Array.isArray(data.questions)) {
        await persist({ role: 'assistant', content: JSON.stringify({ questions: data.questions }), componentMessageType: 'quiz' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to ingest.');
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  return (
    <div className="w-full border border-border rounded-xl p-3 bg-card mb-3">
      <div className="text-sm font-medium mb-2">Import (YouTube / Webpage / PDF)</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Paste YouTube or webpage URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-background border-border"
        />
        <Button onClick={handleImportUrl} disabled={loading || !url.trim()} className="bg-primary text-primary-foreground hover:bg-accent">
          {loading ? (status || 'Working…') : 'Import URL'}
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-xs text-muted-foreground"
        />
        <Button variant="outline" onClick={handleImportPdf} disabled={loading || !file}>{loading ? (status || 'Working…') : 'Upload PDF'}</Button>
      </div>
      {status && <div className="mt-2 text-xs text-muted-foreground">{status}</div>}
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
}

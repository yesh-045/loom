"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Link as LinkIcon, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import submitMessage from "@/utils/submitMessage";
import saveImage from "@/utils/saveImage";
import fetchGenerateAIResponse from "@/utils/fetchGenerateAIResponse";
import createChat from "@/utils/createChat";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  chatId?: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

export default function AddMenu({ userId, chatId, messages, setMessages }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(chatId);
  const router = useRouter();

  async function persist(msg: ChatMessage, chatIdOverride?: string) {
    setMessages(prev => [...prev, msg]);
    const id = chatIdOverride ?? activeChatId;
    if (id) { try { await submitMessage(userId, id, msg); } catch {} }
  }

  async function ensureChatWithUserMessage(inputForTitle: string, userMsg: ChatMessage): Promise<string> {
    // If chat exists, persist the user message and return id
    if (activeChatId) {
      try { await submitMessage(userId, activeChatId, userMsg); } catch {}
      return activeChatId;
    }
    // Create new chat and persist first user message via createChat
    const newChatId = await createChat(userId, inputForTitle, userMsg);
    setActiveChatId(newChatId);
    return newChatId;
  }

  async function handleImportUrl() {
    if (!url.trim()) return;
    setLoading(true); setError(null); setStatus('Importing from URL…');
    try {
  // Record a user intent message and ensure a chat exists
  const userMsg: ChatMessage = { role: 'user', content: `Import content from: ${url.trim()}` };
  const newId = await ensureChatWithUserMessage(`Import ${url.trim()}`, userMsg);
  setMessages(prev => [...prev, userMsg]);

      const res = await fetch('/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim() }) });
  const ct = res.headers.get('content-type') || '';
  let data: Record<string, unknown> | null = null;
      if (ct.includes('application/json')) {
          data = (await res.json()) as Record<string, unknown>;
      } else {
        const textBody = await res.text();
        if (!res.ok) {
          if (res.status === 404) throw new Error('Ingest API (POST /api/ingest) not found. Start or restart the dev server.');
          const message = textBody?.slice(0, 180) || 'Failed to ingest URL';
          throw new Error(message);
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
  if (data.summary) await persist({ role: 'assistant', content: `Summary:\n\n${String(data.summary)}` }, newId);
  if (Array.isArray((data as { keynotes?: unknown }).keynotes) && (data as { keynotes: unknown[] }).keynotes.length)
    await persist({ role: 'assistant', content: `Keynotes:\n- ${(data as { keynotes: string[] }).keynotes.join('\n- ')}` }, newId);
  if (Array.isArray((data as { slides?: unknown }).slides))
    await persist({ role: 'assistant', content: JSON.stringify({ slides: (data as { slides: unknown[] }).slides }), componentMessageType: 'ppt' }, newId);
  if (Array.isArray((data as { flashcards?: unknown }).flashcards))
    await persist({ role: 'assistant', content: JSON.stringify({ flashcards: (data as { flashcards: unknown[] }).flashcards }), componentMessageType: 'flashcards' }, newId);
      if (Array.isArray(data.questions)) await persist({ role: 'assistant', content: JSON.stringify({ questions: data.questions }), componentMessageType: 'quiz' });
      setOpen(false);
  try { router.push(`/chat/${newId}`); router.refresh(); } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest.');
    } finally { setLoading(false); setStatus(null); }
  }

  async function handleImportPdf() {
    if (!pdfFile) return;
    setLoading(true); setError(null); setStatus('Uploading and parsing PDF…');
    try {
  // Record a user intent message and ensure a chat exists
  const userMsg: ChatMessage = { role: 'user', content: `Upload and parse PDF: ${pdfFile.name}` };
  const newId = await ensureChatWithUserMessage(`Import PDF ${pdfFile.name}`, userMsg);
  setMessages(prev => [...prev, userMsg]);

      const fd = new FormData();
      fd.append('file', pdfFile);
      const res = await fetch('/api/ingest', { method: 'POST', body: fd });
  const ct = res.headers.get('content-type') || '';
  let data: Record<string, unknown> | null = null;
      if (ct.includes('application/json')) {
          data = (await res.json()) as Record<string, unknown>;
      } else {
        const textBody = await res.text();
        if (!res.ok) {
          if (res.status === 404) throw new Error('Ingest API (POST /api/ingest) not found. Start or restart the dev server.');
          const message = textBody?.slice(0, 180) || 'Failed to ingest file';
          throw new Error(message);
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
  if (data.summary) await persist({ role: 'assistant', content: `Summary:\n\n${String(data.summary)}` }, newId);
  if (Array.isArray((data as { keynotes?: unknown }).keynotes) && (data as { keynotes: unknown[] }).keynotes.length)
    await persist({ role: 'assistant', content: `Keynotes:\n- ${(data as { keynotes: string[] }).keynotes.join('\n- ')}` }, newId);
  if (Array.isArray((data as { slides?: unknown }).slides))
    await persist({ role: 'assistant', content: JSON.stringify({ slides: (data as { slides: unknown[] }).slides }), componentMessageType: 'ppt' }, newId);
  if (Array.isArray((data as { flashcards?: unknown }).flashcards))
    await persist({ role: 'assistant', content: JSON.stringify({ flashcards: (data as { flashcards: unknown[] }).flashcards }), componentMessageType: 'flashcards' }, newId);
  if (Array.isArray((data as { questions?: unknown }).questions))
    await persist({ role: 'assistant', content: JSON.stringify({ questions: (data as { questions: unknown[] }).questions }), componentMessageType: 'quiz' }, newId);
      setOpen(false);
  try { router.push(`/chat/${newId}`); router.refresh(); } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest.');
    } finally { setLoading(false); setStatus(null); }
  }

  async function handleUploadImage() {
    if (!imgFile) return;
    setLoading(true); setError(null); setStatus('Uploading image…');
    try {
      const fd = new FormData();
      fd.append('image', imgFile);
      const imageUrl = await saveImage(fd);
  // Send using the expected image type plus a text instruction in the same message
  const imgMsg: ChatMessage = {
    role: 'user',
    content: [
      { type: 'image', imageUrl: imageUrl },
      { type: 'text', text: 'Please describe and interpret the uploaded image in detail. Focus on key elements, relationships, and any notable patterns.' }
    ]
  };
  // Ensure chat exists and record the user image message
  const newId = await ensureChatWithUserMessage('Analyze image', imgMsg);
  setMessages(prev => [...prev, imgMsg]);
  const nextConversation = [...messages, imgMsg];
      setMessages(nextConversation);
      setStatus('Analyzing image with AI…');
      const ai = await fetchGenerateAIResponse(nextConversation);
      const aiMsg: ChatMessage = ai.contentType
        ? { role: 'assistant', content: ai.content, componentMessageType: ai.contentType as ChatMessage['componentMessageType'] }
        : { role: 'assistant', content: ai.content };
  await persist(aiMsg, newId);
      setOpen(false);
  try { router.push(`/chat/${newId}`); router.refresh(); } catch {}
  } catch {
      await persist({ role: 'assistant', content: 'I could not analyze the image right now. Please try again.' });
    } finally { setLoading(false); setStatus(null); }
  }

  return (
    <Popover open={open} onOpenChange={(v)=>{ if (!loading) setOpen(v); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-border"
          onMouseEnter={() => setOpen(true)}
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Add</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 bg-card border-border">
        <div className="space-y-3">
          <div className="text-sm font-medium">Add from…</div>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Paste URL (YouTube/web)" value={url} onChange={(e)=>setUrl(e.target.value)} className="bg-background border-border" disabled={loading} />
            <Button onClick={handleImportUrl} disabled={loading || !url.trim()} className="bg-primary text-primary-foreground hover:bg-accent">{loading && status?.startsWith('Importing') ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}</Button>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="outline"
              onClick={() => document.getElementById('pdf-input')?.click()}
              disabled={loading}
              className="bg-background border-border"
            >
              Choose PDF
            </Button>
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            <Button onClick={handleImportPdf} disabled={loading || !pdfFile} className="bg-primary text-primary-foreground ">
              Upload
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="outline"
              onClick={() => document.getElementById('img-input')?.click()}
              disabled={loading}
              className="bg-background border-border"
            >
              Choose Image
            </Button>
            <input
              id="img-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImgFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            <Button variant="outline" onClick={handleUploadImage} disabled={loading || !imgFile} className="bg-primary text-primary-foreground ">
              {loading && status?.startsWith('Uploading image') ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
            </Button>
          </div>
          {status && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{status}</span>
            </div>
          )}
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

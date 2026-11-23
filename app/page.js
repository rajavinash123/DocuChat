"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Upload, FileText, ArrowUp, Bot, Trash2, Menu, Sparkles, X,
  LoaderCircle, CheckCircle2, AlertCircle, Copy, Check, Square, RotateCcw,
} from "lucide-react";

const SUGGESTIONS = [
  "Summarize this document",
  "Explain the main concepts",
  "Generate important questions",
  "Find key points from this PDF",
];
const MAX_MB = 20;

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(null);

  const fileRef = useRef(null);
  const textRef = useRef(null);
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const toastTimer = useRef(null);

  // Sidebar open by default on desktop only
  useEffect(() => {
    setSidebar(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  // Keep latest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [prompt]);

  const notify = useCallback((type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // PDF upload
  const handleUpload = async (selected) => {
    if (!selected || uploading) return;
    if (selected.type !== "application/pdf") {
      return notify("error", "That file is not a PDF. Choose a .pdf file.");
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      return notify("error", `File is larger than ${MAX_MB} MB. Choose a smaller PDF.`);
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFile({ name: selected.name, chunks: data.totalChunks });
      notify("success", `${selected.name} is ready. Ask a question.`);
      textRef.current?.focus();
    } catch (error) {
      notify("error", error.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // Chat
  const send = async (text) => {
    const question = (text ?? prompt).trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setPrompt("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (error) {
      if (error.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Stopped.", stopped: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            error: true,
            retry: question,
            content: "Could not get an answer. Check your connection and try again.",
          },
        ]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    send();
  };

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setPrompt("");
    if (window.innerWidth < 1024) setSidebar(false);
  };

  const copy = async (text, i) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      notify("error", "Could not copy. Select the text and copy it manually.");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files?.[0]);
  };

  const uniqueSources = (sources = []) =>
    [...new Set(sources.map((s) => s.source || "Knowledge document"))];

  const ready = !!file;

  return (
    <main
      className="flex h-dvh bg-slate-50 text-slate-800 overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={onDrop}
    >
      {/* Mobile backdrop */}
      {sidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebar(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        aria-label="Sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white flex flex-col p-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
          sidebar ? "translate-x-0" : "-translate-x-full lg:hidden"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-xl"><Sparkles size={20} /></div>
            <div>
              <h1 className="font-semibold text-lg leading-tight">DocuMind AI</h1>
              <p className="text-xs text-slate-400">Ask questions about your PDFs</p>
            </div>
          </div>
          <button
            onClick={() => setSidebar(false)}
            className="lg:hidden p-1 rounded-md hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <button
          onClick={newChat}
          className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 p-3 rounded-xl mt-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
        >
          <Plus size={18} />
          New chat
        </button>

        <div className="mt-8">
          <p className="text-xs text-slate-400 mb-3 px-1">Document</p>

          {file ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
              <FileText className="text-teal-300 shrink-0" size={20} />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-slate-400">{file.chunks} sections indexed</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
                aria-label={`Remove ${file.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20 text-sm text-slate-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
            >
              {uploading ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={18} />}
              {uploading ? "Processing PDF..." : "Upload a PDF"}
            </button>
          )}
        </div>

        <p className="mt-auto text-xs text-slate-500 px-1">
          Answers come from the document you upload.
        </p>
      </aside>

      {/* MAIN */}
      <section className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebar && (
              <button
                onClick={() => setSidebar(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            <h2 className="font-semibold truncate">
              {file ? file.name : "Document chat"}
            </h2>
          </div>

          <div
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full shrink-0 ${
              ready ? "text-emerald-700 bg-emerald-50" : "text-slate-500 bg-slate-100"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${ready ? "bg-emerald-500" : "bg-slate-400"}`} />
            {ready ? "Document ready" : "No document"}
          </div>
        </header>

        {/* CHAT */}
        <div className="flex-1 overflow-y-auto" role="log" aria-live="polite" aria-label="Conversation">
          <div className="max-w-3xl mx-auto px-4 sm:px-5 py-8">
            {messages.length === 0 ? (
              <div className="min-h-[60vh] flex flex-col justify-center items-center text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {ready ? "What do you want to know?" : "Chat with your documents"}
                </h1>
                <p className="text-slate-500 mt-3 max-w-md text-sm leading-6">
                  {ready
                    ? "Ask about anything in the PDF, or start with one of these."
                    : "Upload a PDF, then ask questions. Answers include the sources they came from."}
                </p>

                {!ready && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className={`mt-8 border-2 border-dashed rounded-2xl p-8 w-full max-w-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 ${
                      dragging
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/40"
                    }`}
                  >
                    {uploading ? (
                      <LoaderCircle className="animate-spin mx-auto text-teal-600" size={30} />
                    ) : (
                      <Upload className="mx-auto text-teal-600" size={30} />
                    )}
                    <p className="font-semibold mt-3">
                      {uploading ? "Processing PDF..." : dragging ? "Drop to upload" : "Upload a PDF"}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Drag a file here or click to browse. PDF up to {MAX_MB} MB.
                    </p>
                  </button>
                )}

                {ready && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-md">
                    {SUGGESTIONS.map((item) => (
                      <button
                        key={item}
                        onClick={() => send(item)}
                        className="text-left text-sm p-4 border bg-white rounded-xl hover:border-teal-400 hover:bg-teal-50/40 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] bg-slate-900 text-white rounded-2xl rounded-br-md px-4 py-3 text-sm leading-6 whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.error ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {msg.error ? <AlertCircle size={17} /> : <Bot size={17} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm leading-7 whitespace-pre-wrap break-words ${
                            msg.error ? "text-red-700" : msg.stopped ? "text-slate-400 italic" : ""
                          }`}
                        >
                          {msg.content}
                        </div>

                        {uniqueSources(msg.sources).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {uniqueSources(msg.sources).map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 rounded-full px-2.5 py-1 max-w-full"
                              >
                                <FileText size={12} className="shrink-0" />
                                <span className="truncate">{s}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex gap-1">
                          {!msg.error && !msg.stopped && (
                            <button
                              onClick={() => copy(msg.content, i)}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
                            >
                              {copied === i ? <Check size={13} /> : <Copy size={13} />}
                              {copied === i ? "Copied" : "Copy"}
                            </button>
                          )}
                          {msg.retry && (
                            <button
                              onClick={() => {
                                setMessages((prev) => prev.slice(0, i - 1));
                                send(msg.retry);
                              }}
                              disabled={loading}
                              className="flex items-center gap-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
                            >
                              <RotateCcw size={13} />
                              Try again
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}

                {loading && (
                  <div className="flex gap-3 items-center" aria-label="Generating answer">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Bot size={17} />
                    </div>
                    <div className="flex gap-1.5">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce motion-reduce:animate-none"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* COMPOSER */}
        <div className="border-t bg-white p-3 sm:p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            {file && (
              <div className="mb-2 inline-flex items-center gap-2 text-xs bg-slate-100 text-slate-700 rounded-full pl-3 pr-1.5 py-1 max-w-full">
                <FileText size={13} className="shrink-0 text-teal-700" />
                <span className="truncate">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 rounded-full hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="border rounded-2xl flex items-end p-2 gap-2 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20"
            >
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
                aria-label="Upload a PDF"
              >
                {uploading ? <LoaderCircle size={20} className="animate-spin" /> : <Upload size={20} />}
              </button>

              <textarea
                ref={textRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={ready ? "Ask a question about your document" : "Upload a PDF to get started"}
                aria-label="Message"
                rows={1}
                className="flex-1 resize-none outline-none py-2.5 text-sm max-h-40 bg-transparent"
              />

              {loading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="bg-slate-900 hover:bg-slate-700 text-white p-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900"
                  aria-label="Stop generating"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 text-white p-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                  aria-label="Send message"
                >
                  <ArrowUp size={20} />
                </button>
              )}
            </form>

            <p className="text-center text-xs text-slate-400 mt-2">
              Enter to send, Shift+Enter for a new line. Check important answers against the source.
            </p>
          </div>
        </div>

        {/* Drag overlay */}
        {dragging && (
          <div className="absolute inset-0 z-20 bg-teal-600/10 border-4 border-dashed border-teal-500 flex items-center justify-center pointer-events-none">
            <p className="bg-white rounded-xl px-5 py-3 font-semibold text-teal-700 shadow">
              Drop your PDF to upload
            </p>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            role="status"
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-[90%] ${
              toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            {toast.type === "error" ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} aria-label="Dismiss" className="ml-1 opacity-80 hover:opacity-100">
              <X size={15} />
            </button>
          </div>
        )}
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => {
          handleUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </main>
  );
}
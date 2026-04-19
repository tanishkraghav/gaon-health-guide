import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Keyboard, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/session";
import { LANGUAGES, t } from "@/lib/i18n";
import { triagePatient } from "@/server/ai.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/triage")({
  component: TriagePage,
  head: () => ({ meta: [{ title: "Swasthya Sathi — Triage" }] }),
});

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

// Web Speech API typing
type SR = typeof window extends { SpeechRecognition: infer T } ? T : any;

function getRecognitionCtor(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function TriagePage() {
  const { lang, patient, role } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== "patient") navigate({ to: "/" });
  }, [role, navigate]);

  const langDef = LANGUAGES.find((l) => l.code === lang)!;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [interim, setInterim] = useState("");
  const [textInput, setTextInput] = useState("");
  const [textMode, setTextMode] = useState(!getRecognitionCtor());
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [started, setStarted] = useState(false);
  const recogRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim, thinking]);

  // Kick off conversation with first AI question
  useEffect(() => {
    if (started || !patient) return;
    setStarted(true);
    void sendToAI([{ role: "user", content: "मुझे ठीक नहीं लग रहा / I am not feeling well." }], { showFirstUser: false });
  }, [started, patient]);

  async function sendToAI(history: ChatMsg[], opts: { showFirstUser?: boolean } = {}) {
    setThinking(true);
    try {
      const res = await triagePatient({ data: { language: langDef.english, messages: history } });
      if (!res.ok) {
        toast.error(res.error);
        setThinking(false);
        return;
      }
      const reply = res.data;
      setMessages((prev) => {
        const base = opts.showFirstUser === false ? [] : prev;
        return [...base, ...(opts.showFirstUser === false ? [] : []), { role: "assistant" as const, content: reply.message }];
      });

      if (reply.action === "finalize") {
        const tier = reply.urgency_tier ?? 1;
        const urgency = tier === 3 ? "red" : tier === 2 ? "yellow" : "green";
        sessionStorage.setItem("triage-result", JSON.stringify({
          urgency,
          conditionGuess: reply.condition_guess || "",
          homeRemedy: reply.home_remedy || "",
          referralReason: reply.referral_reason || "",
          confidence: reply.confidence_score || 0,
          summary: reply.message,
          symptoms: history.filter((m) => m.role === "user").map((m) => m.content),
        }));
        setTimeout(() => navigate({ to: "/patient/result" }), 900);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setThinking(false);
    }
  }

  function handleUserMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setTextInput("");
    setInterim("");
    void sendToAI(next);
  }

  function startListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast.error("Voice input not supported here. Use text mode.");
      setTextMode(true);
      return;
    }
    const r = new Ctor();
    r.lang = langDef.speechCode;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
      if (finalText) handleUserMessage(finalText);
    };
    r.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      if (e.error === "not-allowed") toast.error("Microphone permission denied");
      else if (e.error !== "no-speech") toast.error(`Voice error: ${e.error}`);
      setListening(false);
    };
    r.onend = () => setListening(false);
    try {
      r.start();
      recogRef.current = r;
      setListening(true);
    } catch (err) {
      console.error(err);
      setListening(false);
    }
  }

  function stopListening() {
    try { recogRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Button size="icon" variant="ghost" onClick={() => navigate({ to: "/patient/home" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">Triage</p>
          <p className="truncate text-xs text-muted-foreground">{langDef.label} · {langDef.english}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setTextMode((v) => !v)} className="gap-1.5">
          {textMode ? <Mic className="h-3.5 w-3.5" /> : <Keyboard className="h-3.5 w-3.5" />}
          {textMode ? "Voice" : t("switchToText", lang)}
        </Button>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>{m.content}</Bubble>
          ))}
          {interim && (
            <Bubble role="user" partial>{interim}…</Bubble>
          )}
          {thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
          {messages.length === 0 && !thinking && (
            <div className="py-12 text-center text-sm text-muted-foreground">Starting your triage…</div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t bg-card px-4 py-4">
        <div className="mx-auto max-w-2xl">
          {textMode ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleUserMessage(textInput); }}
              className="flex items-center gap-2"
            >
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer…"
                className="h-12"
                disabled={thinking}
              />
              <Button type="submit" size="icon" className="h-12 w-12" disabled={thinking || !textInput.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {listening && <Waveform />}
              <button
                onClick={listening ? stopListening : startListening}
                disabled={thinking}
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform active:scale-95",
                  listening ? "bg-danger pulse-mic" : "bg-primary",
                )}
              >
                {listening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              </button>
              <p className="text-xs text-muted-foreground">
                {listening ? "Listening… tap to stop" : "Tap to speak"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, children, partial }: { role: "user" | "assistant"; children: React.ReactNode; partial?: boolean }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-base leading-relaxed shadow-sm",
          role === "user"
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card text-card-foreground border rounded-bl-sm",
          partial && "opacity-60 italic",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Waveform() {
  return (
    <div className="flex h-10 items-center gap-1">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="waveform-bar block w-1 rounded-full bg-primary"
          style={{ height: `${20 + (i % 5) * 6}px`, animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}

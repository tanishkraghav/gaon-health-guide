import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const triageInput = z.object({
  language: z.string().min(2).max(20),
  messages: z.array(messageSchema).min(1).max(20),
});

const triageTool = {
  type: "function" as const,
  function: {
    name: "respond",
    description: "Reply to the patient. Either ask one follow-up question, or finalise triage with all decision fields.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["ask", "finalize"], description: "ask = need more info; finalize = enough info to triage" },
        message: { type: "string", description: "The single short message to show the patient (in their language). For 'ask', a follow-up question. For 'finalize', a brief reassuring summary." },
        urgency_tier: { type: "string", enum: ["1", "2", "3"], description: "Only on finalize. 1=home care (green), 2=visit ASHA (yellow), 3=hospital (red)" },
        condition_guess: { type: "string", description: "Only on finalize. Likely condition in plain language. Avoid definitive diagnosis." },
        home_remedy: { type: "string", description: "Only on finalize. Simple home care if applicable." },
        referral_reason: { type: "string", description: "Only on finalize. Why escalation is needed (or empty for tier 1)." },
        confidence_score: { type: "number", description: "Only on finalize. 0.0-1.0" },
      },
      required: ["action", "message"],
    },
  },
};

export const triagePatient = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => triageInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured. LOVABLE_API_KEY missing." };
    }

    const systemPrompt = `You are a compassionate rural health triage assistant in India. The patient speaks ${data.language}.
Rules:
- Always respond in ${data.language} using simple words a low-literacy speaker understands.
- Ask ONLY ONE question at a time. Maximum 5 follow-up questions in total before finalising.
- Cover: location & duration of symptoms, severity, fever, breathing, pregnancy, age of patient, danger signs.
- Tier 1 (green) = mild self-limiting illness, safe at home.
- Tier 2 (yellow) = needs ASHA worker visit within a day (moderate symptoms, persistent fever, mild dehydration, antenatal concerns without red flags).
- Tier 3 (red) = emergency (chest pain, breathlessness, severe bleeding, unconscious, severe abdominal pain, eclampsia signs, severe dehydration in child). Always err on the side of caution.
- Never give a definitive diagnosis. Use phrases like "could be" / "may be".
- ALWAYS respond by calling the 'respond' tool. Never write free text outside of it.`;

    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...data.messages],
          tools: [triageTool],
          tool_choice: { type: "function", function: { name: "respond" } },
        }),
      });

      if (res.status === 429) return { ok: false as const, error: "Too many requests. Please wait a moment and try again." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." };
      if (!res.ok) {
        const t = await res.text();
        console.error("AI gateway triage error", res.status, t);
        return { ok: false as const, error: "AI service error. Please try again." };
      }

      const json = await res.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) {
        return { ok: false as const, error: "AI returned no usable response." };
      }
      const parsed = JSON.parse(call.function.arguments) as {
        action: "ask" | "finalize";
        message: string;
        urgency_tier?: 1 | 2 | 3;
        condition_guess?: string;
        home_remedy?: string;
        referral_reason?: string;
        confidence_score?: number;
      };
      return { ok: true as const, data: parsed };
    } catch (e) {
      console.error("triagePatient failed", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

const ashaInput = z.object({
  visitType: z.string().min(1).max(60),
  patientSummary: z.string().min(1).max(800),
  measurements: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

const ashaTool = {
  type: "function" as const,
  function: {
    name: "decision_support",
    description: "Return ASHA clinical decision support for this visit.",
    parameters: {
      type: "object",
      properties: {
        red_flags: { type: "array", items: { type: "string" }, description: "List of red-flag findings spotted in the data, plain language. Empty array if none." },
        protocol_next_step: { type: "string", description: "Single concrete next action under NHM protocol." },
        referral_recommended: { type: "boolean" },
        referral_reason: { type: "string", description: "Empty string if not referred." },
        visit_notes_summary: { type: "string", description: "2-3 sentence summary suitable for the visit record." },
      },
      required: ["red_flags", "protocol_next_step", "referral_recommended", "referral_reason", "visit_notes_summary"],
    },
  },
};

export const ashaDecisionSupport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ashaInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not configured." };

    const sys = `You are a clinical decision support assistant for ASHA workers in India following NHM protocols. Given the visit type and patient measurements provided, identify red flag signs, suggest the next protocol step, and decide if PHC referral is needed. Always call the 'decision_support' tool.`;
    const userMsg = `Visit type: ${data.visitType}\nPatient: ${data.patientSummary}\nMeasurements: ${JSON.stringify(data.measurements)}`;

    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userMsg },
          ],
          tools: [ashaTool],
          tool_choice: { type: "function", function: { name: "decision_support" } },
        }),
      });

      if (res.status === 429) return { ok: false as const, error: "Too many requests. Please wait." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted." };
      if (!res.ok) {
        const t = await res.text();
        console.error("ASHA AI error", res.status, t);
        return { ok: false as const, error: "AI service error." };
      }
      const json = await res.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) return { ok: false as const, error: "AI returned no usable response." };
      const parsed = JSON.parse(call.function.arguments);
      return { ok: true as const, data: parsed as {
        red_flags: string[];
        protocol_next_step: string;
        referral_recommended: boolean;
        referral_reason: string;
        visit_notes_summary: string;
      } };
    } catch (e) {
      console.error("ashaDecisionSupport failed", e);
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

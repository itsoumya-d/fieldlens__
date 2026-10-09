import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createTranscriptionFormData, TranscriptionInputError } from "./transcriptionFormat.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    let input: unknown;
    try {
      input = await req.json();
    } catch {
      throw new TranscriptionInputError("Request body must be valid JSON");
    }
    const formData = createTranscriptionFormData(input);
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Whisper error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { text } = await res.json();
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const invalidInput = err instanceof TranscriptionInputError;
    return new Response(JSON.stringify({ error: invalidInput ? err.message : String(err) }), {
      status: invalidInput ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

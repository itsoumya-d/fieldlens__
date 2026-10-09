export class TranscriptionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionInputError";
  }
}

// Allow the recording containers we produce, with syntactically valid MIME
// parameters (including quoted codec lists). Never derive a name from raw input.
const audioMimePattern = /^(audio\/(?:webm|mp4|m4a))(?: *; *[!#$%&'*+.^_`|~0-9a-z-]+ *= *(?:[!#$%&'*+.^_`|~0-9a-z-]+|"(?:[\x20-\x21\x23-\x5b\x5d-\x7e]|\\[\x20-\x7e])*"))*$/i;

function resolveAudioFormat(mimeType: unknown) {
  // Older native callers omit the MIME and record M4A.
  const suppliedMime = mimeType === undefined ? "audio/m4a" : mimeType;
  if (typeof suppliedMime !== "string" || /[\x00-\x1f\x7f]/.test(suppliedMime)) {
    throw new TranscriptionInputError("mimeType must be audio/webm, audio/mp4, or audio/m4a");
  }

  const mime = suppliedMime.trim().toLowerCase();
  const match = audioMimePattern.exec(mime);
  if (!match) {
    throw new TranscriptionInputError("mimeType must be audio/webm, audio/mp4, or audio/m4a");
  }

  const extension = match[1].slice("audio/".length);
  return { mime, filename: `audio.${extension}` };
}

/** Build the provider payload without I/O, credentials, or provider calls. */
export function createTranscriptionFormData(input: unknown): FormData {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TranscriptionInputError("Request body must be an object");
  }

  const { audioBase64, mimeType } = input as Record<string, unknown>;
  if (typeof audioBase64 !== "string" || audioBase64.length === 0) {
    throw new TranscriptionInputError("audioBase64 is required and must be a base64 string");
  }

  // Reject unsupported or malformed MIME before constructing the upload.
  const { mime, filename } = resolveAudioFormat(mimeType);
  let decoded: string;
  try {
    decoded = atob(audioBase64);
  } catch {
    throw new TranscriptionInputError("audioBase64 must be valid base64");
  }
  if (decoded.length === 0) {
    throw new TranscriptionInputError("audioBase64 must contain audio bytes");
  }

  const audioBytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  const formData = new FormData();
  formData.append("file", new Blob([audioBytes], { type: mime }), filename);
  formData.append("model", "whisper-1");
  return formData;
}

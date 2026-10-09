import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTranscriptionFormData,
  TranscriptionInputError,
} from '../supabase/functions/transcribe-audio/transcriptionFormat.ts';

// Deliberately synthetic bytes. These tests never use a microphone, real audio,
// credentials, network requests, or a transcription provider.
const bytes = Uint8Array.from([0, 1, 127, 128, 254, 255]);
const audioBase64 = Buffer.from(bytes).toString('base64');

const formats = [
  { mimeType: 'audio/webm', expectedMime: 'audio/webm', filename: 'audio.webm' },
  { mimeType: 'audio/webm;codecs=opus', expectedMime: 'audio/webm;codecs=opus', filename: 'audio.webm' },
  { mimeType: 'audio/webm; codecs="opus"', expectedMime: 'audio/webm; codecs="opus"', filename: 'audio.webm' },
  { mimeType: 'audio/mp4', expectedMime: 'audio/mp4', filename: 'audio.mp4' },
  { mimeType: 'audio/mp4;codecs=mp4a.40.2', expectedMime: 'audio/mp4;codecs=mp4a.40.2', filename: 'audio.mp4' },
  { mimeType: 'audio/mp4; codecs="mp4a.40.2"', expectedMime: 'audio/mp4; codecs="mp4a.40.2"', filename: 'audio.mp4' },
  { mimeType: 'audio/mp4; codecs="mp4a.40.2, mp4a.40.5"', expectedMime: 'audio/mp4; codecs="mp4a.40.2, mp4a.40.5"', filename: 'audio.mp4' },
  { mimeType: 'audio/m4a', expectedMime: 'audio/m4a', filename: 'audio.m4a' },
  { mimeType: ' AUDIO/WEBM;CODECS=OPUS ', expectedMime: 'audio/webm;codecs=opus', filename: 'audio.webm' },
  { mimeType: undefined, expectedMime: 'audio/m4a', filename: 'audio.m4a' },
];

for (const { mimeType, expectedMime, filename } of formats) {
  test(`multipart file matches ${mimeType ?? 'omitted native MIME'}`, async () => {
    const payload = mimeType === undefined ? { audioBase64 } : { audioBase64, mimeType };
    const formData = createTranscriptionFormData(payload);
    assert.ok(formData instanceof FormData);
    assert.deepEqual([...formData.keys()], ['file', 'model']);
    assert.equal(formData.get('model'), 'whisper-1');

    const file = formData.get('file');
    assert.ok(file instanceof Blob);
    assert.equal(file.name, filename);
    assert.equal(file.type, expectedMime);
    assert.equal(file.size, bytes.length);
    assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes);

    // Inspect the actual serialized multipart headers and payload locally.
    // Constructing/reading a Request does not fetch its URL.
    const request = new Request('https://example.invalid/transcription-test', {
      method: 'POST',
      body: formData,
    });
    const multipart = await request.text();
    assert.ok(multipart.includes(`name="file"; filename="${filename}"`));
    assert.ok(multipart.includes(`Content-Type: ${expectedMime}\r\n`));
  });
}

test('valid extra MIME parameters preserve the container extension', () => {
  const formData = createTranscriptionFormData({
    audioBase64,
    mimeType: 'audio/mp4; codecs="mp4a.40.2"; test="synthetic;fixture"',
  });
  assert.equal(formData.get('file').name, 'audio.mp4');
  assert.equal(formData.get('file').type, 'audio/mp4; codecs="mp4a.40.2"; test="synthetic;fixture"');
});

const invalidMimes = [
  null, false, 0, {}, [], '', ' ', 'webm', 'audio/',
  'audio/wav', 'audio/mpeg', 'audio/x-m4a', 'video/webm', 'application/octet-stream',
  'audio/webm-bogus', 'audio/mp4/../../anything', 'audio/webm, audio/mp4',
  'audio/webm;', 'audio/webm;opus', 'audio/webm;codecs=',
  'audio/mp4;codecs="mp4a.40.2', 'audio/mp4;codecs=mp4a.40.2"',
  'audio/webm;codecs=opus;broken', 'audio/webm\n',
  'audio/webm\r\nX-Injected: value', 'audio/mp4\u0000', 'audio/m4a\u007f',
];

for (const mimeType of invalidMimes) {
  test(`rejects unsupported or malformed MIME ${JSON.stringify(mimeType)}`, () => {
    assert.throws(
      () => createTranscriptionFormData({ audioBase64, mimeType }),
      (error) => error instanceof TranscriptionInputError && /mimeType/.test(error.message),
    );
  });
}

for (const input of [undefined, null, true, 1, 'body', [], [audioBase64]]) {
  test(`rejects non-object body ${JSON.stringify(input)}`, () => {
    assert.throws(() => createTranscriptionFormData(input), TranscriptionInputError);
  });
}

for (const invalidAudio of [undefined, null, 0, true, [], {}, '', ' ', '%%%', 'a', 'a===', 'data:audio/webm;base64,AAE=']) {
  test(`rejects missing or malformed base64 ${JSON.stringify(invalidAudio)}`, () => {
    assert.throws(
      () => createTranscriptionFormData({ audioBase64: invalidAudio, mimeType: 'audio/webm' }),
      (error) => error instanceof TranscriptionInputError && /audioBase64/.test(error.message),
    );
  });
}

import React from 'react';
import { renderAsync } from '@testing-library/react-native';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { WEB_VOICE_UNAVAILABLE_MESSAGE } from '@/lib/useVoiceRecording';

jest.mock('@/lib/useVoiceRecording', () => ({
  WEB_VOICE_UNAVAILABLE_MESSAGE: 'Voice input is unavailable on the web. Use the native app for voice input.',
  useVoiceRecording: jest.fn(() => ({
    recording: false, busy: false, blocked: true,
    start: jest.fn(), stop: jest.fn(), cancel: jest.fn(),
  })),
}));

it('shows visible web unavailability wording and no recording action', async () => {
  const screen = await renderAsync(<VoiceRecordButton onTranscript={jest.fn()} />);
  expect(screen.getByText(WEB_VOICE_UNAVAILABLE_MESSAGE)).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

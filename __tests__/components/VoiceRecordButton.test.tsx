import React from 'react';
import { act, fireEvent, renderAsync } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { SearchInput } from '@/components/SearchInput';
import { WEB_VOICE_UNAVAILABLE_MESSAGE, useVoiceRecording } from '@/lib/useVoiceRecording';

jest.mock('expo-router', () => ({ useFocusEffect: (effect: () => (() => void)) => require('react').useEffect(effect, [effect]) }));
jest.mock('@/lib/useVoiceRecording', () => ({
  WEB_VOICE_UNAVAILABLE_MESSAGE: 'Voice input needs a supported secure browser. You can type instead.',
  useVoiceRecording: jest.fn(),
}));
const mockHook = jest.mocked(useVoiceRecording);
const start = jest.fn(), stop = jest.fn(), cancel = jest.fn();
const originalPlatform = Platform.OS;
beforeEach(() => {
  jest.clearAllMocks();
  mockHook.mockReturnValue({ recording: false, busy: false, blocked: false, start, stop, cancel });
});
afterEach(() => {
  jest.useRealTimers();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

it('shows visible unsupported-browser wording and no recording action', async () => {
  mockHook.mockReturnValue({ recording: false, busy: false, blocked: true, start, stop, cancel });
  const screen = await renderAsync(<VoiceRecordButton onTranscript={jest.fn()} />);
  expect(screen.getByText(WEB_VOICE_UNAVAILABLE_MESSAGE)).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

it('starts only after a button press', async () => {
  const screen = await renderAsync(<VoiceRecordButton onTranscript={jest.fn()} />);
  expect(start).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));
  expect(start).toHaveBeenCalledTimes(1);
});

it.each([{ recording: true, busy: false }, { recording: false, busy: true }])('offers explicit Cancel while active: %p', async state => {
  mockHook.mockReturnValue({ ...state, blocked: false, start, stop, cancel });
  const screen = await renderAsync(<VoiceRecordButton onTranscript={jest.fn()} />);
  fireEvent.press(screen.getByRole('button', { name: 'Cancel voice input' }));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(start).not.toHaveBeenCalled();
  if (state.recording) {
    fireEvent.press(screen.getByRole('button', { name: 'Stop recording' }));
    expect(stop).toHaveBeenCalledTimes(1);
  }
});

it('focus cleanup wiring cancels the recording', async () => {
  const screen = await renderAsync(<VoiceRecordButton onTranscript={jest.fn()} />);
  await screen.unmountAsync();
  expect(cancel).toHaveBeenCalledTimes(1);
});

it('shows microphone denial inline on web, where native Alert is unavailable', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  const screen = await renderAsync(<VoiceRecordButton onTranscript={jest.fn()} />);
  act(() => { mockHook.mock.calls.at(-1)![0].onError('permission'); });
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Microphone access is needed for voice input.')).toBeTruthy();
});

it('typed and cleared search cancel before their debounced/newer search is submitted', async () => {
  jest.useFakeTimers();
  const onSearch = jest.fn();
  const screen = await renderAsync(<SearchInput onSearch={onSearch} voice />);
  fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'new typed query');
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(onSearch).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(300); });
  expect(onSearch).toHaveBeenLastCalledWith('new typed query');
  fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(onSearch).toHaveBeenLastCalledWith('');
});

it('unmount cancels the recording and pending search debounce', async () => {
  jest.useFakeTimers();
  const onSearch = jest.fn();
  const screen = await renderAsync(<SearchInput onSearch={onSearch} voice />);
  fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'pending query');
  await screen.unmountAsync();
  act(() => { jest.advanceTimersByTime(300); });
  expect(cancel).toHaveBeenCalled();
  expect(onSearch).not.toHaveBeenCalled();
});

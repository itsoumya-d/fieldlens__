import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress an image URI to a base64 string.
 * Resizes the longest edge to maxPx (default 1920) and sets JPEG quality to 0.8.
 * Falls back to the original URI on error.
 */
export async function compressToBase64(
  uri: string,
  maxPx = 1920,
  quality = 0.8,
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxPx } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return result.base64 ?? '';
  } catch {
    // Fall back: read the original as base64 without resizing
    const fallback = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return fallback.base64 ?? '';
  }
}

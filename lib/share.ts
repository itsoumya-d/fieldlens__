import { Share, Platform } from 'react-native';

interface ShareOptions {
  title: string;
  message: string;
  url?: string;
}

/**
 * Share content using the native share sheet.
 * Falls back gracefully if share is not available.
 */
export async function shareContent(options: ShareOptions): Promise<boolean> {
  try {
    const result = await Share.share(
      {
        title: options.title,
        message: options.url
          ? `${options.message}\n\n${options.url}`
          : options.message,
        url: Platform.OS === 'ios' ? options.url : undefined,
      },
      {
        dialogTitle: options.title, // Android only
        subject: options.title,     // Email subject
      }
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

export async function shareWorkOrderUpdate(workOrderId: string, status: string, siteName: string) {
  return shareContent({
    title: `Work Order Update — ${siteName}`,
    message: `Work order #${workOrderId} at ${siteName} is now: ${status}.`,
  });
}

export async function shareInspectionComplete(siteName: string, reportUrl?: string) {
  return shareContent({
    title: `Site Inspection Complete — ${siteName}`,
    message: `Field inspection at ${siteName} has been completed. View the PDF report:`,
    url: reportUrl,
  });
}

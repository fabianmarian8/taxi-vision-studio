export const PREVIEW_CHANNEL = 'taxi-vision-preview';

export type PreviewData = Record<string, any>;

export type PreviewMessage = 
  | { type: 'PREVIEW_UPDATE'; payload: PreviewData }
  | { type: 'PREVIEW_READY' };

export function isPreviewMessage(event: MessageEvent): boolean {
  return event.data && typeof event.data === 'object';
}

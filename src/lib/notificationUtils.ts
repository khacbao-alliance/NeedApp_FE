import type { TFunction } from 'i18next';
import type { NotificationDto } from '@/types';

/**
 * Parse the metadata JSON string from the backend.
 * Returns an empty object if null or invalid.
 */
function parseMetadata(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Get the i18n-translated content string for a notification.
 *
 * - If metadata is present, use the type-specific i18n template with interpolation.
 * - If no metadata (legacy notifications), fall back to the raw `content` from backend.
 */
export function getNotificationContent(
  notification: NotificationDto,
  t: TFunction
): string | null {
  // metadata field may be a JSON string (from API) or already a parsed object
  const rawMeta =
    typeof notification.metadata === 'string'
      ? (notification.metadata as string)
      : notification.metadata
        ? JSON.stringify(notification.metadata)
        : null;

  const meta = parseMetadata(rawMeta);

  // If no metadata fields present, fall back to raw content (legacy notifications)
  if (Object.keys(meta).length === 0) {
    return notification.content;
  }

  switch (notification.type) {
    case 'NewMessage':
      return t('notifications.typeContent.NewMessage', meta);

    case 'MissingInfo':
      return t('notifications.typeContent.MissingInfo', meta);

    case 'StatusChange':
      return t('notifications.typeContent.StatusChange', meta);

    case 'Assignment':
      // Distinguish: if staffName in metadata → admin sees "staff accepted", else → staff sees "assigned to you"
      if (meta.staffName) {
        return t('notifications.typeContent.AssignmentSelfAccept', meta);
      }
      return t('notifications.typeContent.AssignmentToMe', meta);

    case 'NewRequest':
      return t('notifications.typeContent.NewRequest', meta);

    case 'Invitation':
      return t('notifications.typeContent.Invitation', meta);

    case 'IntakeAnswerEdited':
      return t('notifications.typeContent.IntakeAnswerEdited', meta);

    default:
      return notification.content;
  }
}

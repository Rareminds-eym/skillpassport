import { apiPost } from '@/shared/api/apiClient';
import { NotificationType } from '@/features/notifications';

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function resolveUserId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isUUID(identifier)) return identifier;

  const response: any = await apiPost('/notifications', {
    action: 'resolve-users',
    identifiers: [identifier],
  });

  const data = response?.data ?? response;
  return data?.resolved?.[identifier] ?? null;
}

export async function createNotification(
  recipientIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  try {
    const recipientId = await resolveUserId(recipientIdentifier);
    if (!recipientId) {
      return { success: false, error: 'Recipient not found' };
    }

    const response: any = await apiPost('/notifications', {
      action: 'create',
      recipient_id: recipientId,
      type,
      title,
      message,
    });

    return { success: true, data: response?.data ?? response };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create notification',
    };
  }
}

export async function createBatchNotifications(
  recipientIdentifiers: string[],
  notificationType: NotificationType,
  title: string,
  message: string
) {
  try {
    const response: any = await apiPost('/notifications', {
      action: 'resolve-users',
      identifiers: recipientIdentifiers,
    });

    const data = response?.data ?? response;
    const resolved = data?.resolved ?? {};
    const notifications: Array<{
      recipient_id: string;
      type: NotificationType;
      title: string;
      message: string;
    }> = [];

    for (const [identifier, userId] of Object.entries(resolved)) {
      if (userId) {
        notifications.push({
          recipient_id: userId as string,
          type: notificationType,
          title,
          message,
        });
      }
    }

    if (notifications.length === 0) {
      return { success: false, error: 'No valid recipients found' };
    }

    const batchResponse: any = await apiPost('/notifications', {
      action: 'create-batch',
      notifications,
    });

    const batchData = batchResponse?.data ?? batchResponse;
    return {
      success: true,
      data: batchData?.data,
      count: notifications.length,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create batch notifications',
    };
  }
}

export async function createRecruiterNotification(
  recruiterIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(recruiterIdentifier, type, title, message);
}

export async function createEducatorNotification(
  educatorIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(educatorIdentifier, type, title, message);
}

export async function createlearnerNotification(
  learnerIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(learnerIdentifier, type, title, message);
}

export async function createAdminNotification(
  adminIdentifier: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return createNotification(adminIdentifier, type, title, message);
}
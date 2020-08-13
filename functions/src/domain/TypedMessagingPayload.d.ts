import * as admin from "firebase-admin";

export interface TypedMessagingPayload<T extends admin.messaging.DataMessagePayload> extends Omit<admin.messaging.MessagingPayload, 'data'>{
  data: {notificationLogId?: string} & T
}

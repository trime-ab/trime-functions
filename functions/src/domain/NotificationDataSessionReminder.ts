import * as admin from "firebase-admin";

export interface NotificationDataSessionReminder extends admin.messaging.DataMessagePayload{
  userId: string
}
import * as admin from "firebase-admin";

export interface NotificationDataNewBooking extends admin.messaging.DataMessagePayload{
  userId: string
}
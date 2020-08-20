import * as admin from "firebase-admin";

export interface NotificationDataCancelledBooking extends admin.messaging.DataMessagePayload{
    userId: string
}

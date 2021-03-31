import {NotificationLog} from "../domain/NotificationLog";
import {NotificationType} from "../domain/NotificationType";
import {Device} from "../domain/Device";
import * as admin from "firebase-admin";
import {TypedMessagingPayload} from "../domain/TypedMessagingPayload";
import {Trainer} from "../domain/Trainer";
import {Trainee} from "../domain/Trainee";
import {Session} from "../domain/Session";
import DataMessagePayload = admin.messaging.DataMessagePayload;

class NotificationService {
    private readonly COLLECTION = 'notificationLogs';

    async BookingReminderNotificationLog(devices: Device[], recipientUserId: string, subjectId: string): Promise<string> {
        const db = admin.firestore();
        const notificationLog: NotificationLog = {
            date: new Date(),
            deviceIds: devices.map(device => device.id),
            recipientUserId: recipientUserId,
            senderUserId: 'System',
            type: NotificationType.BOOKING_REMINDER,
            subjectId: subjectId,
        }

        const collectionRef = db.collection(this.COLLECTION)
        const doc = collectionRef.doc()
        await doc.set(notificationLog)
        return doc.id
    }

    async addCancelledSessionNotificationLog(devices: Device[], senderUserId: string, recipientUserId: string, subjectId: string): Promise<string> {
      const db = admin.firestore();
      const notificationLog: NotificationLog = {
        date: new Date(),
        deviceIds: devices.map(device => device.id),
        recipientUserId: recipientUserId,
        senderUserId: senderUserId,
        type: NotificationType.CANCELLED_BOOKING,
        subjectId: subjectId,
      }


      const collectionRef = db.collection(this.COLLECTION)
      const doc = collectionRef.doc()
      await doc.set(notificationLog)
      return doc.id

    }

    async addNotificationLog(devices: Device[], senderUserId: string, recipientUserId: string, subjectId: string): Promise<string> {
        const db = admin.firestore();
        const notificationLog: NotificationLog = {
            date: new Date(),
            deviceIds: devices.map(device => device.id),
            recipientUserId: recipientUserId,
            senderUserId: senderUserId,
            type: NotificationType.NEW_BOOKING,
            subjectId: subjectId,
        }
        const collectionRef = db.collection(this.COLLECTION)
        const doc = collectionRef.doc()
        await doc.set(notificationLog)
        return doc.id
    }


    async getNotificationLogs(subjectIds: string[]): Promise<NotificationLog[]> {
        const db = admin.firestore();

        const collectionRef = db.collection(this.COLLECTION).where('subjectId', 'in', subjectIds)
        const snapshot = await collectionRef.get()
        return snapshot.docs.map(d => d.data()) as NotificationLog[];
    }

    async send<T extends DataMessagePayload>(senderUserId: string, recipientUserId: string, subjectId: string, payload: TypedMessagingPayload<T>) {
        const db = admin.firestore();
        const devices = await this.getDevices(db, recipientUserId);
        const fcmKey = this.getFcmKey(devices);
        console.log(fcmKey)
        if (payload.data.type === NotificationType.NEW_BOOKING) {
            payload.data.notificationLogId = await this.addNotificationLog(devices, senderUserId, recipientUserId, subjectId)
        }
        if (payload.data.type === NotificationType.CANCELLED_BOOKING) {
            payload.data.notificationLogId = await this.addCancelledSessionNotificationLog(devices, senderUserId, recipientUserId, subjectId)
        }
        if (payload.data.type === NotificationType.BOOKING_REMINDER) {
            payload.data.notificationLogId = await this.BookingReminderNotificationLog(devices, recipientUserId, subjectId)
        }
        await admin.messaging().sendToDevice(fcmKey, payload);
    }


    private getFcmKey(devices: Device[]) {
      console.log(devices)
        return devices[0].fcmKey

    }

    private async getDevices(db: admin.firestore.Firestore, userId: string): Promise<Device[]> {
        const devicesRef = db
            .collection("devices")
            .where("userId", "==", userId);
        const devices = await devicesRef.get();
        console.log(devices)
        return devices.docs.map(d => ({id: d.id, ...d.data()})) as Device[];
    }

    async getTrainer(db: admin.firestore.Firestore, trainerId: string): Promise<Trainer> {
        const trainerRef = db.collection("trainers").doc(trainerId);
        const trainerSnapshot = await trainerRef.get();
        return { id: trainerSnapshot.id, ...trainerSnapshot.data()} as Trainer;
    }

    async getTrainee(db: admin.firestore.Firestore, traineeId: string): Promise<Trainee> {
        const traineeRef = db.collection("trainees").doc(traineeId);
        const traineeSnapshot = await traineeRef.get();

        return {id: traineeSnapshot.id, ...traineeSnapshot.data()} as Trainee;
    }

    async getSessionsForReminder(db: admin.firestore.Firestore): Promise<Session[]> {
        const now = new Date()
        const limit = new Date()
        limit.setHours(limit.getHours() + 1)

        const sessionsRef = db.collection("sessions").where('start', '>=', now).where('start', '<=', limit);
        const sessionsSnapshots = await sessionsRef.get();
        if (sessionsSnapshots.empty) {
            return [];
        }
        return sessionsSnapshots.docs.map(d => ({id: d.id, ...d.data()})) as Session[];
    }
}

export const notificationService = new NotificationService()

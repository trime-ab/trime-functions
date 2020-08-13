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

  async addNotificationLog(devices: Device[], senderUserId: string, recipientUserId: string, subjectId: string): Promise<NotificationLog> {
    const db = admin.firestore();

    const notificationLog = new NotificationLog()
    notificationLog.date = new Date()
    notificationLog.deviceIds = devices.map(device => device.id)
    notificationLog.recipientUserId = recipientUserId
    notificationLog.senderUserId = senderUserId
    notificationLog.type = NotificationType.NEW_BOOKING
    notificationLog.subjectId = subjectId

    const collectionRef = db.collection(this.COLLECTION)
    const doc = collectionRef.doc()
    await doc.set(notificationLog)

    const snapshot =  await admin.firestore()
      .collection(this.COLLECTION)
      .doc(doc.id)
      .get()
    return snapshot.data() as NotificationLog
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
    const fcmKeys = this.getFcmKeys(devices);
    const notificationLog = await this.addNotificationLog(devices, senderUserId, recipientUserId, subjectId)
    payload.data.notificationLogId = notificationLog.id
    await admin.messaging().sendToDevice(fcmKeys, payload);
  }


  private getFcmKeys(devices: Device[]) {
    const fcmKeys: string[] = [];
    devices.forEach(device => {
      device.fcmKeys.forEach(key => fcmKeys.push(key))
    });
    return fcmKeys;
  }

  private async getDevices(db: admin.firestore.Firestore, userId: string): Promise<Device[]> {
    const devicesRef = db
      .collection("devices")
      .where("userId", "==", userId);
    const devices = await devicesRef.get();
    return devices.docs.map(d => d.data()) as Device[];
  }

  async getTrainer(db: admin.firestore.Firestore, trainerId: string): Promise<Trainer> {
    const trainerRef = db.collection("trainers").doc(trainerId);
    const trainerSnapshot = await trainerRef.get();
    return trainerSnapshot.data() as Trainer;
  }

  async getTrainee(db: admin.firestore.Firestore, traineeId: string): Promise<Trainee> {
    const traineeRef = db.collection("trainees").doc(traineeId);
    const traineeSnapshot = await traineeRef.get();
    return traineeSnapshot.data() as Trainee;
  }

  async getSessionsForReminder(db: admin.firestore.Firestore): Promise<Session[]> {
    const now = new Date()
    const limit = new Date()
    limit.setHours(limit.getHours() + 1)

    const sessionsRef = db.collection("sessions").where('start', '>=', now).where('start', '<=', limit);
    const sessionsSnapshots = await sessionsRef.get();
    return sessionsSnapshots.docs.map(d => d.data()) as Session[];
  }
}

export const notificationService = new NotificationService()
import * as admin from "firebase-admin";
import {notificationService} from "./Notification.service";
import {Trainer} from "../domain/Trainer";
import {Trainee} from "../domain/Trainee";
import {EventContext} from "firebase-functions";
import {Session} from "../domain/Session";
import {TypedMessagingPayload} from "../domain/TypedMessagingPayload";
import {NotificationDataNewBooking} from "../domain/NotificationDataNewBooking";
import {NotificationDataSessionReminder} from "../domain/NotificationDataSessionReminder";
import {NotificationLog} from "../domain/NotificationLog";
import {NotificationDataCancelledBooking} from "../domain/NotificationDataCancelledBooking";

class NotificationsFunctions {
  async bookingReminder(_context: EventContext) {
    const db = admin.firestore();

    const sessions = await notificationService.getSessionsForReminder(db)

    const traineeIds = sessions.map(s => s.traineeId)
    const trainerIds = sessions.map(s => s.traineeId)
    const trainees: Trainee[] = await Promise.all(traineeIds.map(async (id) => notificationService.getTrainee(db, id)));
    const trainers: Trainer[] = await Promise.all(trainerIds.map(async (id) => notificationService.getTrainer(db, id)));

    const logs = await notificationService.getNotificationLogs(sessions.map(s => s.id))

    for (const session of sessions) {
      const trainer = trainers.find(t => t.id === session.trainerId)
      const trainee = trainees.find(t => t.id === session.traineeId)

      if (this.sessionReminderHasNotBeenSent(logs, session, trainee.id)) {
        await this.sendTraineeSessionReminder(session, trainer, trainee);
      }
      if (this.sessionReminderHasNotBeenSent(logs, session, trainer.id)) {
        await this.sendTrainerSessionReminder(session, trainer, trainee);
      }
    }
  }

  private async sendTraineeSessionReminder(session: Session, trainer: Trainer, trainee: Trainee) {
    const payload: TypedMessagingPayload<NotificationDataSessionReminder> = {
      notification: {
        title: 'Reminder: upcoming session',
        body: `Your ${session.name} session with ${trainer.firstName} ${trainer.lastName} is due to start within an hour`
      },
      data: {
        userId: trainee.userId,
      }
    };
    await notificationService.send(trainer.userId, trainee.userId, session.id, payload)
    console.log(
      `Session reminder notification has been successfully sent to ${trainee?.firstName} ${trainee?.lastName}`
    );
  }

  private async sendTrainerSessionReminder(session: Session, trainer: Trainer, trainee: Trainee) {
    const payload: TypedMessagingPayload<NotificationDataSessionReminder> = {
      notification: {
        title: 'Reminder: upcoming session',
        body: `Your ${session.name} session with ${trainee.firstName} ${trainee.lastName} is due to start within an hour`
      },
      data: {
        userId: trainer.userId,
      }
    };

    await notificationService.send(trainee.userId, trainer.userId, session.id, payload)
    console.log(
      `Session reminder notification has been successfully sent to ${trainee?.firstName} ${trainee?.lastName}`
    );
  }

  private sessionReminderHasNotBeenSent(logs: NotificationLog[], session: Session, recipientUserId: string) {
    return !logs.some(log => log.subjectId === session.id && log.recipientUserId === recipientUserId);
  }

  async onBookedDeal(snap: any) {
    const sessionData = snap.data();

    const db = admin.firestore();

    const trainee = await notificationService.getTrainee(db, sessionData.traineeId);
    const trainer = await notificationService.getTrainer(db, sessionData.trainerId);

    const payload: TypedMessagingPayload<NotificationDataNewBooking> = {
      notification: {
        title: "New session booked!",
        body: `${trainee?.firstName} ${trainee?.lastName} booked a new session with you.`
      },
      data: {
        userId: trainer.userId,
      }
    };

    await notificationService.send(trainee.userId, trainer.userId, trainee.userId, payload)

    console.log(
      `Message has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`
    );
  }

  async onCancelledDeal(snap: any) {
    const sessionData = snap.data();

    const db = admin.firestore();

    const trainee = await notificationService.getTrainee(db, sessionData.traineeId);
    const trainer = await notificationService.getTrainer(db, sessionData.trainerId);

    if (sessionData.cancelledBy === 'trainee') {
      const payload: TypedMessagingPayload<NotificationDataCancelledBooking> = {
        notification: {
          title: "Your booking was cancelled!",
          body: `your booking for ${sessionData.start} was cancelled by ${trainee.firstName} ${trainee.lastName}.`
        },
        data: {
          userId: trainer.userId
        }
      }
      await notificationService.send(trainee.userId, trainer.userId, trainee.userId, payload)
      console.log(
          `Message has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`)
    }
    if (sessionData.cancelledBy === 'trainer') {
      const payload: TypedMessagingPayload<NotificationDataCancelledBooking> = {
        notification: {
          title: "Your booking was cancelled!",
          body: `your booking for ${sessionData.start} was cancelled by ${trainer.firstName} ${trainer.lastName}.`
        },
        data: {
          userId: trainee.userId
        }
      }
      await notificationService.send(trainer.userId, trainee.userId, trainee.userId, payload)
      console.log(
          `Message has been successfully sent to ${trainee?.firstName} ${trainee?.lastName}`)
    }

  }
}

export const notificationsFunctions = new NotificationsFunctions();

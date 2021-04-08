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
import {NotificationType} from "../domain/NotificationType";

import {managementService} from "../Management/Management.service";

class NotificationsFunctions {
  async bookingReminder(_context: EventContext) {
    const db = admin.firestore();

    const sessions = (await notificationService.getSessionsForReminder(db)).filter(s => s.traineeId && s.trainerId)

    if (!!sessions.length) {
      const traineeIds = new Set<string>()
      sessions.forEach(s => traineeIds.add(s.traineeId))
      const trainerIds = new Set<string>()
      sessions.forEach(s => trainerIds.add(s.trainerId))

      const trainees: Trainee[] = await Promise.all(Array.from(traineeIds).map(async (id) => notificationService.getTrainee(db, id)));
      const trainers: Trainer[] = await Promise.all(Array.from(trainerIds).map(async (id) => notificationService.getTrainer(db, id)));

      const logs = await notificationService.getNotificationLogs(sessions.map(s => s.id))

      sessions.filter(s => s.cancelled === false)

      for (const session of sessions) {
        if (!session.cancelled) {
          const trainee = trainees.find(t => t.id === session.traineeId)
          const trainer = trainers.find(t => t.id === session.trainerId)

          if (this.sessionReminderHasNotBeenSent(logs, session, trainee.userId)) {
            await this.sendTraineeSessionReminder(session, trainer, trainee);
          }

          if (this.sessionReminderHasNotBeenSent(logs, session, trainer.userId)) {
            await this.sendTrainerSessionReminder(session, trainer, trainee);
          }
        }
      }
    }
  }

  private async sendTraineeSessionReminder(session: Session, trainer: Trainer, trainee: Trainee) {
    if (trainee.notificationSettings.events) {
      if (!session.cancelled) {
          const start = session?.start.toDate();
          let minutes = String(start?.getMinutes())
          if (minutes.length === 1) {
            minutes = `0${minutes}`
          }
          const payload: TypedMessagingPayload<NotificationDataSessionReminder> = {
          notification: {
            title: 'Reminder: upcoming session',
            body: `Your ${session?.name} session with ${trainer?.firstName} ${trainer?.lastName} is due to start at ${start?.getHours()}:${minutes}`,
            badge: '1',
            sound: 'default',

          },
          data: {
            userId: trainee?.userId,
            type: NotificationType.BOOKING_REMINDER,
            sessionId: session.id,
          }
        };
        await notificationService.send(trainer?.userId, trainee?.userId, session?.id, payload)
        console.log(
          `Session reminder notification has been successfully sent to ${trainee?.firstName} ${trainee?.lastName}`
        );
      }
    }
  }

  private async sendTrainerSessionReminder(session: Session, trainer: Trainer, trainee: Trainee) {
    if (trainer.notificationSettings.events) {
      if (!session.cancelled) {
        const start = session?.start.toDate();
        let minutes = String(start?.getMinutes())
        if (minutes.length === 1) {
          minutes = `0${minutes}`
        }
        const payload: TypedMessagingPayload<NotificationDataSessionReminder> = {
          notification: {
            title: 'Reminder: upcoming session',
            body: `Your ${session.name} session with ${trainee?.firstName} ${trainee?.lastName} is due to start at ${start?.getHours()}:${minutes}`,
            badge: '1',
            sound: 'default',
          },
          data: {
            userId: trainer?.userId,
            type: NotificationType.BOOKING_REMINDER,
            sessionId: session.id,
          }
        };

        await notificationService.send(trainee?.userId, trainer?.userId, session?.id, payload)
        console.log(
          `Session reminder notification has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`
        );
      }
    }
  }

  private sessionReminderHasNotBeenSent(logs: NotificationLog[], session: Session, recipientUserId: string) {
    return !logs.some(log => log.subjectId === session.id && log.recipientUserId === recipientUserId);
  }

  async onBookedDeal(change: any) {
    const sessionId = change.after.id
    const sessionDataBefore: Session = change.before.data();
    const sessionDataAfter: Session = change.after.data();

    const db = admin.firestore();

    const trainee = await notificationService.getTrainee(db, sessionDataAfter.traineeId);
    const trainer = await notificationService.getTrainer(db, sessionDataAfter.trainerId);

    if (sessionDataBefore.paid === false && sessionDataAfter.paid === true) {
      if (trainer.notificationSettings.events) {
        const payload: TypedMessagingPayload<NotificationDataNewBooking> = {
          notification: {
            title: "New session booked!",
            body: `${trainee?.firstName} ${trainee?.lastName} booked a new session with you.`,
            badge: '1',
            sound: 'default',
          },
          data: {
            userId: trainer.userId,
            type: NotificationType.NEW_BOOKING,
            sessionId: sessionId
          },
        };


        await notificationService.send(trainee.userId, trainer.userId, trainee.userId, payload)


        console.log(
          `Message has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`
        );
      }
    }
  }

  async sendTrainerVerifiedNotification(change: any) {
    const trainerId = change.after.id
    const trainer = change.after.data();
    const beforeChange = change.before.data();
    if (beforeChange.isApproved !== trainer.isApproved) {
      if (trainer.notificationSettings.events) {
        if (trainer.isApproved) {
          await managementService.addVerificationEvent(trainerId)
          const payload: TypedMessagingPayload<NotificationDataSessionReminder> = {
            notification: {
              title: 'You have been approved!',
              body: 'A Trime human has approved your profile! Trainees can see you now!',
              badge: '1',
              sound: 'default',
            },
            data: {
              userId: trainer.userId
            }
          };
          await notificationService.send(null, trainer.userId, trainer.userId, payload)
          console.log(
            `Trainer verified notification has been successfully sent to ${trainer.firstName}`
          );
        }
      }
    }
  }

  async triggerCancelledDeal(data: { sessionName: string, traineeId: string, trainerId: string}) {
    const {sessionName, traineeId, trainerId } = data

    const db = admin.firestore();
    const trainee: Trainee = await notificationService.getTrainee(db, traineeId);
    const trainer: Trainer = await notificationService.getTrainer(db, trainerId);

    if (trainee.notificationSettings.events) {
      const payload: TypedMessagingPayload<NotificationDataCancelledBooking> = {
        notification: {
          title: "Your booking was cancelled!",
          body: `your booking for ${sessionName} with ${trainee.firstName} ${trainee.lastName} was cancelled.`,
          badge: '1',
          sound: 'default',
        },
        data: {
          userId: trainer.userId,
          type: NotificationType.CANCELLED_BOOKING
        }
      }
      await notificationService.send(trainee.userId, trainer.userId, trainee.userId, payload)
      console.log(
        `Message has been successfully sent to ${trainer.firstName} ${trainer.lastName}`)
    }

    if (trainee.notificationSettings.events) {
      const payload: TypedMessagingPayload<NotificationDataCancelledBooking> = {
        notification: {
          title: "Your booking was cancelled!",
          body: `your booking for ${sessionName} with ${trainer.firstName} ${trainer.lastName} was cancelled.`,
          badge: '1',
          sound: 'default',
        },
        data: {
          userId: trainee.userId,
          type: NotificationType.CANCELLED_BOOKING
        }
      }
      await notificationService.send(trainer.userId, trainee.userId, trainee.userId, payload)
      console.log(
        `Message has been successfully sent to ${trainee.firstName} ${trainee.lastName}`)
    }
  }

}

export const notificationsFunctions = new NotificationsFunctions();

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

            for (const session of sessions) {

                const trainee = trainees.find(t => t.id === session.traineeId)

                const trainer = trainers.find(t => t.id === session.trainerId)
                console.log('works up to here')

                if (this.sessionReminderHasNotBeenSent(logs, session, trainee.id)) {
                    console.log('I am the hammer')
                    await this.sendTraineeSessionReminder(session, trainer, trainee);
                    console.log('I am the tip of his spear')
                }
                console.log('The mail about his fist')
                if (this.sessionReminderHasNotBeenSent(logs, session, trainer.id)) {
                    console.log('I am the bane of his foes')
                    await this.sendTrainerSessionReminder(session, trainer, trainee);
                    console.log('And the woes of the treacherous')
                }
            }
        }
    }

    private async sendTraineeSessionReminder(session: Session, trainer: Trainer, trainee: Trainee) {
        if (trainee.notificationSettings.events) {
            const payload: TypedMessagingPayload<NotificationDataSessionReminder> = {
                notification: {
                    title: 'Reminder: upcoming session',
                    body: `Your ${session?.name} session with ${trainer?.firstName} ${trainer?.lastName} is due to start within an hour`,
                    badge: '1'
                },
                data: {
                    userId: trainee?.userId,
                }
            };
            await notificationService.send(trainer?.userId, trainee?.userId, session?.id, payload)
            console.log(
                `Session reminder notification has been successfully sent to ${trainee?.firstName} ${trainee?.lastName}`
            );
        }
    }

    private async sendTrainerSessionReminder(session: Session, trainer: Trainer, trainee: Trainee) {
        if (trainer.notificationSettings.events) {
            const payload: TypedMessagingPayload<NotificationDataSessionReminder> = {
                notification: {
                    title: 'Reminder: upcoming session',
                    body: `Your ${session.name} session with ${trainee?.firstName} ${trainee?.lastName} is due to start within an hour`,
                    badge: '1'
                },
                data: {
                    userId: trainer?.userId,
                }
            };

            await notificationService.send(trainee?.userId, trainer?.userId, session?.id, payload)
            console.log(
                `Session reminder notification has been successfully sent to ${trainee?.firstName} ${trainee?.lastName}`
            );
        }
    }

    private sessionReminderHasNotBeenSent(logs: NotificationLog[], session: Session, recipientUserId: string) {
        console.log(session)
        return !logs.some(log => log.subjectId === session.id && log.recipientUserId === recipientUserId);
    }

    async onBookedDeal(snap: any) {
        const sessionId = snap.id
        const sessionData = snap.data();

        const db = admin.firestore();

        const trainee = await notificationService.getTrainee(db, sessionData.traineeId);
        const trainer = await notificationService.getTrainer(db, sessionData.trainerId);

        if (trainer.notificationSettings.events) {
            const payload: TypedMessagingPayload<NotificationDataNewBooking> = {
                notification: {
                    title: "New session booked!",
                    body: `${trainee?.firstName} ${trainee?.lastName} booked a new session with you.`,
                    badge: '1',
                },
                data: {
                    userId: trainer.userId,
                    type: NotificationType.NEW_BOOKING,
                    trainerCalender: trainer.calenderSettings.calenderId,
                    sessionId: sessionId
                },
            };

            await notificationService.send(trainee.userId, trainer.userId, trainee.userId, payload)

            console.log(
                `Message has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`
            );
        }
    }

    async onCancelledDeal(change: any) {
        const sessionData = change.after.data();
        if (sessionData.cancelled === true) {
            const db = admin.firestore();

            const trainee = await notificationService.getTrainee(db, sessionData.traineeId);
            const trainer = await notificationService.getTrainer(db, sessionData.trainerId);

            if (sessionData.cancelledByUserType === 'TRAINEE') {
                if (trainer.notificationSettings.events) {
                    const payload: TypedMessagingPayload<NotificationDataCancelledBooking> = {
                        notification: {
                            title: "Your booking was cancelled!",
                            body: `your booking for ${sessionData.start} was cancelled by ${trainee.firstName} ${trainee.lastName}.`,
                            badge: '1',
                        },
                        data: {
                            userId: trainer.userId,
                            type: NotificationType.CANCELLED_BOOKING
                        }
                    }
                    console.log(payload)
                    await notificationService.send(trainee.userId, trainer.userId, trainee.userId, payload)
                    console.log(
                        `Message has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`)
                }
            }
            if (sessionData.cancelledByUserType === 'TRAINER') {
                if (trainee.notificationSettings.events) {
                    const payload: TypedMessagingPayload<NotificationDataCancelledBooking> = {
                        notification: {
                            title: "Your booking was cancelled!",
                            body: `your booking for ${sessionData.start} was cancelled by ${trainer.firstName} ${trainer.lastName}.`,
                            badge: '1',
                        },
                        data: {
                            userId: trainee.userId,
                            type: NotificationType.CANCELLED_BOOKING
                        }
                    }
                    console.log(payload)
                    await notificationService.send(trainer.userId, trainee.userId, trainer.userId, payload)
                    console.log(
                        `Message has been successfully sent to ${trainee?.firstName} ${trainee?.lastName}`)
                }
            }

        }
    }
}

export const notificationsFunctions = new NotificationsFunctions();

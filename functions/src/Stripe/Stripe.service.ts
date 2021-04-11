import * as admin from "firebase-admin";
import {Trainer} from "../domain/Trainer";
import {Trainee} from "../domain/Trainee";
import {Payment} from "../domain/Payment";
import {Session} from "../domain/Session";

class StripeService {

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

  async getPayment(db: admin.firestore.Firestore, paymentId: string): Promise<Payment> {
    const paymentRef = db.collection("payments").doc(paymentId)
    const paymentSnapshot = await paymentRef.get()

    return {id: paymentSnapshot.id, ...paymentSnapshot.data()} as Payment
  }

  async getSessions(db: admin.firestore.Firestore ): Promise<Session[]> {
    const sessions: Session[] = []

    const sessionsRef = db.collection('sessions')
    const sessionsSnapshot = await sessionsRef.where('paid', '==', false).get()

    await sessionsSnapshot.forEach(s => {
      const session = {id: s.id, ...s.data()}
      sessions.push(session as Session)
    })
    return sessions
  }

  async getPaymentsFromSession(db: admin.firestore.Firestore, sessionId: string): Promise<Payment[]> {
    const payments: Payment[] = []

    const paymentRef = db.collection("payments")
    const paymentsSnapshot = await paymentRef.where('sessionId', '==', sessionId).get()

    await paymentsSnapshot.forEach(p => {
      const payment = {id: p.id, ...p.data()}
      payments.push(payment as Payment)
    })

    return payments
  }

  async markPaymentAsPaid(db: admin.firestore.Firestore, paymentId: string) {
    const paymentRef = db.collection("payments").doc(paymentId)
    await paymentRef.get().then((doc) => {
      if (doc.exists) {
        paymentRef.update({successful: true})
      }
      return
    })
  }

  async markSessionAsPaid(db: admin.firestore.Firestore, sessionId: string) {
    const sessionRef = db.collection('sessions').doc(sessionId)
    await sessionRef.get().then((doc) => {
      if (doc.exists) {
        sessionRef.update({paid: true})
      }
      return
    })
  }
}

export const stripeService = new StripeService()

import * as admin from "firebase-admin";
import {Trainer} from "../domain/Trainer";
import {Trainee} from "../domain/Trainee";
import {Payment} from "../domain/Payment";

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
}

export const stripeService = new StripeService()

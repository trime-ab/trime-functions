import * as admin from "firebase-admin";
import {Trainee} from "../domain/Trainee";
import {Trainer} from "../domain/Trainer";

class ManagementService {
    private readonly COLLECTION = 'events';
    async getTrainee(db: admin.firestore.Firestore, traineeId: string): Promise<Trainee> {
        const traineeRef = db.collection("trainees").doc(traineeId);
        const traineeSnapshot = await traineeRef.get();
        return traineeSnapshot.data() as Trainee;
    }

    async getTrainer(db: admin.firestore.Firestore, trainerId: string): Promise<Trainer> {
        const trainerRef = db.collection("trainers").doc(trainerId);
        const trainerSnapshot = await trainerRef.get();
        return trainerSnapshot.data() as Trainer;
    }
    async addVerificationEvent(trainerId): Promise<string> {
        const db = admin.firestore();
        const verificationEvent = {
            created: new Date(),
            modified: new Date(),
            refModelId: trainerId,
            seenByTrainee: false,
            seenByTrainer: false,
            traineeId: null,
            trainerId: trainerId,
            type:'VERIFIED',
        }
        const collectionRef = db.collection(this.COLLECTION)
        const doc = collectionRef.doc()
        await doc.set(verificationEvent)
        return doc.id
    }
}

export const managementService = new ManagementService()

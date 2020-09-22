import * as admin from "firebase-admin";
import {Trainee} from "../domain/Trainee";
import {Trainer} from "../domain/Trainer";

class ManagementService {
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
}

export const managementService = new ManagementService()

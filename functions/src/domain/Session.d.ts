import * as admin from "firebase-admin";

export interface Session {
  id: string
  start: admin.firestore.Timestamp
  name: string
  trainerId: string
  traineeId: string
  cancelled: boolean
  paid: boolean
}

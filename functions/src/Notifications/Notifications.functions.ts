import admin = require("firebase-admin");

class NotificationsFunctions {
  async onBookedDeal(snap: any) {
    // getting session
    const sessionData = snap.data();
    const traineeId = sessionData.traineeId;
    const trainerId = sessionData.trainerId;
    const startTime = sessionData.start;

    const db = admin.firestore();

    // getting the trainee
    const traineeRef = db.collection("trainees").doc(traineeId);
    const traineeSnapshot = await traineeRef.get();
    const trainee = traineeSnapshot.data();

    // getting the trainer
    const trainerRef = db.collection("trainers").doc(trainerId);
    const trainerSnapshot = await trainerRef.get();
    const trainer = trainerSnapshot.data();

    // Notification Content`

    const payload = {
      notification: {
        title: "New session booked!",
        body: `${trainee?.firstName} ${trainee?.lastName} booked a new session with you on ${startTime}`,
      },
    };

    // fetching device keys and sending notification
    const devicesRef = db
      .collection("devices")
      .where("userId", "==", trainer?.userId);
    const devices = await devicesRef.get();

    let fcmKeys: string[] = [];

    devices.forEach((result) => {
      const fcmKey = result.data().fcmKeys;

      fcmKeys = fcmKey;
    });
    console.log(`Message has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`)
    return admin.messaging().sendToDevice(fcmKeys, payload);

  }

  async bookedDealTest(data: { traineeId: string; trainerId: string }) {
    const db = admin.firestore();

    // getting the trainee
    const traineeRef = db.collection("trainees").doc(data.traineeId);
    const traineeSnapshot = await traineeRef.get();
    const trainee = traineeSnapshot.data();

    // getting the trainer
    const trainerRef = db.collection("trainers").doc(data.trainerId);
    const trainerSnapshot = await trainerRef.get();
    const trainer = trainerSnapshot.data();

    // notification details

    const payload = {
      notification: {
        title: "New session booked!",
        body: `${trainee?.firstName} ${trainee?.lastName} booked a new session`,
      },
    };

    // fetching device keys
    const devicesRef = db
      .collection("devices")
      .where("userId", "==", trainer?.userId);
    const devices = await devicesRef.get();

    let fcmKeys: string[] = [];

    devices.forEach((result) => {
      const fcmKey = result.data().fcmKeys;

      fcmKeys = fcmKey;
    });
    console.log(`Message has been successfully sent to ${trainer?.firstName} ${trainer?.lastName}`)
    return admin.messaging().sendToDevice(fcmKeys, payload);

  }
}

export const notificationsFunctions = new NotificationsFunctions();

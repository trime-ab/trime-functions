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

    // fetching device keys
    const devicesRef = db.collection("devices")
    const queries: Promise<FirebaseFirestore.QuerySnapshot>[] = trainerId.fcmKeys
    .map((fcmKeys: { "": any; }) => {
      return devicesRef.where('fcmKeys', "==", fcmKeys).get();
    });

    // Notification Content

    const payload = {
      notification: {
        title: "New session booked"!,
        body: `${trainee.firstName} ${trainee.lastName} has booked a session with you on ${startTime}`,
      },
    };

    return Promise.all(queries)
      .then((querySnapshots) => {
        const tokens: any = [];
        querySnapshots.forEach((snapShot) => {
          if (snapShot) {
            snapShot.docs.forEach((doc) => {
              if (doc) {
                const token = doc.data().token;
                if (token) {
                  tokens.push(token);
                }
              }
            });
          }
        });

        if (tokens.length === 0) {
          return Promise.resolve(null);
        } else {
          return admin.messaging().sendToDevice(tokens, payload);
        }
      })
      .catch((error) => {
        console.error(error);
        return Promise.resolve(null);
      });
  }
}

export const notificationsFunctions = new NotificationsFunctions();

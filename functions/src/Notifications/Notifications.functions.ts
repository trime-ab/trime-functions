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

    // fetching device keys
    const devicesRef = db.collection("devices");
    const queries: Promise<FirebaseFirestore.QuerySnapshot>[] = trainerId.fcmKeys
      .map((fcmKeys: string[]) => {
      return devicesRef.where("userId", "==", trainer.userId).get();
    });
    console.log(queries)

    // Notification Content`

    const payload = {
      notification: {
        title: "New session booked!",
        body: `${trainee?.firstName} ${trainee?.lastName} booked a new session with you on ${startTime}`,
      },
    };

    return Promise.all(queries)
      .then((querySnapshots) => {
        const fcmKeys: any = [];
        querySnapshots.forEach((snapShot) => {
          if (snapShot) {
            snapShot.docs.forEach((doc) => {
              if (doc) {
                const fcmKey = doc.data().fcmKeys;
                if (fcmKey) {
                  fcmKeys.push(fcmKey);
                }
              }
            });
          }
        });

        if (fcmKeys.length === 0) {
          return Promise.resolve(null);
        } else {
          return admin.messaging().sendToDevice(fcmKeys, payload);
        }
      })
      .catch((error) => {
        console.error(error);
        return Promise.resolve(null);
      });
  }
  async traineeSessionReminder(snap: any) {
    // getting session data
    const sessionData = snap.data();
    const traineeId = sessionData.traineeId;
    const trainerId = sessionData.trainerId;
    const startTime = sessionData.start;

    const db = admin.firestore();

    // getting trainer Ref
    const trainerRef = db.collection("trainers").doc(trainerId);
    const trainerSnapshot = await trainerRef.get();
    const trainer = trainerSnapshot.data();

    // getting trainee data
    const traineeRef = db.collection("trainees").doc(traineeId);
    const traineeSnapshot = await traineeRef.get();
    const trainee = traineeSnapshot.data();

    // fetching device Keys
    const devicesRef = db.collection("devices");
    const queries: Promise<FirebaseFirestore.QuerySnapshot>[] = traineeId.fcmKeys
        .map((fcmKeys: string[]) => {
          return devicesRef.where("userId", "==", trainee.userId).get();
        });
    console.log(queries)

    // notification Content

    const payload  = {
      notification: {
        title: "Session Reminder" ,
        body: `You have a session in one hour with ${trainer?.firstName} ${trainer?.lastName}`
      }
    };



    return Promise.all(queries)
        .then((querySnapshots) => {
          const fcmKeys: any = [];
          querySnapshots.forEach((snapShot) => {
            if (snapShot) {
              snapShot.docs.forEach((doc) => {
                if (doc) {
                  const fcmKey = doc.data().fcmKeys;
                  if (fcmKey) {
                    fcmKeys.push(fcmKey);
                  }
                }
              });
            }
          });

          if (fcmKeys.length === 0) {
            return Promise.resolve(null);
          } else {
            return admin.messaging().sendToDevice(fcmKeys, payload);
          }
        })
        .catch((error) => {
          console.error(error);
          return Promise.resolve(null);
        });
  }


}

export const notificationsFunctions = new NotificationsFunctions();

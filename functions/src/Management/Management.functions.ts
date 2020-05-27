import admin = require("firebase-admin");

class ManagementFunctions {
async changeUID() {

    const email = "trainer@trime.app";

    const newUserOverrides = {
        uid: "ST22SPGTuwOMpMmtKguKJcnnTun1",
        password: 'trainer',
    };



    console.log("Starting update for user with email:", email);
    const oldUser = await admin.auth().getUserByEmail(email);
    console.log("Old user found:", oldUser);

    await admin.auth().deleteUser(oldUser.uid);
    console.log("Old user deleted.");

    const dataToTransfer_keys = ["email", "uid", "password"];
    const newUserData = {};
    for (const key of dataToTransfer_keys) {
        newUserData[key] = oldUser[key];
    }
    Object.assign(newUserData, newUserOverrides);
    console.log("New user data ready: ", newUserData);

    const newUser = await admin.auth().createUser(newUserData);
    console.log("New user created: ", newUser);
}

}

export const managementFunctions = new ManagementFunctions();
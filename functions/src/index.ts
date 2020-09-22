import * as functions from "firebase-functions";

import mailChimpFunctions from "./MailChimp/MailChimp.functions";
import {stripeFunctions} from "./Stripe/Stripe.functions";
import {notificationsFunctions} from "./Notifications/Notifications.functions";
import {managementFunctions} from "./Management/Management.functions";

const admin = require("firebase-admin");
admin.initializeApp({});

exports.mailchimp = {
    add: functions.https.onRequest(mailChimpFunctions.add),
};

exports.notifications = {
    onBookedDeal: functions.firestore.document('sessions/{sessions}').onCreate(notificationsFunctions.onBookedDeal),
    onCancelledDeal: functions.firestore.document('sessions/{sessions}').onUpdate(notificationsFunctions.onCancelledDeal),
};

exports.bookingReminderNotification = functions.pubsub.schedule('every 5 minutes').onRun(context => notificationsFunctions.bookingReminder(context));

exports.stripe = {
    createCustomer: functions.https.onCall(stripeFunctions.createCustomer),
    updateDefaultPayment: functions.https.onCall(stripeFunctions.updateDefaultPayment),
    createCustomerCard: functions.https.onCall(stripeFunctions.createCustomerCard),
    createCustomerSetupIntent: functions.https.onCall(stripeFunctions.createCustomerSetupIntent),
    addCardToCustomer: functions.https.onCall(stripeFunctions.addCardToCustomer),
    getPaymentMethod: functions.https.onCall(stripeFunctions.getPaymentMethod),
    getCustomer: functions.https.onCall(stripeFunctions.getCustomer),
    deleteCard: functions.https.onCall(stripeFunctions.deleteCard),
    deleteCustomer: functions.https.onCall(stripeFunctions.deleteCustomer),
    createAccount: functions.https.onCall(stripeFunctions.createAccount),
    addBankToAccount: functions.https.onCall(stripeFunctions.addBankToAccount),
    createBankAccountToken: functions.https.onCall(stripeFunctions.createBankAccountToken),
    getAccount: functions.https.onCall(stripeFunctions.getAccount),
    deleteBankAccount: functions.https.onCall(stripeFunctions.deleteBankAccount),
    deleteAccount: functions.https.onCall(stripeFunctions.deleteAccount),
    createPaymentIntent: functions.https.onCall(stripeFunctions.createPaymentIntent),
    createRefund: functions.https.onCall(stripeFunctions.createRefund),
    updateVat: functions.https.onCall(stripeFunctions.updateVat),
};

exports.management = {
    changeUID: functions.https.onCall(managementFunctions.changeUID),
    traineeWelcomeEmail: functions.firestore.document('trainees/{trainees}').onCreate(managementFunctions.traineeWelcomeEmail),
};

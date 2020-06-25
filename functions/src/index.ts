import * as functions from "firebase-functions";

import mailChimpFunctions from "./mailChimp/mailChimp.functions";
import { stripeFunctions } from "./Stripe/Stripe.functions";
import { notificationsFunctions } from "./Notifications/Notifications.functions";
import {managementFunctions} from "./Management/Management.functions";

const admin = require("firebase-admin");
admin.initializeApp({});

exports.mailchimp = {
  add: functions.https.onRequest(mailChimpFunctions.add),
};

exports.stripe = {
  createCustomer: functions.https.onCall(stripeFunctions.createCustomer),
  addCardToCustomer: functions.https.onCall(stripeFunctions.addCardToCustomer),
  getCustomer: functions.https.onCall(stripeFunctions.getCustomer),
  deleteCard: functions.https.onCall(stripeFunctions.deleteCard),
  deleteCustomer: functions.https.onCall(stripeFunctions.deleteCustomer),
  createAccount: functions.https.onCall(stripeFunctions.createAccount),
  addBankToAccount: functions.https.onCall(stripeFunctions.addBankToAccount),
  addCardToAccount: functions.https.onCall(stripeFunctions.addCardToAccount),
  getAccount: functions.https.onCall(stripeFunctions.getAccount),
  deleteBankAccount: functions.https.onCall(stripeFunctions.deleteBankAccount),
  deleteAccount: functions.https.onCall(stripeFunctions.deleteAccount),
  createPaymentIntent: functions.https.onCall(stripeFunctions.createPaymentIntent),
  updateVat: functions.https.onCall(stripeFunctions.updateVat),
};

exports.notifications = {
  onBookedDeal: functions.firestore.document("sessions/{sessions}").onCreate(notificationsFunctions.onBookedDeal),
  onBookedDealTest: functions.https.onCall(notificationsFunctions.bookedDealTest),
};

exports.management = {
  changeUID: functions.https.onCall(managementFunctions.changeUID)
};
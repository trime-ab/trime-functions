import * as functions from 'firebase-functions'

import mailChimpFunctions from './MailChimp/MailChimp.functions'
import { stripeFunctions } from './Stripe/Stripe.functions'
import { notificationsFunctions } from './Notifications/Notifications.functions'
import { managementFunctions } from './Management/Management.functions'

const admin = require('firebase-admin')
admin.initializeApp({})

exports.mailchimp = {
  add: functions.https.onRequest(mailChimpFunctions.add),
}

exports.notifications = {
  onBookedDeal: functions.firestore
    .document('sessions/{sessions}')
    .onUpdate(notificationsFunctions.onBookedDeal),
  onCancelledDeal: functions.firestore
    .document('sessions/{sessions}')
    .onUpdate(notificationsFunctions.onCancelledDeal),
  trainerVerificationNotification: functions.firestore
    .document('trainers/{trainers}')
    .onUpdate(notificationsFunctions.sendTrainerVerifiedNotification),
}

exports.bookingReminderNotification = functions.pubsub
  .schedule('every 30 minutes')
  .onRun((context) => notificationsFunctions.bookingReminder(context))

exports.stripe = {
  createCustomer: functions.https.onCall(stripeFunctions.createCustomer),
  updateDefaultPayment: functions.https.onCall(
    stripeFunctions.updateDefaultPayment,
  ),
  createCustomerCard: functions.https.onCall(
    stripeFunctions.createCustomerCard,
  ),
  createCustomerSetupIntent: functions.https.onCall(
    stripeFunctions.createCustomerSetupIntent,
  ),
  getPaymentMethod: functions.https.onCall(stripeFunctions.getPaymentMethod),
  getCustomer: functions.https.onCall(stripeFunctions.getCustomer),
  deleteCard: functions.https.onCall(stripeFunctions.deleteCard),
  createAccount: functions.https.onCall(stripeFunctions.createAccount),
  addBankToAccount: functions.https.onCall(stripeFunctions.addBankToAccount),
  createTrainerBankAccount: functions.https.onCall(
    stripeFunctions.createTrainerBankAccount,
  ),
  getAccount: functions.https.onCall(stripeFunctions.getAccount),
  deleteBankAccount: functions.https.onCall(stripeFunctions.deleteBankAccount),
  createRefund: functions.https.onCall(stripeFunctions.createRefund),
  createTraineeInvoice: functions.https.onCall(
    stripeFunctions.createTraineeInvoice,
  ),
  createTraineeInvoiceItem: functions.https.onCall(
    stripeFunctions.createTraineeInvoiceItem,
  ),
  finaliseInvoice: functions.https.onCall(stripeFunctions.finaliseInvoice),
  retrievePaymentIntent: functions.https.onCall(
    stripeFunctions.retrievePaymentIntent,
  ),
  updateCustomerDetails: functions.https.onCall(
    stripeFunctions.updateCustomerDetails,
  ),
  updateAccountDetails: functions.https.onCall(
    stripeFunctions.updateAccountDetails,
  ),
}

exports.management = {
  changeUID: functions.https.onCall(managementFunctions.changeUID),
  traineeWelcomeEmail: functions.firestore
    .document('trainees/{trainees}')
    .onCreate(managementFunctions.traineeWelcomeEmail),
  trainerWelcomeEmail: functions.firestore
    .document('trainers/{trainers}')
    .onCreate(managementFunctions.trainerWelcomeEmail),
}

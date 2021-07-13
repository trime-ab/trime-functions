import * as functions from 'firebase-functions'

import mailChimpFunctions from './MailChimp/MailChimp.functions'
import {stripeFunctions} from './Stripe/Stripe.functions'
import {notificationsFunctions} from './Notifications/Notifications.functions'
import {managementFunctions} from './Management/Management.functions'
import Stripe from 'stripe'

const admin = require('firebase-admin')
admin.initializeApp({})
const stripe = new Stripe(functions.config().stripe.livesecretkey, {
  apiVersion: '2020-08-27',
})

exports.mailchimp = {
  add: functions.https.onRequest(mailChimpFunctions.add),
}

exports.notifications = {
  onBookedDeal: functions.firestore
    .document('sessions/{sessions}')
    .onUpdate(notificationsFunctions.onBookedDeal),
  triggerCancelledDeal: functions.https.onCall(notificationsFunctions.triggerCancelledDeal),
  trainerVerificationNotification: functions.firestore
    .document('trainers/{trainers}')
    .onUpdate(notificationsFunctions.sendTrainerVerifiedNotification),
}

exports.bookingReminderNotification = functions.pubsub
  .schedule('every 30 minutes')
  .onRun((context) => notificationsFunctions.bookingReminder(context))

exports.backupProductionDatabase = functions.pubsub.schedule('every 24 hours').onRun(managementFunctions.backupDatabase)

exports.checkStripeForPayment = functions.pubsub.schedule('every 24 hours').onRun(stripeFunctions.checkStripeForPayment)

exports.stripe = {
  createCustomer: functions.https.onCall(stripeFunctions.createCustomer),
  createAccount: functions.https.onCall(stripeFunctions.createAccount),
  addBankToAccount: functions.https.onCall(stripeFunctions.addBankToAccount),
  createTrainerBankAccount: functions.https.onCall(
    stripeFunctions.createTrainerBankAccount,
  ),
  preparePayment: functions.https.onCall(stripeFunctions.preparePayment),
  getEphemeralKeys: functions.https.onCall(stripeFunctions.getEphemeralKeys),
  getAccount: functions.https.onCall(stripeFunctions.getAccount),
  deleteBankAccount: functions.https.onCall(stripeFunctions.deleteBankAccount),
  createRefund: functions.https.onCall(stripeFunctions.createRefund),
  createTraineeInvoice: functions.https.onCall(
    stripeFunctions.createTraineeInvoice,
  ),
  createTraineeInvoiceItem: functions.https.onCall(
    stripeFunctions.createTraineeInvoiceItem,
  ),
  createTraineeDiscountItem: functions.https.onCall(
    stripeFunctions.createTraineeDiscountItem,
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
  addPromotionalCode: functions.https.onCall(stripeFunctions.addPromotionalCode),
  manuallyCheckStripeForPayment: functions.https.onCall(stripeFunctions.checkStripeForPayment),
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

exports.webhooks = functions.https.onRequest((request: any, response: any) => {

  const sig = request.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(request.rawBody, sig, functions.config().stripe.signing)
    functions.logger.info(event)
  } catch (error) {
    return response.status(400).end;
  }
});

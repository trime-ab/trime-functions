import * as functions from 'firebase-functions'

import mailChimpFunctions from './mailChimp/mailChimp.functions'
import { stripeFunctions } from './Stripe/Stripe.functions'

const admin = require('firebase-admin')
admin.initializeApp({})

exports.mailchimp = {
  add: functions.https.onRequest(mailChimpFunctions.add),
}

exports.stripe = {
  createCustomer: functions.https.onCall(stripeFunctions.createCustomer),
  addCardToCustomer: functions.https.onCall(stripeFunctions.addCardToCustomer),
  getCustomer: functions.https.onCall(stripeFunctions.getCustomer),
  createAccount: functions.https.onCall(stripeFunctions.createAccount),
  addBankToAccount: functions.https.onCall(stripeFunctions.addBankToAccount),
  addCardToAccount: functions.https.onCall(stripeFunctions.addCardToAccount),
  getAccount: functions.https.onCall(stripeFunctions.getAccount),
}

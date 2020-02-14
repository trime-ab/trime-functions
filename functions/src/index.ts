import * as functions from "firebase-functions";
import Stripe from "stripe";
const admin = require("firebase-admin");
admin.initializeApp({});

import mailChimpFunctions from "./mailChimp/mailChimp.functions";

const stripe = new Stripe(functions.config().stripe.testsecret, {
  apiVersion: "2019-12-03"
});

exports.mailchimp = {
  add: functions.https.onRequest(mailChimpFunctions.add)
};

// ------------------ customer functions ---------------------

// Create stripe customer (For trainees)

exports.createStripeCustomer = functions.firestore

exports.createStripeCustomer = functions.https.onCall ( (user: any) => {
  return stripe.customers.create({
    email: user.lastName,
    description: "Trime Trainee"
  })
});

// adding card to customer

exports.addCardToCustomer = (cardToken: string, stripeCustomerId: string) => {
  return stripe.customers.createSource(stripeCustomerId, { source: cardToken });
};

// fetching customer
exports.getCustomer = (stripeCustomerId: string, cardId: string) => {
  return fetch(`/v1/customers/${stripeCustomerId}/sources/${cardId}`);
};

//------------------- ACCOUNT FUNCTIONS (TRAINERS) -------------

// Create Stripe Accounts (for Trainers)

// adding card to accounts

// fetching

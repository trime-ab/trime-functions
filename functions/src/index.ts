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

exports.createStripeCustomer = functions.https.onCall((user, context) => {
  const email = user.email;
  return stripe.customers
    .create({
      email: email,
      description: "This is a Trime Trainee"
    })
    .then(
      function(stripeCustomerId) {
        console.log("Customer successfully created");
        console.log(stripeCustomerId.id);
        return stripeCustomerId.id;
      },
      function(error) {
        throw new functions.https.HttpsError(error.code, error.message);
      }
    );
});

// adding card to customer

exports.addCardToCustomer = functions.https.onCall((data, context) => {
  const stripeCustomerId = data.stripeCustomerId;
  const cardToken = data.cardToken;
  return stripe.customers
    .createSource(stripeCustomerId, {
      source: cardToken
    })
    .then(
      function() {
        console.log("Customer Card added successfully");
      },
      function(error) {
        throw new functions.https.HttpsError(error.code, error.message);
      }
    );
});

// fetching customer

exports.getCustomer = functions.https.onCall((data, context) => {
  const stripeCustomerID = data.id;

  return stripe.customers
    .retrieve(stripeCustomerID)
    .then(customer => {
      return { customer: customer };
    })
    .catch(error => {
      throw new functions.https.HttpsError(error.code, error.message);
    });
});

//------------------- ACCOUNT FUNCTIONS (TRAINERS) -------------

// Create Stripe Accounts (for Trainers)

exports.createStripeAccount = functions.https.onCall((data, context) => {
  const email = data.email;
  return stripe.accounts
    .create({
      email: email
    })
    .then(
      function(stripeAccountId) {
        console.log("Account successfully created");
        console.log(stripeAccountId);
        return { AccountId: stripeAccountId };
      },
      function(error) {
        throw new functions.https.HttpsError(error.code, error.message);
      }
    );
});

// adding card to accounts

// fetching

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
      type: "custom",
      country: "SE",
      business_type: "individual",
      individual: {
        address: {
          line1: data.line1,
          line2: data.line2,
          postal_code: data.postCode,
          city: data.city,
          state: data.state
        },
        dob: {
          day: data.day,
          month: data.month,
          year: data.year
        },
        first_name: data.firstName,
        last_name: data.lastName,
        email: email,
        phone: data.phone
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000)
      },
      requested_capabilities: ["card_payments", "transfers"]
    })
    .then(
      function(stripeAccountId) {
        console.log("Account successfully created");
        console.log(stripeAccountId);
        return stripeAccountId.id;
      },
      function(error) {
        throw new functions.https.HttpsError(error.code, error.message);
      }
    );
});

// Adding bank account to accounts

exports.addBankToAccount = functions.https.onCall((data, context) => {
  const stripeAccountId = data.stripeAccountId;
  const Token = data.Token;
  return stripe.accounts
    .createExternalAccount(stripeAccountId, {
      external_account: Token
    })
    .then(
      function() {
        console.log("Bank Account added successfully");
      },
      function(error) {
        throw new functions.https.HttpsError(error.code, error.message);
      }
    );
});

// fetching Accounts


// Payments 


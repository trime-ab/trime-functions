import * as functions from "firebase-functions";

import Stripe from "stripe";

const stripe = new Stripe(functions.config().stripe.testsecret, {
  apiVersion: "2019-12-03"
});

class StripeFunctions {
  async createCustomer(data: { email: string }) {
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        description: "This is a Trime Trainee"
      });

      console.log("Customer successfully created");
      console.log(customer.id);

      return customer.id;
    } catch (error) {
      console.warn("Unable to create customer in Stripe");
      throw error;
    }
  }

  async addCardToCustomer(data: {
    stripeCustomerId: string;
    cardTokenId: string;
  }) {
    try {
      console.log("adding card to customer", data);
      await stripe.customers.createSource(data.stripeCustomerId, {
        source: data.cardTokenId
      });
      console.log("Customer Card added successfully");
    } catch (error) {
      console.warn("Unable to add card to customer", data.stripeCustomerId);
      throw error;
    }
  }

  async getCustomer(stripeCustomerId: string) {
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      return customer;
    } catch (error) {
      console.warn("Unable to get customer", stripeCustomerId);
      throw error;
    }
  }

  async createAccount(data: {
    address: any;
    phone: string;
    firstName: string;
    lastName: string;
    dob: any;
    email: string;
  }) {
    try {
      const account = await stripe.accounts.create({
        type: "custom",
        country: "SE",
        email: data.email,
        business_type: "individual",
        individual: {
          address: {
            line1: data.address.line1,
            line2: data.address.line2,
            postal_code: data.address.postalCode,
            city: data.address.city,
            state: data.address.state,
            country: data.address.country
          },
          dob: data.dob,
          first_name: data.firstName,
          last_name: data.lastName,
          // phone: data.phone,
          email: data.email
        },
        // eslint-disable-next-line @typescript-eslint/camelcase
        requested_capabilities: ["card_payments", "transfers"]
      });

      console.log("Account successfully created");
      console.log(account.id);

      return account.id;
    } catch (error) {
      console.warn("Unable to create account");
      throw error;
    }
  }

  async addCardToAccount(data: {
    stripeAccountId: string;
    cardTokenId: string;
  }) {
    try {
      console.log("adding card to account", data);
      await stripe.accounts.createExternalAccount(data.stripeAccountId, {
        external_account: data.cardTokenId
      });
      console.log("Customer Card added successfully");
    } catch (error) {
      console.warn("Unable to add card to customer", data.stripeAccountId);
      throw error;
    }
  }

  async addBankToAccount(data: {
    stripeAccountId: string;
    bankTokenId: string;
  }) {
    try {
      await stripe.accounts.createExternalAccount(data.stripeAccountId, {
        // eslint-disable-next-line @typescript-eslint/camelcase
        external_account: data.bankTokenId
      });
      console.log("Bank Account added successfully");
    } catch (error) {
      console.warn("Unable to add bank account", data.stripeAccountId);
      throw error;
    }
  }

  async getAccount(stripeAccountId: string) {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      return account;
    } catch (error) {
      console.warn("Unable to get account", stripeAccountId);
      throw error;
    }
  }
}

export const stripeFunctions = new StripeFunctions();

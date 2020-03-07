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

  async deleteCard(data: { stripeCustomerId: string; default_source: string }) {
    try {
      await stripe.customers.deleteSource(
        data.stripeCustomerId,
        data.default_source
      );
    } catch (error) {
      console.warn("Unable to delete card from account", data.default_source);
    }
  }

  async deleteCustomer(data: { stripeCustomerId: string }) {
    try {
      await stripe.customers.del(data.stripeCustomerId);
    } catch (error) {
      console.warn("Unable to delete account");
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
        default_currency: "sek",
        // eslint-disable-next-line @typescript-eslint/camelcase
        requested_capabilities: ["card_payments", "transfers"],
        individual: {
          address: {
            line1: data.address.line1,
            line2: data.address.line2,
            postal_code: data.address.postalCode,
            city: data.address.city,
            state: data.address.state,
            country: data.address.country
          },
          dob: {
            day: data.dob.day,
            month: data.dob.month,
            year: data.dob.year
          },
          first_name: data.firstName,
          last_name: data.lastName,
          // phone: data.phone,
          email: data.email
        },
        settings: {
          payments: {
            statement_descriptor:
              `${data.firstName} ${data.lastName}`
          },
          payouts: {
            debit_negative_balances: true
          }
        },
        // tos_acceptance: {
        //   date: Math.floor(Date.now() / 1000)
        // }
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
      console.warn("Unable to add card to customer");
      throw error;
    }
  }

  async addBankToAccount(data: {
    stripeAccountId: string;
    bankAccountTokenId: string;
  }) {
    try {
      await stripe.accounts.createExternalAccount(data.stripeAccountId, {
        // eslint-disable-next-line @typescript-eslint/camelcase
        external_account: data.bankAccountTokenId
      });
      console.log("Bank Account added successfully");
    } catch (error) {
      console.warn("Unable to add bank account", data.stripeAccountId);
      throw error;
    }
  }

  async getAccount(stripeAccountId: string) {
    try {
      console.log(stripeAccountId)
      const account = await stripe.accounts.retrieve(stripeAccountId);
      console.log(account)
      return account;
    } catch (error) {
      console.warn("Unable to get account", stripeAccountId);
      throw error;
    }
  }

  async deleteBankAccount(data: { stripeAccountId: string; data: string }) {
    try {
      await stripe.accounts.deleteExternalAccount(
        data.stripeAccountId,
        data.data
      );
    } catch (error) {
      console.warn("Unable to delete Bank account from account");
    }
  }

  async deleteAccount(data: { stripeAccountId: string }) {
    try {
      await stripe.accounts.del(data.stripeAccountId);
    } catch (error) {
      console.warn("Unable to delete account");
    }
  }

  async makePayment(data: {
    firstName: string;
    lastName: string;
    payment: any;
  }) {
    try {
      await stripe.charges.create({
        amount: data.payment.amount,
        currency: "sek",
        source: data.payment.stripeCustomerId,
        application_fee_amount: data.payment.trimeAmount,
        description: "A charge for a trainer booking.",
        transfer_data: {
          destination: data.payment.stripeAccountId
        },
        on_behalf_of: `${data.firstName} ${data.lastName}`
      });
    } catch (error) {
      console.warn("Unable to make payment");
    }
  }
}

export const stripeFunctions = new StripeFunctions();

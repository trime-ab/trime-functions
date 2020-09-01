import * as functions from "firebase-functions";

import Stripe from "stripe";
const stripe = new Stripe(functions.config().stripe.testsecret, {
  apiVersion: "2020-08-27"
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
    email: string;
    address: any;
    dob: any;
    formattedPhoneNumber: string;
    firstName: string;
    lastName: string;
    trainerIp: any;
    vat: string;
  }) {
    try {
      const account = await stripe.accounts.create({
        business_profile: {
          mcc: "8999",
          product_description:
            "This is the Trime Trainer. Money is paid from a customer to this account",
          support_phone: data.formattedPhoneNumber,
          url: "www.trime.app"
        },
        business_type: "individual",
        capabilities: {
          card_payments: {
            requested: true,
          },
          transfers: {
            requested: true,
          },
        },
        country: "SE",
        default_currency: "sek",
        email: data.email,
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
          phone: data.formattedPhoneNumber,
          email: data.email
        },
        settings: {
          payments: {
            statement_descriptor:`VAT: ${data.vat}`
          },
          payouts: {
            debit_negative_balances: true
          }
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: data.trainerIp
        },
        type: "custom",
      });

      console.log("Account successfully created");
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
        external_account: data.bankAccountTokenId,
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

  async deleteBankAccount(data: { stripeAccountId: string; id: string }) {
    try {
      await stripe.accounts.deleteExternalAccount(
        data.stripeAccountId,
        data.id
      );
    } catch (error) {
      console.warn("Unable to delete Bank account from account", error);
    }
  }

  async deleteAccount(data: { stripeAccountId: string }) {
    try {
      await stripe.accounts.del(data.stripeAccountId);
    } catch (error) {
      console.warn("Unable to delete account", error);
    }
  }

  async updateVat(data: { stripeAccountId: string, vat: string}) {
    try {
      console.log(data.stripeAccountId)
      console.log(data.vat)
      await stripe.accounts.update(data.stripeAccountId, {
        settings: {
          payments: {
            statement_descriptor:`VAT: ${data.vat}`
          },
        },
      })
    } catch(error) {
      console.warn('unable to update account', error)
    }
  }

  async createRefund(data: {
    paymentId: string;
    amount: number;
  }) {
    try {
      await stripe.refunds.create({
            payment_intent: data.paymentId,
            amount: data.amount,
            reason: "requested_by_customer",
          },
      );
      console.log('refund was made successfully')
    } catch(error) {
      console.warn('unable to refund money', error)
    }
  }

  async createPaymentIntent(data: {
    amount: number;
    stripeCustomerId: string;
    trimeAmount: number;
    stripeAccountId: string;
    vatNumber: string;
    email: string;
    object: any;
  }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: "sek",
        customer: data.stripeCustomerId,
        // application_fee_amount: data.trimeAmount,
        description: "A charge for booking.",
        statement_descriptor:`VAT No:${data.vatNumber}`,
        payment_method: data.object,
        receipt_email: data.email,
        transfer_data: {
          destination: data.stripeAccountId
        },
        on_behalf_of: data.stripeAccountId,
      });

      console.log("Payment successfully made");
      console.log(paymentIntent.id);

      return paymentIntent;
    } catch (error) {
      console.warn("Unable to make payment", error);
      throw error;
    }
  }
}

export const stripeFunctions = new StripeFunctions();

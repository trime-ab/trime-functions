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

    async updateDefaultPayment(data: { stripeCustomerId: string, paymentId: string }) {
        return stripe.customers.update(
            data.stripeCustomerId,
            {invoice_settings: {default_payment_method: data.paymentId}}
        )
    }

    async createCustomerSetupIntent(data: {
        stripeCustomerId: string
        paymentId: string
    }) {

        try {
            console.log(data.paymentId)
            return stripe.setupIntents.create({
                payment_method_types: ['card'],
                confirm: true,
                customer: data.stripeCustomerId,
                usage: "off_session",
                payment_method: data.paymentId,
                payment_method_options: {
                  card: {
                      request_three_d_secure: "automatic"
                  },
                },
            })

        } catch (error) {
            console.warn('Unable to attach card to customer', data.stripeCustomerId)
            throw error;
        }
    }


    async createCustomerCard(data: {
        number: string
        expMonth: number
        expYear: number
        cvc: string
        nameOnCard: string
    }) {
        try {
            const card = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    number: data.number,
                    exp_month: data.expMonth,
                    exp_year: data.expYear,
                    cvc: data.cvc,
                },
                billing_details: {
                    name: data.nameOnCard,
                },
            })
            console.log("card sent");
            console.log(card.id);
            return card.id
        } catch (error) {
            console.warn('Unable to attach card to customer')
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

    async getPaymentMethod(data: { paymentMethod: string }) {
        try {
            console.log('getting payment method')
            return stripe.paymentMethods.retrieve(data.paymentMethod)
        } catch (error) {
            console.warn("Unable to get payment method",);
            throw error;
        }
    }


    async getCustomer(stripeCustomerId: string) {
        try {
            return stripe.customers.retrieve(stripeCustomerId);

        } catch (error) {
            console.warn("Unable to get customer", stripeCustomerId);
            throw error;
        }
    }

    async deleteCard(data: { default_payment_method: string }) {
        try {
            return stripe.paymentMethods.detach(
                data.default_payment_method
            );
        } catch (error) {
            console.warn("Unable to delete card from account", data.default_payment_method);
            throw error;
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
                        statement_descriptor: `VAT: ${data.vat}`
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

    async createBankAccountToken(data: {
        country: string
        currency: string
        name: string
        accountNumber: string
    }) {
        try {
            const token = await stripe.tokens.create({
                bank_account: {
                    country: data.country,
                    currency: data.currency,
                    account_holder_name: data.name,
                    account_number: data.accountNumber,
                }
            })
            return token.id
        } catch (error) {
            console.warn('Could not create bank account token')
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

    async updateVat(data: { stripeAccountId: string, vat: string }) {
        try {
            console.log(data.stripeAccountId)
            console.log(data.vat)
            await stripe.accounts.update(data.stripeAccountId, {
                settings: {
                    payments: {
                        statement_descriptor: `VAT: ${data.vat}`
                    },
                },
            })
        } catch (error) {
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
        } catch (error) {
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
    }) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: data.amount,
                currency: "sek",
                customer: data.stripeCustomerId,
                // application_fee_amount: data.trimeAmount,
                description: "A charge for booking.",
                statement_descriptor: `VAT No:${data.vatNumber}`,
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

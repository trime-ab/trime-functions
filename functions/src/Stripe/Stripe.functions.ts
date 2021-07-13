import * as functions from 'firebase-functions'

import Stripe from 'stripe'
import {Address} from '../domain/Address/Address'
import {SimpleDate} from '../domain/SimpleDate/SimpleDate'
import Currency from '../domain/Currency/Currency'
import {Payment} from '../domain/Payment'
import {Discount} from "../domain/Discount";
import {Trainee} from "../domain/Trainee";
import {Trainer} from "../domain/Trainer";
import * as admin from "firebase-admin";
import {stripeService} from "./Stripe.service";

const API_VERSION = '2020-08-27'

const stripe = new Stripe(functions.config().stripe.livesecretkey, {
  apiVersion: API_VERSION,
})

class StripeFunctions {
  async createCustomer(data: { email: string; name: string }) {
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        description: 'Trime Trainee',
        name: data.name,
      })

      console.log('Customer successfully created')
      console.log(customer.id)

      return customer.id
    } catch (error) {
      const message = 'Unable to create customer account'
      functions.logger.error(message, error)

      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async createAccount(data: {
    email: string
    address: Address
    dob: SimpleDate
    formattedPhoneNumber: string
    firstName: string
    lastName: string
    trainerIp: string
    currency: Currency
  }): Promise<string> {
    try {
      const stripeCurrency = data.currency.toLowerCase()
      const account = await stripe.accounts.create({
        business_profile: {
          mcc: '8999',
          product_description:
            'This is the Trime Trainer. Money is paid from a customer to this account',
          support_phone: data.formattedPhoneNumber,
          url: 'www.trime.app',
        },
        business_type: 'individual',
        capabilities: {
          card_payments: {
            requested: true,
          },
          transfers: {
            requested: true,
          },
        },
        country: data.address.country,
        default_currency: stripeCurrency,
        email: data.email,
        individual: {
          address: {
            line1: data.address.line1,
            line2: data.address.line2,
            postal_code: data.address.postalCode,
            city: data.address.city,
            state: data.address.state,
            country: data.address.country,
          },
          dob: {
            day: data.dob.day,
            month: data.dob.month,
            year: data.dob.year,
          },
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.formattedPhoneNumber,
          email: data.email,
        },
        settings: {
          payouts: {
            debit_negative_balances: true,
          },
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: data.trainerIp,
        },
        type: 'custom',
      })

      console.log('Account successfully created')
      return account.id
    } catch (error) {
      const message = 'Unable to create account'
      functions.logger.error(message, error)

      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async createTrainerBankAccount(data: {
    country: string
    currency: string
    name: string
    accountNumber: string
  }) {
    try {
      const account = await stripe.tokens.create({
        bank_account: {
          country: data.country,
          currency: data.currency,
          account_holder_name: data.name,
          account_number: data.accountNumber,
        },
      })
      return account.id
    } catch (error) {
      const message = 'Unable to create Bank Account'
      functions.logger.error(message, error)

      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async addBankToAccount(data: {
    stripeAccountId: string
    bankAccountId: string
  }) {
    try {
      await stripe.accounts.createExternalAccount(data.stripeAccountId, {
        external_account: data.bankAccountId,
        default_for_currency: true,
      })
      console.log('Bank Account added successfully')
    } catch (error) {
      const message = `Unable to attach to stripe account ${data.stripeAccountId}`
      functions.logger.error(message, error)

      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async getAccount(stripeAccountId: string) {
    try {
      return stripe.accounts.retrieve(stripeAccountId)
    } catch (error) {
      const message = `Unable to get account details`
      functions.logger.error(message, error)

      throw new functions.https.HttpsError('not-found', message, error)
    }
  }

  async deleteBankAccount(data: {
    stripeAccountId: string
    bankAccountId: string
  }) {
    try {
      await stripe.accounts.deleteExternalAccount(
        data.stripeAccountId,
        data.bankAccountId,
      )
    } catch (error) {
      const message = 'Unable to delete bank account'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('not-found', message, error)
    }
  }

  async createRefund(payment: Payment) {
    try {
      await stripe.refunds.create({
        payment_intent: payment.externalId,
        amount: payment.amount * 100,
        reason: 'requested_by_customer',
        reverse_transfer: true,
      })
      console.log('refund was made successfully')
    } catch (error) {
      const message = 'Unable to refund money'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async createTraineeInvoiceItem(payment: Payment) {
    try {
      const invoiceItems = await stripe.invoiceItems.create({
        customer: payment.customerId,
        currency: 'sek',
        description: payment.dealName,
        amount: payment.amount * 100,
      })
      console.log('created Item')
      return invoiceItems
    } catch (error) {
      const message = 'Unable to make items'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async createTraineeDiscountItem(data: { payment: Payment, discount: Discount }) {
    try {
      const calculatedDiscount = Math.round((data.payment.amount / 100) * data.discount.value)
      const discountTotal = Math.round(calculatedDiscount * 100)

      await stripe.invoiceItems.create({
        customer: data.payment.customerId,
        currency: 'sek',
        description: 'corporate discount 30% off',
        amount: - discountTotal,
      })
      console.log('created DiscountItem')
    } catch (error) {
      const message = 'Unable to make items'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async createTraineeInvoice(data: {
    customerId: string
    accountId: string
    trimeAmount: number
    trainerName: string
    vatNumber: string
    paymentMethodId: string
  }) {
    try {

      const invoice = await stripe.invoices.create({
        customer: data.customerId,
        auto_advance: false,
        collection_method: 'charge_automatically',
        application_fee_amount: data.trimeAmount,
        default_payment_method: data.paymentMethodId,
        default_tax_rates: [functions.config().stripe.taxcode],
        transfer_data: {
          destination: data.accountId,

        },
        footer: `Trainer Name: ${data.trainerName}, VAT Number: ${data.vatNumber}`,
      })

      console.log('Invoice created successfully')
      return invoice
    } catch (error) {
      console.log('Unable to create Invoice')
      const message = 'Unable to make invoice'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async finaliseInvoice(data: { invoiceId: string }): Promise<Stripe.Invoice> {
    console.log('Finalising invoice')
    return stripe.invoices.finalizeInvoice(data.invoiceId, {
      auto_advance: false,
    })
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return stripe.paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
      const message = 'Unable to fetch payment intent'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async updateCustomerDetails(data: {
    stripeCustomerId: string
    email: string
  }): Promise<Stripe.Customer> {
    try {
      return stripe.customers.update(data.stripeCustomerId, {
        email: data.email,
      })
    } catch (error) {
      const message = 'Unable to update customer'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async updateAccountDetails(data: {
    stripeAccountId: string
    email: string
    address: Address
    dob: SimpleDate
    phoneNumber: string
    firstName: string
    lastName: string
  }) {
    try {
      await stripe.accounts.update(data.stripeAccountId, {
        business_profile: {
          support_phone: data.phoneNumber,
        },
        email: data.email,
        individual: {
          address: {
            line1: data.address.line1,
            line2: data.address.line2,
            postal_code: data.address.postalCode,
            city: data.address.city,
            state: data.address.state,
          },
          dob: {
            day: data.dob.day,
            month: data.dob.month,
            year: data.dob.year,
          },
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phoneNumber,
          email: data.email,
        },
      })
      return 'Updated Account'
    } catch (error) {
      const message = 'Unable to update Account'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async addPromotionalCode(data: {
    stripeCustomerId: string
    discountCode: string
  }) {
    try {
      await stripe.customers.update(data.stripeCustomerId, {
        coupon: data.discountCode
      })
      return 'updated Account'
    } catch (error) {
      const message = 'Unable to add promotional code'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async getEphemeralKeys(data: { customerId: string}) {
    try {
      return stripe.ephemeralKeys.create({
        customer: data.customerId
      }, {apiVersion: API_VERSION})
    } catch (error) {
      const message = 'Unable to add fetch ephemeral key'
      functions.logger.error(message, error)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async preparePayment(data: {
    paymentId: string,
    traineeId: string,
    trainerId: string,
    discount?: Discount,
  }) {
      try {
        const { paymentId, traineeId, trainerId, discount } = data
        const db = admin.firestore()

        const trainee: Trainee = await stripeService.getTrainee(db, traineeId)
        const trainer: Trainer = await stripeService.getTrainer(db, trainerId)
        const payment: Payment = await stripeService.getPayment(db, paymentId)

        await stripe.invoiceItems.create({
          customer: payment.customerId,
          currency: 'sek',
          description: payment.dealName,
          amount: payment.amount * 100,
        })

        if (discount) {
          console.log(discount)
          // await this.createTraineeDiscountItem({payment, discount})
          const calculatedDiscount = Math.round((payment.amount / 100) * data.discount.value)
          const discountTotal = Math.round(calculatedDiscount * 100)

          await stripe.invoiceItems.create({
            customer: payment.customerId,
            currency: 'sek',
            description: 'corporate discount 30% off',
            amount: - discountTotal,
          })
        }

        let invoice = await stripe.invoices.create({
          customer: trainee.stripeCustomerId,
          auto_advance: false,
          collection_method: 'charge_automatically',
          application_fee_amount: payment.trimeAmount,
          default_tax_rates: [functions.config().stripe.taxcode],
          transfer_data: {
            destination: trainer.stripeAccountId,

          },
          footer: `Trainer Name: ${trainer.firstName} ${trainer.lastName}, VAT Number: ${trainer.vat}`,
        })

        invoice = await stripe.invoices.finalizeInvoice(invoice.id, {
          auto_advance: false,
        })

        return stripe.paymentIntents.retrieve(invoice.payment_intent as string)
      } catch (error) {
        const message = 'Unable to complete payment'
        functions.logger.error(message, error)
        throw new functions.https.HttpsError('unknown', message, error)
      }
  }
  async checkStripeForPayment() {
    const db = admin.firestore();

    const oneDayBefore = new Date()
    oneDayBefore.setHours(oneDayBefore.getHours() - 24);

    const sessions = await stripeService.getSessions(db)
    sessions.filter(s => s.start.toDate() > oneDayBefore)

    for (const s of sessions) {
      const payments = await stripeService.getPaymentsFromSession(db, s.id)

      for (const p of payments) {
        if (p.externalId) {
          const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.retrieve(p.externalId)

          if (paymentIntent.status === 'succeeded') {
            await stripeService.markPaymentAsPaid(db, p.id)
            await stripeService.markSessionAsPaid(db, s.id)
          }
        }
      }
    }
  }
}

export const stripeFunctions = new StripeFunctions()

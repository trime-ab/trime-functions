import * as functions from 'firebase-functions'

import Stripe from 'stripe'
import { Address } from '../domain/Address/Address'
import { SimpleDate } from '../domain/SimpleDate/SimpleDate'
import Currency from '../domain/Currency/Currency'
import { CreditCard } from '../domain/CreditCard'
import Payment from '../domain/Payment'

const stripe = new Stripe(functions.config().stripe.testsecret, {
  apiVersion: '2020-08-27',
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
      let message = 'Unable to create customer account'
      functions.logger.error(message, error)

      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async updateDefaultPayment(data: {
    stripeCustomerId: string
    paymentId: string
  }) {
    return stripe.customers.update(data.stripeCustomerId, {
      invoice_settings: { default_payment_method: data.paymentId },
    })
  }

  async createCustomerSetupIntent(data: {
    stripeCustomerId: string
    cardId: string
  }) {
    try {
      console.log('My name is Jeff')
      console.log(data.cardId)
      // DO NOT CHANGE CONST BELOW
      const result = await stripe.setupIntents.create({
        payment_method_types: ['card'],
        confirm: true,
        customer: data.stripeCustomerId,
        usage: 'off_session',
        payment_method: data.cardId,
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      })
      return result
    } catch (error) {
      console.log('My name is jeff')
      const message = `Unable to attach card to customer, ${data.stripeCustomerId}`
      functions.logger.error(message, error)
      console.log(Stripe.StripeError)
      throw new functions.https.HttpsError('unknown', message, error)
      // console.warn('Unable to attach card to customer', data.stripeCustomerId)
    }
  }

  async createCustomerCard(data: CreditCard) {
    try {
      const card = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: data.number,
          exp_month: data.expMonth,
          exp_year: data.expYear,
          cvc: data.cvc,
        },
      })
      console.log('card sent')
      console.log(card.id)
      return card.id
    } catch (error) {
      const message = 'Unable to create Card Token'
      console.warn(message)
      throw new functions.https.HttpsError('unknown', message, error)
    }
  }

  async getPaymentMethod(data: { paymentMethod: string }) {
    try {
      console.log('getting payment method')
      return stripe.paymentMethods.retrieve(data.paymentMethod)
    } catch (error) {
      console.warn('Unable to get payment method')
      throw error
    }
  }

  async getCustomer(stripeCustomerId: string) {
    try {
      return stripe.customers.retrieve(stripeCustomerId, {
        expand: ['invoice_settings.default_payment_method.card'],
      })
    } catch (error) {
      console.warn('Unable to get customer', stripeCustomerId)
      throw error
    }
  }

  async deleteCard(data: { default_payment_method: string }) {
    try {
      return stripe.paymentMethods.detach(data.default_payment_method)
    } catch (error) {
      console.warn(
        'Unable to delete card from account',
        data.default_payment_method,
      )
      throw error
    }
  }

  async deleteCustomer(data: { stripeCustomerId: string }) {
    try {
      await stripe.customers.del(data.stripeCustomerId)
    } catch (error) {
      console.warn('Unable to delete account')
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
      console.warn('Could not create bank account token')
      throw error
    }
  }

  async addBankToAccount(data: {
    stripeAccountId: string
    bankAccountTokenId: string
  }) {
    try {
      await stripe.accounts.createExternalAccount(data.stripeAccountId, {
        // eslint-disable-next-line @typescript-eslint/camelcase
        external_account: data.bankAccountTokenId,
      })
      console.log('Bank Account added successfully')
    } catch (error) {
      console.warn('Unable to add bank account', data.stripeAccountId)
      throw error
    }
  }

  async getAccount(stripeAccountId: string) {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId)
      return account
    } catch (error) {
      console.warn('Unable to get account', stripeAccountId)
      throw error
    }
  }

  async deleteBankAccount(data: { stripeAccountId: string; id: string }) {
    try {
      await stripe.accounts.deleteExternalAccount(data.stripeAccountId, data.id)
    } catch (error) {
      console.warn('Unable to delete Bank account from account', error)
    }
  }

  async deleteAccount(data: { stripeAccountId: string }) {
    try {
      await stripe.accounts.del(data.stripeAccountId)
    } catch (error) {
      console.warn('Unable to delete account', error)
    }
  }

  async createRefund(data: { paymentId: string; amount: number }) {
    try {
      await stripe.refunds.create({
        payment_intent: data.paymentId,
        amount: data.amount,
        reason: 'requested_by_customer',
      })
      console.log('refund was made successfully')
    } catch (error) {
      console.warn('unable to refund money', error)
    }
  }

  async createTraineeInvoiceItem(payment: Payment) {
    try {
      const invoiceItems = stripe.invoiceItems.create({
        customer: payment.stripePayment.customerId,
        currency: payment.currency,
        description: 'Personal training session',
        amount: payment.amount,
      })
      console.log('created Item')
      return invoiceItems
    } catch (error) {
      console.warn('Unable to make Items', error)
      throw error
    }
  }

  async createTraineeInvoice(data: {
    customerId: string
    accountId: string
    trainerName: string
    vatNumber: string
  }) {
    try {
      const invoice = await stripe.invoices.create({
        customer: data.customerId,
        auto_advance: true,
        collection_method: 'charge_automatically',
        application_fee_amount: 0,
        default_tax_rates: ['txr_1Hcr6QKhxHsemyp6SCMSuL76'],
        transfer_data: {
          destination: data.accountId,
        },
        footer: `Vat number for ${data.trainerName}: ${data.vatNumber}`,
      })

      console.log('Invoice created successfully')
      return invoice
    } catch (error) {
      console.log('Unable to create Invoice')
      throw error
    }
  }

  async finaliseInvoice(data: { invoiceId: string }) {
    console.log('Finalising invoice')
    return stripe.invoices.finalizeInvoice(data.invoiceId, {
      auto_advance: true,
    })
  }

  async retrievePaymentIntent(data: { paymentIntentId: string }) {
    console.log()
    return stripe.paymentIntents.retrieve(data.paymentIntentId)
  }

  async updateCustomerDetails(data: {
    stripeCustomerId: string
    email: string
  }): Promise<Stripe.Customer> {
    return stripe.customers.update(data.stripeCustomerId, { email: data.email })
  }

  async updateAccountDetails(data: {
    stripeAccountId: string
    email?: string
    address?: Address
    dob?: SimpleDate
    phoneNumber?: string
    firstName?: string
    lastName?: string
  }) {
    try {
      if (data.email) {
        await this.updateAccountEmail(data.stripeAccountId, data.email)
      }
      if (data.address) {
        await this.updateAccountAddress(data.stripeAccountId, data.address)
      }
      if (data.dob) {
        await this.updateAccountDob(data.stripeAccountId, data.dob)
      }
      if (data.phoneNumber) {
        await this.updateAccountPhoneNumber(
          data.stripeAccountId,
          data.phoneNumber,
        )
      }
      if (data.firstName) {
        await this.updateAccountFirstName(data.stripeAccountId, data.firstName)
      }
      if (data.lastName) {
        await this.updateAccountLastName(data.stripeAccountId, data.lastName)
      }
    } catch (error) {
      throw new Error(
        'There was a problem updating your stripe details please contact trime support',
      )
    }
  }

  private updateAccountLastName(stripeAccountId: string, lastName: string) {
    return stripe.accounts.update(stripeAccountId, {
      individual: {
        last_name: lastName,
      },
    })
  }

  private updateAccountFirstName(stripeAccountId: string, firstName: string) {
    return stripe.accounts.update(stripeAccountId, {
      individual: {
        first_name: firstName,
      },
    })
  }

  private updateAccountDob(stripeAccountId: string, dob: SimpleDate) {
    return stripe.accounts.update(stripeAccountId, {
      individual: {
        dob: {
          day: dob.day,
          month: dob.month,
          year: dob.year,
        },
      },
    })
  }

  private updateAccountEmail(stripeAccountId: string, email: string) {
    return stripe.accounts.update(stripeAccountId, {
      email: email,
    })
  }

  private updateAccountAddress(stripeAccountId: string, address: Address) {
    return stripe.accounts.update(stripeAccountId, {
      individual: {
        address: {
          line1: address.line1,
          line2: address.line2,
          postal_code: address.postalCode,
          city: address.city,
          state: address.state,
          country: address.country,
        },
      },
    })
  }

  private updateAccountPhoneNumber(
    stripeAccountId: string,
    phoneNumber: string,
  ) {
    return stripe.accounts.update(stripeAccountId, {
      individual: { phone: phoneNumber },
      business_profile: { support_phone: phoneNumber },
    })
  }
}

export const stripeFunctions = new StripeFunctions()

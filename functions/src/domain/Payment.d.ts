import DateTime from '../DateTime/DateTime'
import Currency from '../Currency/Currency'
import StripePayment from './StripePayment'

export interface Payment {
  id?: string
  created: DateTime
  modified: DateTime
  amount: number
  dealName: string
  currency: Currency
  trimeAmount: number
  trainerAmount: number
  externalId: string
  customerId: string
  accountId: string
  cancelled: boolean
  successful: boolean
  sessionId: string
}

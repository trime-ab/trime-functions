import { computed, observable } from 'mobx'
import { Model } from '../../interfaces/Model'
import DateTime from '../DateTime/DateTime'
import Currency from '../Currency/Currency'
import StripePayment from './StripePayment'

export default class Payment implements Model {
  id?: string = null
  created: DateTime
  modified: DateTime
  amount: number
  currency: Currency
  trimeAmount: number
  trainerAmount: number
  stripePayment: StripePayment
  cancelled = false
  successful = false
  sessionId: string

  /**
   *@deprecated
   */
  @observable paymentId: string
  /**
   *@deprecated
   */
  @observable stripeCustomerId: string
  /**
   *@deprecated
   */
  @observable stripeAccountId: string
  /**
   * @deprecated
   */
  @observable paymentCancelled: boolean = null
  /**
   * @deprecated
   */
  @observable isPaymentSuccessful: boolean = null

  @computed get amountWithDecimals() {
    return this.amount / 100
  }
}

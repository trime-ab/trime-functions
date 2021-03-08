import {DiscountType} from "./DiscountType";


export interface Discount {
  id?: string
  created: DateTime
  modified: DateTime
  value: number
  type: DiscountType.PERCENTAGE
}

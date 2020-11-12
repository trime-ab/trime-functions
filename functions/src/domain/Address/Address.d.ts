import { Country } from '../Country/Country'

export interface Address {
  line1: string
  line2: string
  postalCode: string
  city: string
  state: string
  country: Country
}

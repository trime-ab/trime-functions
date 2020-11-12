import { Class } from '../Class'
import Month from './Month'
import Year from './Year'

export interface DateTimePart {}

interface DateTimeInterface {
  get: <T extends DateTimePart>(property: string) => T
  toDate: () => Date
  toString: (format?: string) => string
  compareTo: (compareToDate: this) => number
  before: (compareToDate: this) => boolean
  beforeOrEquals: (compareToDate: this) => boolean
  after: (compareToDate: this) => boolean
  afterOrEquals: (compareToDate: this) => boolean
  equals: (compareToDate: this) => boolean
  clone: () => ThisType<this>
}

export interface DateInterface extends DateTimeInterface {
  year: Year
  month: Month
}

export default DateTimeInterface

export interface DateTimeClass<T extends DateTimeInterface> extends Class<T> {
  createFromDate(date: Date): T
}

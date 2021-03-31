export interface Trainer{
  notificationSettings: {
    events: boolean;
    messages: boolean;
  },
  userId: string;
  id: string
  firstName: string
  lastName: string
  isApproved: boolean
  stripeAccountId: string
  vat: string
  calenderSettings: {
    calenderId: string
  }
}

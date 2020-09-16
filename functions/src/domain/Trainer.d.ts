export interface Trainer{
  notificationSettings: {
    events: boolean;
    messages: boolean;
  },
  userId: string;
  id: string
  firstName: string
  lastName: string
  calenderSettings: {
    calenderId: string
  }
}

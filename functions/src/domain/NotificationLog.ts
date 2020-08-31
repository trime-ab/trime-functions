import {NotificationType} from "./NotificationType";

export class NotificationLog {
  id?: string
  date: Date
  recipientUserId: string
  senderUserId: string
  type: NotificationType
  deviceIds: string[]
  subjectId: string
}

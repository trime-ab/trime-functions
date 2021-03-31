export interface Trainee {
    notificationSettings: {
        events: boolean;
        messages: boolean;
    },
    userId: string;
    id: string;
    firstName: string;
    lastName: string;
    stripeCustomerId: string;
}

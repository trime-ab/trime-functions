import Channel from '../domain/Channel';
import ContactStatus from '../domain/ContactStatus';
import MailChimpContact from '../domain/MailChimpContact';
import MailChimpMarketingPermission from '../domain/MailChimpMarketingPermission';
import MailChimpMergeFields from '../domain/MailChimpMergeFields';
import Person from '../domain/Person';

class MailChimpTransformer {
  readonly MARKETING_PERMISSION_EMAIL_ID: string = 'b96479ef9f';
  readonly MARKETING_PERMISSION_SMS_ID: string = 'f87195c3a0';

  transformToMailChimpContact = (person: Person): MailChimpContact => {
    const mailChimpContact = new MailChimpContact();
    mailChimpContact.email_address = person.email;
    mailChimpContact.status = ContactStatus.SUBSCRIBED;
    mailChimpContact.merge_fields = new MailChimpMergeFields();
    mailChimpContact.merge_fields.FNAME = person.firstName;
    mailChimpContact.merge_fields.LNAME = person.lastName;
    mailChimpContact.merge_fields.MMERGE5 = person.city;
    mailChimpContact.merge_fields.MMERGE7 = person.type;
    mailChimpContact.merge_fields.PHONE = person.phone;
    mailChimpContact.marketing_permissions = [
      this.createMarketingPermission(Channel.EMAIL),
      this.createMarketingPermission(Channel.SMS),
    ];
    return mailChimpContact;
  };

  private createMarketingPermission = (
    channel: Channel
  ): MailChimpMarketingPermission => {
    let id;
    switch (channel) {
      case Channel.EMAIL:
        id = this.MARKETING_PERMISSION_EMAIL_ID;
        break;
      case Channel.SMS:
        id = this.MARKETING_PERMISSION_SMS_ID;
        break;
      default:
        throw new Error(
          `Unsupported Channel ('marketing permission'): ${channel}`
        );
    }
    return new MailChimpMarketingPermission(id);
  };
}

const mailChimpTransformer = new MailChimpTransformer();
export default mailChimpTransformer;

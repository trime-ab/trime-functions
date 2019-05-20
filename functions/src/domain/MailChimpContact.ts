import ContactStatus from './ContactStatus';
import MailChimpMarketingPermission from './MailChimpMarketingPermission';
import MailChimpMergeFields from './MailChimpMergeFields';

class MailChimpContact {
  email_address!: string;
  status!: ContactStatus;
  merge_fields!: MailChimpMergeFields;
  marketing_permissions!: MailChimpMarketingPermission[];
}

export default MailChimpContact;

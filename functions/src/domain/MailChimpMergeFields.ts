import PersonType from './PersonType';

class MailChimpMergeFields {
  FNAME!: string;
  LNAME!: string;
  MMERGE5!: string;
  MMERGE7!: PersonType;
  PHONE?: string;
}

export default MailChimpMergeFields;

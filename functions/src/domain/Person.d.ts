import Channel from './Channel';
import ContactStatus from './ContactStatus';
import PersonType from './PersonType';

interface Person {
  email: string;
  firstName: string;
  lastName: string;
  status: ContactStatus;
  city: string;
  type: PersonType;
  channels: Channel[];
  phone?: string;
}

export default Person;

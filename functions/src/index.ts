import * as functions from 'firebase-functions';

import mailChimpFunctions from './mailChimp/mailChimp.functions';

exports.mailchimp = {
  add: functions.https.onRequest(mailChimpFunctions.add),
};

import * as express from 'express';

import Person from '../domain/Person';
import mailChimpTransformer from './MailChimp.transformer';

const cors = require('cors');
const functions = require('firebase-functions');
const MailChimpApi = require('mailchimp-api-v3');

class MailChimpFunctions {
  //  private readonly API_URL: string = 'https://us19.api.mailchimp.com/3.0';
  private readonly API_KEY: string = functions.config().mailchimp.apikey;
  private readonly LIST_ID: string = 'bf793ff84a';
  private readonly mailChimpApi = new MailChimpApi(this.API_KEY);
  private readonly corsHandler = cors({
    origin: true,
  });

  readonly add = async (request: express.Request, res: express.Response) => {
    console.log('Request received...');
    return this.corsHandler(request, res, async () => {
      try {
        const result = await this.doAddRequest(request.body);
        console.log(`${result.id} successfully added to MailChimp`);
        res.status(200).send(result);
      } catch (error) {
        console.error('Error adding to MailChimp');
        console.error(error);
        if (!!error.errors) {
          console.error(error.errors);
        }
        res.status(500).send(error);
      }
    });
  };

  private doAddRequest = async (person: Person) => {
    try {
      this.validateAddRequest(person);
      const contact = mailChimpTransformer.transformToMailChimpContact(person);
      return await this.mailChimpApi.post(
        `/lists/${this.LIST_ID}/members/`,
        contact
      );
    } catch (error) {
      throw error;
    }
  };

  private validateAddRequest = (person: Person) => {
    if (!person) {
      throw new Error('Request body must contain a Person object');
    }
    if (!person.channels || !person.channels.length) {
      throw new Error(
        'Unable to add person  – marketing permissions have not been set'
      );
    }
  };
}

const mailChimpFunctions = new MailChimpFunctions();
export default mailChimpFunctions;

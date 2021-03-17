import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

import nodemailer from 'nodemailer'


class ManagementFunctions {
  backupDatabase() {
    const client = new admin.firestore.v1.FirestoreAdminClient()

    const projectId = process.env.GCP_PROJECT ||process.env.GCLOUD_PROJECT
    const databaseName = client.databasePath(projectId, '(default)')

    return client.exportDocuments({
      name: databaseName,
      // Add your bucket name here
      outputUriPrefix: 'gs://trime_backup_prod',
      // Empty array == all collections
      collectionIds: []
    })
      // tslint:disable-next-line:no-shadowed-variable
      .then(([response]) => {
        console.log(`Operation Name: ${response.name}`)
        return response
      })
      .catch(error => {
        console.error(error)
        throw new Error('Export operation failed')
      })
  }


  async changeUID(data: { email: string; uid: string }) {
    const email = `${data.email}`

    const newUserOverrides = {
      uid: `${data.uid}`,
    }

    console.log('Starting update for user with email:', email)
    const oldUser = await admin.auth().getUserByEmail(email)
    console.log('Old user found:', oldUser)

    await admin.auth().deleteUser(oldUser.uid)
    console.log('Old user deleted.')

    const dataToTransfer_keys = ['email', 'uid', 'password']
    const newUserData = {}
    for (const key of dataToTransfer_keys) {
      newUserData[key] = oldUser[key]
    }
    Object.assign(newUserData, newUserOverrides)
    console.log('New user data ready: ', newUserData)

    const newUser = await admin.auth().createUser(newUserData)
    console.log('New user created: ', newUser)
  }

  async traineeWelcomeEmail(snap: any) {
    const traineeData = snap.data()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply@trime.app',
        pass: 'AlSkywalker',
      },
    })

    const mailOptions = {
      from: 'noreply@trime.app',
      to: traineeData.email,
      subject: 'You’re in! Welcome to Trime!',
      html: `<p style="font-size: 16px;">Hi There</p>
                <br />
                <p>We’re excited to welcome you to Trime!</p>
                <br />
                <p>Now that you’ve created your profile, it’s time to get your account verified so that your profile and workout sessions are visible in the app to be booked by customers.</p>
                <br />
                <p>Make sure you have the following items uploaded on your profile:</p>
                <br />
                <ul>
                <li>A complete profile with your training certificate and link to your training provider’s website so that a Trime human can review and approve your profile.</li>
                <li>Prepare your Workouts (these are your training session that you offer to trainees).</li>
                <li>Add Company details incl. bank account under settings tab in the app. We use Stripe for real time payments from customers to you.</li>
                <li>Professional insurance is required.</li>
                </ul>
                <br />
                <p>Your account needs to be verified, company details in place and have at least one Workout, for your profile to be visible and bookable in the app.</p>
                <br />
                <p>The review process can take up to 72 hours so please bear with us in that time. If there are any questions or we need more information we will get in touch with you.</p>
                <br />
                <p>So, go ahead, dive in, get cracking... And have fun!</p>
                <br />
                <p>The Trime Team</p>
            `,
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        functions.logger.log(error)
      } else {
        functions.logger.log('Email Sent:' + info.response)
      }
    })
  }

  async trainerWelcomeEmail(snap: any) {
    const trainerData = snap.data()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply@trime.app',
        pass: 'AlSkywalker',
      },
    })

    const mailOptions = {
      from: 'noreply@trime.app',
      to: trainerData.email,
      subject: 'You’re in! Welcome to Trime!',
      html: `<p style="font-size: 16px;">Hi There</p>
                <br />
                <p>We’re excited to welcome you to Trime!</p>
                <br />
                <p>Now that you’ve created your profile, it’s time to get you verified status.</p>
                <br />
                 <p>Once you have completed your profile and uploaded your training certificates a trime human will review your profile</p>
                  <br />
                  <P>The review process can take up to 72 hours so please bear with us in that time. You are able to create workouts during this time but they will not be seen by trainees until verification is complete. If there are any issues or we need more information we will contact you.</P>
                  <br />
                 <p>Whilst you wait it would be best to add your bank account to your profile so you can be paid for your workouts.</p>
                 <br />
                 <p>So go ahead, dive in, get cracking… And have fun!</p>
                 <br/>
                <p>The Trime Team</p>
            `,
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        functions.logger.log(error)
      } else {
        functions.logger.log('Email Sent:' + info.response)
      }
    })
  }
}

export const managementFunctions = new ManagementFunctions()

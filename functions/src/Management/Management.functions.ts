import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

import nodemailer from 'nodemailer'

class ManagementFunctions {
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
                <p>Now that you’ve created your profile, it’s time to find you the perfect trainer(s).</p>
                <br />
                <p>At Trime, we only work with certified trainers.</p>
                <p>Every trainer application is reviewed by an actual Trime human, to make sure you get the experience you want. </p>
                <br />
                <p>In the app, you can find the trainer and training that’s perfect for you.</p>
                <p>Select between map view and list view, filter on price, type of training or location. </p>
                <br />
                <p>So go ahead, dive in, get cracking… And have fun!</p>
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

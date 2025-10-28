// Example Firebase Cloud Function (Node 14+) to send email via SendGrid
// Deploy this with Firebase Functions and set SENDGRID_API_KEY in functions config.

const functions = require('firebase-functions')
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY)

exports.sendTaskNotification = functions.https.onRequest(async (req, res) => {
  try {
    const { to, task } = req.body
    if (!to || !task) return res.status(400).send('Missing to or task')

    const msg = {
      to,
      from: 'no-reply@yourdomain.com',
      subject: `New task assigned: ${task.title}`,
      text: `You have been assigned a task: ${task.title}\nDue: ${task.due || '—'}\n\n${task.desc || ''}`,
      html: `<p>You have been assigned a task: <strong>${task.title}</strong></p><p>Due: ${task.due || '—'}</p><p>${task.desc || ''}</p>`
    }

    await sgMail.send(msg)
    return res.status(200).send('OK')
  } catch (err) {
    console.error('sendTaskNotification error', err)
    return res.status(500).send('Failed')
  }
})

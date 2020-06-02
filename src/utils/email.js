const nodemailer = require('nodemailer');


const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        pool: true,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        ignoreTLS: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: 'Administrator - Chinh - Me <administrator@chinh.me>',
        to: options.email,
        subject: options.subject,
        html: options.html
    }

    await transporter.sendMail(mailOptions)
};

module.exports = sendEmail;
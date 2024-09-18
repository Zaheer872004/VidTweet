import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


// Function to send the email with username/email and password

const sendEmail = async (userEmail, username, password) => {
    

  try {
    const { data, error } = await resend.emails.send({
        from: 'zaheerkhan.com',  // Sender information
    //   to: [userEmail],  
        to: [userEmail],
        subject: 'Your Account Information | OTP for login',  // Email subject
        html: `
        <p>Hello ${username},</p>
        <p>Your new password is : <strong>${password}</strong></p>
        <p>Please use this password to verify your email to your account.</p>
      `,  // Email body with the username and password
    });

    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', data);
    }

  } catch (error) {
    console.error('An error occurred:', error);
  }
};

export {
    sendEmail
}
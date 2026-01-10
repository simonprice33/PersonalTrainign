/**
 * Email Service - Handles all email operations
 * Implements Single Responsibility Principle
 */

class EmailService {
  constructor(emailConfig) {
    this.emailConfig = emailConfig;
  }

  /**
   * Send welcome email to new subscriber
   */
  async sendWelcomeEmail(name, email) {
    if (!this.emailConfig.getStatus().configured) {
      console.log('⚠️ Email not configured - skipping welcome email');
      return;
    }

    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const welcomeEmail = {
        message: {
          subject: 'Welcome to Simon Price PT Newsletter!',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome ${name}!</h2>
                <p>Thank you for subscribing to our newsletter. You'll receive updates about:</p>
                <ul>
                  <li>Fitness tips and workouts</li>
                  <li>Nutrition advice</li>
                  <li>Training programs</li>
                  <li>Special offers</li>
                </ul>
                <p>Stay strong!</p>
                <p>Simon Price<br>Personal Trainer</p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(welcomeEmail);
      console.log(`📧 Welcome email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      throw error;
    }
  }

  /**
   * Send password creation email
   */
  async sendPasswordCreationEmail(clientName, email, passwordToken, frontendUrl) {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }

    const passwordSetupLink = `${frontendUrl}/client-create-password/${passwordToken}`;
    
    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const passwordEmail = {
        message: {
          subject: 'Set Up Your Client Portal Access - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px;">Set Up Your Client Portal</h2>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">Hi ${clientName},</p>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 30px 0;">Welcome! You now have access to your personal client portal where you can manage your subscription, update your information, and more.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${passwordSetupLink}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#22c55e" fillcolor="#22c55e">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Create Your Password</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${passwordSetupLink}" style="background-color: #22c55e; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; mso-hide: all;">Create Your Password</a>
                      <!--<![endif]-->
                    </div>

                    <p style="color: #333; line-height: 1.6; margin: 20px 0 10px 0;"><strong>What you can do in the portal:</strong></p>
                    <ul style="color: #555; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                      <li>View your subscription details</li>
                      <li>Update payment method</li>
                      <li>Update your address</li>
                      <li>Manage your account</li>
                    </ul>

                    <p style="color: #888; font-size: 14px; margin: 30px 0 0 0;">This link will expire in 7 days.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #333; margin: 0;">
                      Best regards,<br>
                      <strong>Simon Price</strong><br>
                      <span style="color: #666;">Personal Trainer</span>
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(passwordEmail);
      console.log(`📧 Password setup email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password creation email:', error.message);
      throw error;
    }
  }

  /**
   * Send password setup reminder
   */
  async sendPasswordReminderEmail(clientName, email, passwordToken, frontendUrl) {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }

    const passwordSetupLink = `${frontendUrl}/client-create-password/${passwordToken}`;
    
    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const reminderEmail = {
        message: {
          subject: 'Password Setup Reminder - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a2e;">Password Setup Reminder</h2>
                <p>Hi ${clientName || 'there'},</p>
                <p>This is a reminder to set up your password for your Simon Price PT client portal.</p>
                
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 30px auto;">
                  <tr>
                    <td align="center" bgcolor="#22c55e" style="border-radius: 8px;">
                      <a href="${passwordSetupLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px;">
                        Create Your Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p><strong>What you can do once logged in:</strong></p>
                <ul>
                  <li>View your subscription details</li>
                  <li>Update payment method</li>
                  <li>Update your address</li>
                  <li>Manage your account</li>
                </ul>

                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  This link will expire in 7 days. If you need help, please contact us.
                </p>
                
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>Simon Price</strong><br>
                  Personal Trainer
                </p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(reminderEmail);
      console.log(`📧 Password reminder email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reminder email:', error.message);
      throw error;
    }
  }

  /**
   * Send card details request email
   */
  async sendCardDetailsRequestEmail(clientName, email) {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }
    
    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const cardDetailsEmail = {
        message: {
          subject: 'Payment Details Required - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Payment Details Required</h2>
                <p>Hi ${clientName},</p>
                <p>To complete your subscription setup, we need you to add your payment details.</p>
                
                <p>Once you've created your password and logged into your client portal, you'll be able to add your payment method securely through our payment provider, Stripe.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Next Steps:</strong></p>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Create your password using the link in the previous email</li>
                    <li>Log in to your client portal</li>
                    <li>Navigate to "Manage Billing" to add your payment method</li>
                  </ol>
                </div>

                <p>If you have any questions or need assistance, please don't hesitate to contact me.</p>
                
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>Simon Price</strong><br>
                  Personal Trainer<br>
                  📧 simon.price@simonprice-pt.co.uk
                </p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(cardDetailsEmail);
      console.log(`📧 Card details request email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send card details request email:', error.message);
      throw error;
    }
  }

  /**
   * Send password setup email (used by controllers)
   */
  async sendPasswordSetupEmail(email, passwordLink) {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }

    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const passwordEmail = {
        message: {
          subject: 'Set Up Your Client Portal Access - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px;">Set Up Your Client Portal</h2>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">Hi there,</p>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 30px 0;">Welcome! You now have access to your personal client portal where you can manage your subscription, update your information, and more.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${passwordLink}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#22c55e" fillcolor="#22c55e">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Create Your Password</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${passwordLink}" style="background-color: #22c55e; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; mso-hide: all;">Create Your Password</a>
                      <!--<![endif]-->
                    </div>

                    <p style="color: #333; line-height: 1.6; margin: 20px 0 10px 0;"><strong>What you can do in the portal:</strong></p>
                    <ul style="color: #555; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                      <li>View your subscription details</li>
                      <li>Update payment method</li>
                      <li>Update your address</li>
                      <li>Manage your account</li>
                    </ul>

                    <p style="color: #888; font-size: 14px; margin: 30px 0 0 0;">This link will expire in 7 days.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #333; margin: 0;">
                      Best regards,<br>
                      <strong>Simon Price</strong><br>
                      <span style="color: #666;">Personal Trainer</span>
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(passwordEmail);
      console.log(`📧 Password setup email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password setup email:', error.message);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetLink, userType = 'client') {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }

    const title = userType === 'admin' ? 'Admin Password Reset' : 'Client Password Reset';
    
    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const resetEmail = {
        message: {
          subject: `${title} - Simon Price PT`,
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a2e;">${title}</h2>
                <p>You requested to reset your password.</p>
                <p>Click the button below to reset your password:</p>
                
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 30px auto;">
                  <tr>
                    <td align="center" bgcolor="#22c55e" style="border-radius: 8px;">
                      <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 12px;">
                  For security reasons, this link can only be used once. If you need another reset link, please request a new one.
                </p>
                <p style="color: #888; font-size: 12px;">
                  Simon Price Personal Training<br>
                  Bognor Regis, West Sussex, UK
                </p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(resetEmail);
      console.log(`📧 Password reset email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      throw error;
    }
  }

  /**
   * Send payment link email
   */
  async sendPaymentLinkEmail(email, name, paymentLink) {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }

    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const paymentEmail = {
        message: {
          subject: 'Complete Your Subscription Setup - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px;">Complete Your Subscription Setup</h2>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">Hi ${name},</p>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">Welcome to Simon Price PT! I'm excited to start working with you.</p>
                    <p style="color: #333; line-height: 1.6; margin: 0 0 30px 0;">To complete your subscription setup, please click the button below to add your payment details securely:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${paymentLink}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="10%" strokecolor="#22c55e" fillcolor="#22c55e">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Complete Setup</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a href="${paymentLink}" style="background-color: #22c55e; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; mso-hide: all;">Complete Setup</a>
                      <!--<![endif]-->
                    </div>

                    <p style="color: #333; line-height: 1.6; margin: 20px 0 0 0;">Once completed, you'll receive another email to set up your client portal password where you can manage your subscription and account details.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #333; margin: 0;">
                      Looking forward to working with you!<br>
                      <strong>Simon Price</strong><br>
                      <span style="color: #666;">Personal Trainer</span>
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(paymentEmail);
      console.log(`📧 Payment link email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send payment link email:', error.message);
      throw error;
    }
  }

  /**
   * Send payment method request email
   */
  async sendPaymentMethodRequestEmail(email, name) {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }

    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const requestEmail = {
        message: {
          subject: 'Payment Method Required - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Payment Method Required</h2>
                <p>Hi ${name},</p>
                <p>To activate your subscription and access all features, we need you to add a payment method to your account.</p>
                
                <p>Once you've set up your password and logged into your client portal, you'll be able to add your payment method securely through our payment provider, Stripe.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Next Steps:</strong></p>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Create your password using the link in your welcome email</li>
                    <li>Log in to your client portal</li>
                    <li>Navigate to "Manage Billing" to add your payment method</li>
                  </ol>
                </div>

                <p>If you have any questions or need assistance, please don't hesitate to contact me.</p>
                
                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>Simon Price</strong><br>
                  Personal Trainer<br>
                  📧 simon.price@simonprice-pt.co.uk
                </p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: email }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(requestEmail);
      console.log(`📧 Payment method request email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Failed to send payment method request email:', error.message);
      throw error;
    }
  }

  /**
   * Send generic email
   */
  async sendEmail(to, subject, htmlContent, textContent = null) {
    if (!this.emailConfig.getStatus().configured) {
      throw new Error('Email not configured');
    }

    try {
      const graphClient = await this.emailConfig.createGraphClient();
      const email = {
        message: {
          subject,
          body: {
            contentType: htmlContent ? 'HTML' : 'TEXT',
            content: htmlContent || textContent
          },
          toRecipients: [{
            emailAddress: { address: to }
          }]
        }
      };

      await graphClient.api(`/users/${this.emailConfig.getFromAddress()}/sendMail`).post(email);
      console.log(`📧 Email sent to: ${to} - ${subject}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  }
}

module.exports = EmailService;
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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Set Up Your Client Portal</h2>
                <p>Hi ${clientName},</p>
                <p>Welcome! You now have access to your personal client portal where you can manage your subscription, update your information, and more.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${passwordSetupLink}" 
                     style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                            color: #1a1a2e; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 30px; 
                            font-weight: bold;
                            display: inline-block;">
                    Create Your Password
                  </a>
                </div>

                <p><strong>What you can do in the portal:</strong></p>
                <ul>
                  <li>View your subscription details</li>
                  <li>Update payment method</li>
                  <li>Update your address</li>
                  <li>Manage your account</li>
                </ul>

                <p style="color: #888; font-size: 14px; margin-top: 30px;">This link will expire in 7 days.</p>
                
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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Setup Reminder</h2>
                <p>Hi ${clientName || 'there'},</p>
                <p>This is a reminder to set up your password for your Simon Price PT client portal.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${passwordSetupLink}" 
                     style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                            color: #1a1a2e; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 30px; 
                            font-weight: bold;
                            display: inline-block;">
                    Create Your Password
                  </a>
                </div>

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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a2e;">Set Up Your Client Portal</h2>
                <p>Hi there,</p>
                <p>Welcome! You now have access to your personal client portal where you can manage your subscription, update your information, and more.</p>
                
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 30px auto;">
                  <tr>
                    <td align="center" bgcolor="#22c55e" style="border-radius: 8px;">
                      <a href="${passwordLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px;">
                        Create Your Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p><strong>What you can do in the portal:</strong></p>
                <ul>
                  <li>View your subscription details</li>
                  <li>Update payment method</li>
                  <li>Update your address</li>
                  <li>Manage your account</li>
                </ul>

                <p style="color: #888; font-size: 14px; margin-top: 30px;">This link will expire in 7 days.</p>
                
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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${title}</h2>
                <p>You requested to reset your password.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" 
                     style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                            color: #1a1a2e; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            font-weight: bold;
                            display: inline-block;">
                    Reset Password
                  </a>
                </div>
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
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a2e;">Complete Your Subscription Setup</h2>
                <p>Hi ${name},</p>
                <p>Welcome to Simon Price PT! I'm excited to start working with you.</p>
                
                <p>To complete your subscription setup, please click the button below to add your payment details securely:</p>
                
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 30px auto;">
                  <tr>
                    <td align="center" bgcolor="#22c55e" style="border-radius: 8px;">
                      <a href="${paymentLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px;">
                        Complete Setup
                      </a>
                    </td>
                  </tr>
                </table>

                <p>Once completed, you'll receive another email to set up your client portal password where you can manage your subscription and account details.</p>
                
                <p style="margin-top: 30px;">
                  Looking forward to working with you!<br>
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
/**
 * Email Configuration and Microsoft Graph Setup
 * Implements Single Responsibility Principle - handles only email configuration
 */

const { ConfidentialClientApplication } = require('@azure/msal-node');

class EmailConfig {
  constructor(config) {
    this.emailConfig = config.email;
    this.graphClient = null;
    this.clientApp = null;
  }

  /**
   * Initialize Microsoft Graph client
   * @returns {Object|null} Graph client instance
   */
  initialize() {
    if (!this._isConfigured()) {
      console.log('⚠️  Email not configured - email features disabled');
      return null;
    }

    try {
      // Create MSAL confidential client app
      this.clientApp = new ConfidentialClientApplication({
        auth: {
          clientId: this.emailConfig.clientId,
          clientSecret: this.emailConfig.clientSecret,
          authority: `https://login.microsoftonline.com/${this.emailConfig.tenantId}`
        }
      });

      console.log(`✅ Microsoft Graph configured`);
      console.log(`📧 Email from: ${this.emailConfig.from}`);
      console.log(`📨 Tenant: ${this.emailConfig.tenantId}`);
      
      return this;
    } catch (error) {
      console.error('❌ Microsoft Graph initialization failed:', error.message);
      return null;
    }
  }

  /**
   * Create authenticated Graph client
   * @returns {Promise<Object>} Authenticated Graph client
   */
  async createGraphClient() {
    if (!this.clientApp) {
      throw new Error('Email not configured');
    }

    try {
      // Get access token using client credentials
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default']
      };

      const response = await this.clientApp.acquireTokenByClientCredential(clientCredentialRequest);
      
      if (!response || !response.accessToken) {
        throw new Error('Failed to acquire access token');
      }

      // Create Graph client with access token (v3.x syntax)
      const { Client } = require('@microsoft/microsoft-graph-client');
      
      const client = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        }
      });
      
      return client;
    } catch (error) {
      console.error('❌ Graph client creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if email is properly configured
   * @private
   * @returns {boolean}
   */
  _isConfigured() {
    return !!(
      this.emailConfig.tenantId &&
      this.emailConfig.clientId &&
      this.emailConfig.clientSecret &&
      this.emailConfig.from
    );
  }

  /**
   * Get email configuration status
   * @returns {Object} Configuration status
   */
  getStatus() {
    return {
      configured: this._isConfigured(),
      from: this.emailConfig.from,
      to: this.emailConfig.to,
      tenantId: this.emailConfig.tenantId,
      clientIdConfigured: !!this.emailConfig.clientId,
      clientSecretConfigured: !!this.emailConfig.clientSecret
    };
  }

  /**
   * Get email sender address
   * @returns {string} Email sender address
   */
  getFromAddress() {
    return this.emailConfig.from;
  }

  /**
   * Get default email recipient
   * @returns {string} Default email recipient
   */
  getToAddress() {
    return this.emailConfig.to;
  }
}

module.exports = EmailConfig;
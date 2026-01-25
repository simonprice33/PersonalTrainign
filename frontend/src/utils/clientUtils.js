/**
 * Client Data Utilities
 * Provides consistent normalization of client data from different sources
 */

/**
 * Normalizes client data to a consistent structure
 * Handles both legacy flat fields and new nested structures
 * 
 * @param {Object} client - Raw client data from API
 * @returns {Object} - Normalized client object with consistent field names
 */
export const normalizeClient = (client) => {
  if (!client) return null;

  // Normalize Stripe customer ID
  const stripeCustomerId = client.stripe_customer_id || client.customer_id || null;

  // Normalize address - prefer nested structure, fall back to flat fields
  const address = {
    line1: client.address?.line1 || client.address_line_1 || '',
    line2: client.address?.line2 || client.address_line_2 || '',
    city: client.address?.city || client.city || '',
    postcode: client.address?.postcode || client.postcode || '',
    country: client.address?.country || client.country || 'GB'
  };

  // Normalize name - handle first_name/last_name vs single name field
  const name = client.name || 
    (client.first_name && client.last_name 
      ? `${client.first_name} ${client.last_name}`.trim() 
      : client.first_name || client.last_name || '');

  // Normalize phone/telephone
  const telephone = client.telephone || client.phone || '';

  // Normalize price fields
  const price = client.price || client.monthly_price || client.subscription_price || 125;

  // Normalize billing day
  const billingDay = client.billingDay || client.billing_day || 1;

  // Normalize subscription status
  const subscriptionStatus = client.subscription_status || client.status || 'unknown';

  return {
    // Core identifiers
    email: client.email || '',
    stripe_customer_id: stripeCustomerId,
    
    // Personal info
    name,
    telephone,
    
    // Normalized address as nested object
    address,
    
    // Subscription details
    price,
    billingDay,
    prorate: client.prorate !== undefined ? client.prorate : true,
    subscription_status: subscriptionStatus,
    cancel_at_period_end: client.cancel_at_period_end || false,
    subscription_ends_at: client.subscription_ends_at || null,
    
    // Emergency contact
    emergency_contact_name: client.emergency_contact_name || '',
    emergency_contact_number: client.emergency_contact_number || '',
    emergency_contact_relationship: client.emergency_contact_relationship || '',
    
    // Metadata
    imported_at: client.imported_at || null,
    created_at: client.created_at || null,
    
    // Keep original data for reference if needed
    _original: client
  };
};

/**
 * Prepares client data for form editing
 * Returns flat structure suitable for form state
 * 
 * @param {Object} client - Raw or normalized client data
 * @returns {Object} - Flat form data object
 */
export const clientToFormData = (client) => {
  const normalized = normalizeClient(client);
  if (!normalized) return {};

  return {
    name: normalized.name,
    telephone: normalized.telephone,
    price: normalized.price,
    billingDay: normalized.billingDay,
    prorate: normalized.prorate,
    addressLine1: normalized.address.line1,
    addressLine2: normalized.address.line2,
    city: normalized.address.city,
    postcode: normalized.address.postcode,
    country: normalized.address.country,
    emergencyContactName: normalized.emergency_contact_name,
    emergencyContactNumber: normalized.emergency_contact_number,
    emergencyContactRelationship: normalized.emergency_contact_relationship
  };
};

/**
 * Gets a display-friendly address string from client data
 * 
 * @param {Object} client - Raw or normalized client data
 * @returns {string} - Formatted address string
 */
export const getDisplayAddress = (client) => {
  const normalized = normalizeClient(client);
  if (!normalized) return 'Not set';

  const { address } = normalized;
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.postcode
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Not set';
};

/**
 * Gets the customer ID for Stripe operations
 * 
 * @param {Object} client - Raw client data
 * @returns {string|null} - Stripe customer ID or null
 */
export const getStripeCustomerId = (client) => {
  if (!client) return null;
  return client.stripe_customer_id || client.customer_id || null;
};

/**
 * Checks if client has an active subscription
 * 
 * @param {Object} client - Raw or normalized client data
 * @returns {boolean} - True if subscription is active
 */
export const hasActiveSubscription = (client) => {
  if (!client) return false;
  const status = client.subscription_status || client.status;
  return status === 'active' || status === 'trialing';
};

/**
 * Gets the appropriate status badge info
 * 
 * @param {Object} client - Raw or normalized client data
 * @returns {Object} - { status, color, label }
 */
export const getStatusInfo = (client) => {
  if (!client) return { status: 'unknown', color: 'gray', label: 'Unknown' };
  
  const status = client.subscription_status || client.status || 'pending';
  
  const statusMap = {
    active: { color: 'green', label: 'Active' },
    trialing: { color: 'green', label: 'Trial' },
    suspended: { color: 'orange', label: 'Suspended' },
    paused: { color: 'orange', label: 'Paused' },
    cancelled: { color: 'red', label: 'Cancelled' },
    canceled: { color: 'red', label: 'Cancelled' },
    canceling: { color: 'yellow', label: 'Canceling' },
    past_due: { color: 'red', label: 'Past Due' },
    pending: { color: 'yellow', label: 'Pending' },
    pending_payment: { color: 'yellow', label: 'Awaiting Payment' }
  };

  return {
    status,
    ...statusMap[status] || { color: 'gray', label: 'Unknown' }
  };
};

export default {
  normalizeClient,
  clientToFormData,
  getDisplayAddress,
  getStripeCustomerId,
  hasActiveSubscription,
  getStatusInfo
};

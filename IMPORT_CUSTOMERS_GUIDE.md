# Import Customers from Stripe - User Guide

## Overview
The **Import Customers** feature allows you to import existing Stripe customers into your client portal system, creating login accounts for them automatically.

## Access
- **Location**: Admin Dashboard → Import Customers card
- **URL**: `/admin/import-customers`
- **Who can access**: Admin users only (requires authentication)

---

## How It Works

### Step 1: Enter Stripe Customer IDs
1. Navigate to **Admin Dashboard** → **Import Customers**
2. In the text area, enter your Stripe Customer IDs
3. You can enter IDs in any of these formats:
   - **One per line**: 
     ```
     cus_xxxxxxxxxxxxx
     cus_yyyyyyyyyyyyy
     cus_zzzzzzzzzzzzz
     ```
   - **Comma-separated**: `cus_xxxxxxxxxxxxx, cus_yyyyyyyyyyyyy`
   - **Space-separated**: `cus_xxxxxxxxxxxxx cus_yyyyyyyyyyyyy`

4. Click **"Fetch Customer Data"**

### Step 2: Review & Edit Customer Information
The system will fetch the following data from Stripe:
- ✅ Customer name
- ✅ Email address
- ✅ Phone number (if available)
- ✅ Address (if available)
- ✅ Subscription status
- ✅ Payment method status

**Status Logic:**
- **Active**: Customer has an active subscription with a payment method
- **Pending (No Card)**: Customer has no payment method set up
- **Cancelled**: Customer's subscription has been cancelled

**You can edit any field** before importing by clicking the **Edit** button on each row.

### Step 3: Save & Send Emails
Click **"Save & Send Emails"** to:
1. Create client accounts in the database
2. Create client portal login accounts
3. Send password creation emails to ALL customers
4. Send payment card request emails to customers with "Pending (No Card)" status

---

## Email Templates

### 1. Password Creation Email
**Sent to**: All imported customers  
**Subject**: "Set Up Your Client Portal Access - Simon Price PT"  
**Contains**: 
- Link to create password (expires in 7 days)
- Overview of portal features
- Professional branding

### 2. Card Details Request Email  
**Sent to**: Customers with "Pending (No Card)" status  
**Subject**: "Payment Details Required - Simon Price PT"  
**Contains**:
- Instructions to add payment method
- Step-by-step guide
- Login instructions

---

## Important Notes

### ✅ What Gets Imported
- Customer name, email, phone, address
- Subscription status and details
- Payment method status
- Creates both:
  - Client record (subscription data)
  - Client user account (login credentials)

### ⚠️ Duplicate Handling
- If a customer already exists in the database, they will be **skipped**
- You'll see an error message: "Customer already exists in database"
- No data will be overwritten

### 🔒 Security
- Password links expire after 7 days
- Passwords are hashed with bcrypt
- All data is stored securely in MongoDB

### 📧 Email Requirements
- Valid Microsoft Graph API credentials must be configured
- Emails are sent from: `simon.price@simonprice-pt.co.uk`

---

## Finding Stripe Customer IDs

### Method 1: Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **"Customers"** in the left menu
3. Customer IDs are displayed in the format: `cus_xxxxxxxxxxxxx`
4. You can search by name or email to find specific customers

### Method 2: Export from Stripe
1. Go to Stripe Dashboard → Customers
2. Click **"Export"** button
3. Select **"All customers"** or filter by date/status
4. Download CSV file
5. Copy the customer IDs from the CSV

### Method 3: Stripe API
If you're technical, you can use the Stripe API to list customers:
```javascript
const customers = await stripe.customers.list({ limit: 100 });
```

---

## Testing the Import

### Test Checklist:
1. ✅ Fetch customer data with valid Stripe Customer ID
2. ✅ Verify customer information is displayed correctly
3. ✅ Edit a customer's details
4. ✅ Save and import customers
5. ✅ Check that password creation email is received
6. ✅ Check that card details email is received (for pending customers)
7. ✅ Verify customer can create password via email link
8. ✅ Verify customer can log in to client portal

---

## Troubleshooting

### "Stripe not configured" error
**Solution**: Ensure `STRIPE_SECRET_KEY` is set in `/app/backend/.env`

### "Customer already exists" error
**Solution**: This customer has already been imported. Check the **Client Management** page to view existing clients.

### "Invalid customer ID" error
**Solution**: 
- Ensure the customer ID starts with `cus_`
- Verify the customer exists in your Stripe account
- Check if you're using the correct Stripe account (test vs. live)

### Emails not sending
**Solution**: 
- Verify Microsoft Graph API credentials in backend `.env`
- Check backend logs: `tail -n 50 /var/log/supervisor/backend.out.log`
- Ensure `EMAIL_FROM` is configured correctly

### Customer status is incorrect
**Solution**: 
- Status is determined automatically based on Stripe subscription data
- You can edit the status before saving
- After import, admins can update status in **Client Users** page

---

## Backend Endpoints

### POST `/api/admin/import-customers/fetch`
**Purpose**: Fetch customer data from Stripe  
**Auth**: Admin JWT token required  
**Body**:
```json
{
  "customerIds": ["cus_xxxxx", "cus_yyyyy"]
}
```

**Response**:
```json
{
  "success": true,
  "customers": [...],
  "errors": [...]
}
```

### POST `/api/admin/import-customers/save`
**Purpose**: Save imported customers and send emails  
**Auth**: Admin JWT token required  
**Body**:
```json
{
  "customers": [...]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully imported X customer(s)",
  "customers": [...],
  "errors": [...]
}
```

---

## Related Pages
- **Client Management** (`/admin/clients`) - View all clients and their subscriptions
- **Client Users** (`/admin/client-users`) - Manage client login accounts and statuses
- **Client Portal** (`/client-portal`) - Where clients log in after creating their password

---

## Future Enhancements
Potential improvements for the Import Customers feature:
- Bulk import via CSV file upload
- Automatic periodic sync with Stripe
- Import customer subscription history
- Import customer payment history
- Custom email templates
- Preview emails before sending

---

## Support
If you encounter any issues with the Import Customers feature:
1. Check the backend logs: `tail -n 100 /var/log/supervisor/backend.err.log`
2. Check the browser console for frontend errors
3. Verify your Stripe API keys are correctly configured
4. Ensure Microsoft Graph API is configured for email sending

For technical support, contact the development team.

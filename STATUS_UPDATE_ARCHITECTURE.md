# Client User Status Update - Architecture & Troubleshooting

## 📋 Overview
The Client User Status Update feature allows admins to change the status of client login accounts from the **Client Users** page (`/admin/client-users`).

---

## 🏗️ Architecture

### Database Structure
The system uses **TWO MongoDB collections** to store client data:

#### 1. `clients` Collection
**Purpose**: Stores subscription and billing information
```javascript
{
  email: "client@example.com",
  name: "Client Name",
  telephone: "1234567890",
  stripe_customer_id: "cus_xxxxx",
  stripe_subscription_id: "sub_xxxxx",
  status: "active",  // ← Status field
  created_at: Date,
  updated_at: Date
}
```

#### 2. `client_users` Collection
**Purpose**: Stores login credentials and authentication data
```javascript
{
  email: "client@example.com",
  password: "$2a$10$hashxxxxxx",  // bcrypt hash
  status: "active",  // ← Status field
  created_at: Date,
  password_reset_token: null,
  password_reset_expires: null
}
```

### Why Two Collections?
- **Separation of Concerns**: Billing data (Stripe) separate from authentication data
- **Security**: Password hashes isolated from business data
- **Flexibility**: Can have a client record without login credentials (pending onboarding)

---

## 🔄 Status Update Flow

### When Admin Changes Status:

```
Frontend (ClientUserManagement.jsx)
  ↓
  1. User selects new status from dropdown
  ↓
  2. Confirmation dialog appears
  ↓
  3. PUT request to backend: /api/admin/client-users/:email/status
  ↓
Backend (server.js)
  ↓
  4. JWT authentication check
  ↓
  5. Validate status value (pending, active, suspended, cancelled)
  ↓
  6. Update BOTH collections:
     - clients.updateOne({ email }, { $set: { status, updated_at, updated_by } })
     - client_users.updateOne({ email }, { $set: { status, updated_at } })
  ↓
  7. Return success response
  ↓
Frontend
  ↓
  8. Refresh client users list
  ↓
  9. Show updated status in table
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to update status" Error

**Possible Causes:**

#### A. Client Doesn't Exist in Database
**Symptom**: Error appears when trying to update any client
**Diagnosis**:
```bash
mongosh --eval '
db = db.getSiblingDB("simonprice_pt_db");
db.clients.find({}, {email: 1, status: 1}).pretty();
db.client_users.find({}, {email: 1, status: 1}).pretty();
'
```
**Solution**: Clients must be created first through:
- Admin creates payment link → Client onboards → Records created
- Or use the **Import Customers** feature to import existing Stripe customers

#### B. Client Exists in Only One Collection
**Symptom**: Partial data in database
**Diagnosis**: Check if client exists in both collections
**Solution**: The backend now updates BOTH collections, but if data is inconsistent, you may need to:
```bash
# Add missing client_user record
mongosh --eval '
db = db.getSiblingDB("simonprice_pt_db");
db.client_users.insertOne({
  email: "client@example.com",
  password: null,
  status: "pending",
  created_at: new Date()
});
'
```

#### C. JWT Token Expired
**Symptom**: All API calls fail with 401/403
**Solution**: 
- Log out and log back in to get a new token
- Token expires after 20 minutes of inactivity

#### D. Database Connection Issue
**Symptom**: "Database not available" error
**Diagnosis**: Check backend logs
```bash
tail -f /var/log/supervisor/backend.err.log
```
**Solution**: 
- Restart backend: `sudo supervisorctl restart backend`
- Check MongoDB is running: `sudo supervisorctl status mongodb`

---

## 🎯 Status Values

| Status | Meaning | When to Use |
|--------|---------|-------------|
| **pending** | Account created, awaiting activation | Client hasn't completed onboarding or payment setup |
| **active** | Fully operational account | Client has active subscription and payment method |
| **suspended** | Temporarily disabled | Payment issues, temporary hold, etc. |
| **cancelled** | Account terminated | Client cancelled subscription |

---

## 🔍 Debugging Steps

### Step 1: Check if Client Exists
```bash
mongosh --eval '
db = db.getSiblingDB("simonprice_pt_db");
var email = "client@example.com";  // Replace with actual email
print("Client in clients collection:");
printjson(db.clients.findOne({email: email}));
print("\nClient in client_users collection:");
printjson(db.client_users.findOne({email: email}));
'
```

### Step 2: Test Backend Endpoint Directly
```bash
# Get admin token
TOKEN=$(curl -s -X POST "https://image-service-dev.preview.emergentagent.com/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"simon.price@simonprice-pt.co.uk","password":"Qwerty1234!!!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# Try to update status
curl -X PUT "https://image-service-dev.preview.emergentagent.com/api/admin/client-users/CLIENT_EMAIL/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"active"}' | python3 -m json.tool
```

### Step 3: Check Backend Logs
```bash
# Check for errors
tail -n 50 /var/log/supervisor/backend.err.log

# Check for status update logs
tail -n 50 /var/log/supervisor/backend.out.log | grep "status"
```

### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to change status
4. Look for red error messages
5. Check Network tab for API response

---

## ✅ Recent Improvements

### Frontend Enhancements:
1. **Better Error Messages**: Shows actual backend error instead of generic "Failed to update status"
2. **Confirmation Dialog**: Asks admin to confirm before changing status
3. **Loading State**: Shows "Updating..." while request is in progress
4. **Auto-Refresh**: Resets dropdown to correct value if update fails
5. **Improved Dropdown Styling**: Color-coded options with emojis

### Backend Enhancements:
1. **Updates Both Collections**: Ensures data consistency
2. **Better Error Responses**: Returns specific error messages (e.g., "Client not found")
3. **Logging**: Logs successful status updates for audit trail

---

## 📝 Testing Status Update

### Create a Test Client:
```bash
mongosh --eval '
db = db.getSiblingDB("simonprice_pt_db");

// Create client record
db.clients.insertOne({
  email: "test@example.com",
  name: "Test Client",
  status: "pending",
  created_at: new Date(),
  updated_at: new Date()
});

// Create client user record
db.client_users.insertOne({
  email: "test@example.com",
  password: "$2a$10$test_hash",
  status: "pending",
  created_at: new Date()
});

print("✅ Test client created: test@example.com");
'
```

### Test Status Change:
1. Go to `/admin/client-users`
2. Find `test@example.com`
3. Change status from dropdown
4. Confirm the change
5. Verify status updates in both:
   - The Status badge column
   - The Actions dropdown

### Cleanup Test Data:
```bash
mongosh --eval '
db = db.getSiblingDB("simonprice_pt_db");
db.clients.deleteOne({email: "test@example.com"});
db.client_users.deleteOne({email: "test@example.com"});
print("✅ Test data cleaned up");
'
```

---

## 🚀 How Clients Are Created

### Method 1: Admin Creates Payment Link
1. Admin goes to **Client Management** → **Create Payment Link**
2. Fills in client details (name, email, phone, price)
3. System creates record in `clients` collection with `status: 'pending'`
4. Client receives onboarding link via email
5. Client completes onboarding and payment
6. System creates record in `client_users` collection
7. Client receives password creation email
8. Status can now be managed from **Client Users** page

### Method 2: Import from Stripe (NEW!)
1. Admin goes to **Import Customers**
2. Enters Stripe Customer IDs
3. System fetches customer data from Stripe
4. System creates records in **both** collections
5. Status is automatically determined:
   - **Active**: Has active subscription + payment method
   - **Pending**: No payment method
   - **Cancelled**: Subscription cancelled
6. Emails sent automatically (password + card request if needed)

---

## 🔐 Security Notes

- All status update endpoints require **JWT authentication**
- Only **admin users** can change client statuses
- Status changes are **logged** with timestamp and admin email
- Password hashes are **never** exposed in API responses

---

## 📞 Need Help?

If you're still experiencing "Failed to update status" errors:

1. **Check Database**: Do you have any clients in the system?
   ```bash
   mongosh --eval 'db.getSiblingDB("simonprice_pt_db").client_users.countDocuments()'
   ```

2. **Check Backend Logs**: Look for specific error messages
   ```bash
   tail -n 100 /var/log/supervisor/backend.err.log
   ```

3. **Test with cURL**: Try the endpoint directly to see the exact error response

4. **Create Test Client**: Use the test client creation script above to verify functionality

5. **Import Real Clients**: Use the Import Customers feature to populate your database with real Stripe customers

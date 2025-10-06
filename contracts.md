# Simon Price Personal Training - API Contracts & Integration Plan

## Overview
This document defines the API contracts and integration plan between the React frontend and FastAPI backend for Simon Price Personal Training website.

## Mock Data Currently Used
The frontend currently uses mock data from `/app/frontend/src/mock/mockData.js` including:
- Testimonials (6 client success stories)
- About stats (experience, clients, success rate)
- Contact info (phone, email, location)
- Form submission handlers

## API Endpoints to Implement

### 1. Contact Form Submission
**Endpoint:** `POST /api/contact`
**Purpose:** Handle lead generation form submissions from potential clients

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)", 
  "phone": "string (optional)",
  "goals": "string (required) - weight-loss|muscle-gain|strength|endurance|general|other",
  "experience": "string (optional) - beginner|intermediate|advanced",
  "message": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your interest! Simon will get back to you within 24 hours.",
  "id": "contact_submission_id"
}
```

### 2. Newsletter Subscription
**Endpoint:** `POST /api/newsletter`
**Purpose:** Handle newsletter signups for fitness tips

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to fitness tips and updates!"
}
```

### 3. Get Testimonials
**Endpoint:** `GET /api/testimonials`
**Purpose:** Fetch client testimonials for display

**Response:**
```json
{
  "testimonials": [
    {
      "id": "string",
      "name": "string",
      "age": "number",
      "location": "string", 
      "rating": "number (1-5)",
      "comment": "string",
      "transformation": "string",
      "created_date": "datetime"
    }
  ]
}
```

### 4. Get Website Stats
**Endpoint:** `GET /api/stats`
**Purpose:** Fetch current website statistics for display

**Response:**
```json
{
  "clients_count": "number",
  "experience_years": "string",
  "success_rate": "string", 
  "rating": "string"
}
```

## Database Models Required

### ContactSubmission Model
```python
class ContactSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    goals: str  # Enum: weight-loss, muscle-gain, strength, endurance, general, other
    experience: Optional[str] = None  # Enum: beginner, intermediate, advanced
    message: Optional[str] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="new")  # new, contacted, converted
```

### NewsletterSubscription Model
```python
class NewsletterSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    subscribed_date: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
```

### Testimonial Model
```python
class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    location: str
    rating: int = Field(ge=1, le=5)
    comment: str
    transformation: str
    created_date: datetime = Field(default_factory=datetime.utcnow)
    is_featured: bool = Field(default=False)
    is_active: bool = Field(default=True)
```

## Frontend Integration Changes Required

### 1. Remove Mock Data Dependencies
- Replace `submitContactForm` from mock with actual API call
- Replace `subscribeNewsletter` from mock with actual API call  
- Replace static testimonials with API data fetch
- Replace static stats with API data fetch

### 2. Add API Service Layer
Create `/app/frontend/src/services/api.js` with:
- Contact form submission handler
- Newsletter subscription handler
- Testimonials data fetcher
- Stats data fetcher
- Error handling and loading states

### 3. Update Components
- **Contact.jsx**: Use real API endpoint for form submission
- **Footer.jsx**: Use real API endpoint for newsletter signup
- **Testimonials.jsx**: Fetch testimonials from API on component mount
- **About.jsx**: Fetch stats from API on component mount

## Error Handling Strategy
- Frontend: Show user-friendly error messages for failed submissions
- Backend: Log all errors and return consistent error responses
- Validation: Client-side validation + server-side validation

## Success Metrics
- Contact form submissions stored in database
- Newsletter subscriptions tracked
- Testimonials manageable through API
- Website stats updateable through backend

## Testing Requirements
- Test contact form submission end-to-end
- Test newsletter signup flow
- Test testimonials display with real data
- Test error handling scenarios
- Verify data persistence in MongoDB

This contract ensures seamless integration between the professional frontend and a robust backend system that can handle lead generation effectively.
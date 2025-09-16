# Civic Issue Tracker - API Documentation

This document provides comprehensive API documentation for the Civic Issue Tracker backend.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "message": "Success message",
  "data": { ... },
  "error": "Error message (if any)"
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### GET /auth/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "avatar-url",
    "phone": "+1234567890",
    "address": { ... },
    "preferences": { ... }
  }
}
```

### Issues

#### GET /issues
Get all issues with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)
- `status` (string): Filter by status
- `category` (string): Filter by category
- `priority` (string): Filter by priority
- `search` (string): Search in title and description
- `nearby` (string): Filter by location (format: "lat,lng,radius")

**Response:**
```json
{
  "issues": [
    {
      "id": "issue-id",
      "title": "Pothole on Main Street",
      "description": "Large pothole causing traffic issues",
      "category": "Roads & Infrastructure",
      "priority": "High",
      "status": "Submitted",
      "reporter": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "avatar-url"
      },
      "location": {
        "address": "123 Main St, New York, NY",
        "coordinates": [-74.0060, 40.7128]
      },
      "images": [
        {
          "url": "image-url",
          "publicId": "cloudinary-id"
        }
      ],
      "upvotes": [...],
      "comments": [...],
      "upvoteCount": 5,
      "commentCount": 3,
      "hasUpvoted": false,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "lastUpdated": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}
```

#### POST /issues
Create a new issue (requires authentication).

**Request Body (multipart/form-data):**
```
title: "Issue title"
description: "Issue description"
category: "Roads & Infrastructure"
priority: "High"
location[address]: "123 Main St"
location[coordinates]: "[-74.0060, 40.7128]"
images: [file1, file2, ...]
tags: ["tag1", "tag2"]
isUrgent: true
```

**Response:**
```json
{
  "message": "Issue created successfully",
  "issue": { ... }
}
```

#### GET /issues/:id
Get specific issue by ID.

**Response:**
```json
{
  "issue": {
    "id": "issue-id",
    "title": "Issue title",
    "description": "Issue description",
    // ... full issue object
  }
}
```

#### PUT /issues/:id
Update an issue (requires authentication, only reporter or admin).

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "Updated category",
  "priority": "Medium"
}
```

#### DELETE /issues/:id
Delete an issue (requires authentication, only reporter or admin).

**Response:**
```json
{
  "message": "Issue deleted successfully"
}
```

#### POST /issues/:id/upvote
Upvote an issue (requires authentication).

**Response:**
```json
{
  "message": "Issue upvoted successfully",
  "upvoteCount": 6
}
```

#### DELETE /issues/:id/upvote
Remove upvote from an issue (requires authentication).

**Response:**
```json
{
  "message": "Upvote removed successfully",
  "upvoteCount": 5
}
```

#### POST /issues/:id/comments
Add comment to an issue (requires authentication).

**Request Body:**
```json
{
  "content": "This is a comment"
}
```

**Response:**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "id": "comment-id",
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "avatar": "avatar-url"
    },
    "content": "This is a comment",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### POST /issues/classify
Classify issue category using ML (requires authentication).

**Request Body (multipart/form-data):**
```
description: "Issue description"
image: [file] (optional)
```

**Response:**
```json
{
  "message": "Issue classified successfully",
  "classification": {
    "category": "Roads & Infrastructure",
    "confidence": 0.85,
    "suggestions": ["pothole", "road", "asphalt"]
  }
}
```

#### POST /issues/suggest-category
Get category suggestions based on description.

**Request Body:**
```json
{
  "description": "Large pothole on the main road"
}
```

**Response:**
```json
{
  "message": "Category suggestions generated successfully",
  "suggestions": {
    "suggestedCategory": "Roads & Infrastructure",
    "confidence": 0.9,
    "allCategories": [
      {
        "name": "Roads & Infrastructure",
        "confidence": 0.9
      },
      {
        "name": "Transportation",
        "confidence": 0.3
      }
    ]
  }
}
```

### Admin Endpoints

#### GET /admin/dashboard
Get admin dashboard statistics (requires admin authentication).

**Response:**
```json
{
  "overview": {
    "totalIssues": 100,
    "resolvedIssues": 80,
    "inProgressIssues": 15,
    "pendingIssues": 5,
    "urgentIssues": 3,
    "totalUsers": 50,
    "recentUsers": 10,
    "resolutionRate": 80.0
  },
  "analytics": {
    "issuesByCategory": [...],
    "issuesByStatus": [...],
    "issuesByPriority": [...],
    "monthlyTrends": [...],
    "topReporters": [...]
  }
}
```

#### GET /admin/issues
Get all issues for admin with advanced filtering (requires admin authentication).

**Query Parameters:**
- All parameters from GET /issues
- `department` (string): Filter by assigned department
- `isUrgent` (boolean): Filter urgent issues
- `dateFrom` (string): Filter from date (ISO 8601)
- `dateTo` (string): Filter to date (ISO 8601)

#### PUT /admin/issues/:id/status
Update issue status (requires admin authentication).

**Request Body:**
```json
{
  "status": "In Progress",
  "resolutionNotes": "Work started on this issue"
}
```

#### PUT /admin/issues/:id/assign
Assign issue to department (requires admin authentication).

**Request Body:**
```json
{
  "department": "Public Works",
  "estimatedResolution": "2023-12-31T23:59:59.000Z"
}
```

#### PUT /admin/issues/:id/priority
Update issue priority (requires admin authentication).

**Request Body:**
```json
{
  "priority": "High"
}
```

#### GET /admin/users
Get all users for admin (requires admin authentication).

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `role` (string): Filter by role (user/admin)
- `isActive` (boolean): Filter by active status
- `search` (string): Search in name and email

#### PUT /admin/users/:id/status
Update user status (requires admin authentication).

**Request Body:**
```json
{
  "isActive": false
}
```

#### GET /admin/analytics
Get detailed analytics (requires admin authentication).

**Query Parameters:**
- `period` (string): Time period (7d, 30d, 90d, 1y)

### User Endpoints

#### GET /users/profile
Get current user profile (requires authentication).

#### PUT /users/profile
Update current user profile (requires authentication).

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "push": false
    }
  }
}
```

#### GET /users/my-issues
Get current user's issues (requires authentication).

**Query Parameters:**
- Same as GET /issues

#### GET /users/stats
Get current user's statistics (requires authentication).

**Response:**
```json
{
  "overview": {
    "totalIssues": 10,
    "resolvedIssues": 8,
    "inProgressIssues": 1,
    "pendingIssues": 1,
    "totalUpvotes": 25,
    "totalComments": 15
  },
  "analytics": {
    "issuesByCategory": [...],
    "monthlyTrends": [...],
    "recentIssues": [...]
  }
}
```

#### POST /users/change-password
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### POST /users/upload-avatar
Upload user avatar (requires authentication).

**Request Body (multipart/form-data):**
```
avatar: [file]
```

#### DELETE /users/account
Delete user account (requires authentication).

**Request Body:**
```json
{
  "password": "currentpassword"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Issue not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Something went wrong!",
  "error": "Detailed error message (development only)"
}
```

## Rate Limiting

- API calls are limited to 100 requests per 15 minutes per IP
- Image uploads are limited to 5MB per file
- Maximum 5 images per issue

## Data Models

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "user|admin",
  "avatar": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "isActive": "boolean",
  "preferences": {
    "notifications": {
      "email": "boolean",
      "push": "boolean"
    },
    "language": "string"
  },
  "createdAt": "datetime",
  "lastLogin": "datetime"
}
```

### Issue
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "priority": "Low|Medium|High|Critical",
  "status": "Submitted|Under Review|In Progress|Resolved|Closed|Rejected",
  "reporter": "User",
  "assignedTo": {
    "department": "string",
    "assignedBy": "User",
    "assignedAt": "datetime"
  },
  "location": {
    "address": "string",
    "coordinates": [longitude, latitude],
    "city": "string",
    "state": "string",
    "zipCode": "string"
  },
  "images": [
    {
      "url": "string",
      "publicId": "string",
      "uploadedAt": "datetime"
    }
  ],
  "upvotes": [
    {
      "user": "User",
      "votedAt": "datetime"
    }
  ],
  "comments": [
    {
      "user": "User",
      "content": "string",
      "createdAt": "datetime",
      "isEdited": "boolean",
      "editedAt": "datetime"
    }
  ],
  "tags": ["string"],
  "isPublic": "boolean",
  "isUrgent": "boolean",
  "estimatedResolution": "datetime",
  "actualResolution": "datetime",
  "resolutionNotes": "string",
  "createdAt": "datetime",
  "lastUpdated": "datetime"
}
```

## Webhooks (Future Enhancement)

The API will support webhooks for real-time notifications:
- Issue status changes
- New comments
- New upvotes
- Assignment changes

## SDKs and Libraries

### JavaScript/Node.js
```javascript
import { CivicTrackerAPI } from 'civic-tracker-sdk';

const api = new CivicTrackerAPI({
  baseURL: 'http://localhost:5000/api',
  token: 'your-jwt-token'
});

// Get issues
const issues = await api.issues.getAll();

// Create issue
const issue = await api.issues.create({
  title: 'New Issue',
  description: 'Issue description',
  category: 'Roads & Infrastructure'
});
```

### Python
```python
from civic_tracker import CivicTrackerAPI

api = CivicTrackerAPI(
    base_url='http://localhost:5000/api',
    token='your-jwt-token'
)

# Get issues
issues = api.issues.get_all()

# Create issue
issue = api.issues.create({
    'title': 'New Issue',
    'description': 'Issue description',
    'category': 'Roads & Infrastructure'
})
```

## Support

For API support and questions:
- Check the troubleshooting section in SETUP.md
- Review error responses and status codes
- Ensure proper authentication headers
- Verify request body formats

# Civic Issue Tracker

A comprehensive civic issue reporting and tracking system built with React.js, Node.js, Express, and MongoDB.

## Features

### Frontend (React.js)
- User authentication (login/signup) with JWT
- Issue reporting form with photo upload and Google Maps integration
- View submitted issues and their statuses
- Upvote and comment on issues
- Interactive map view with issue heatmap
- Responsive design

### Backend (Node.js + Express + MongoDB)
- RESTful APIs for all features
- JWT-based authentication
- Role-based access control (users and admins)
- Image uploads using Cloudinary
- Geolocation support
- MongoDB for data persistence

### Admin Panel
- Dashboard to view all reported issues
- Filter by status, category, date, and location
- Assign issues to departments
- Change issue status (Submitted, In Progress, Resolved)
- Analytics and reporting

### Bonus Features
- ML model for auto-categorization of issues
- Real-time notifications for status changes
- Issue heatmap visualization

## Quick Start

1. Install all dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Fill in your API keys and configuration

3. Start the development servers:
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

## Project Structure

```
civic-issue-tracker/
├── backend/                 # Node.js + Express backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React.js frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main App component
│   └── package.json
└── README.md
```

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Issues
- `GET /api/issues` - Get all issues (with filters)
- `POST /api/issues` - Create new issue
- `GET /api/issues/:id` - Get specific issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

### Admin
- `GET /api/admin/issues` - Get all issues for admin
- `PUT /api/admin/issues/:id/status` - Update issue status
- `PUT /api/admin/issues/:id/assign` - Assign issue to department

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/civic-issues
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
GOOGLE_MAPS_API_KEY=your-google-maps-key
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## Technologies Used

- **Frontend**: React.js, Material-UI, Google Maps API
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary
- **Maps**: Google Maps API
- **Styling**: Material-UI, CSS3

## License

MIT License

# Civic Issue Tracker - Setup Guide

This guide will help you set up and run the Civic Issue Tracker application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Git

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd civic-issue-tracker
   ```

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**:
   - Copy `backend/env.example` to `backend/.env`
   - Copy `frontend/env.example` to `frontend/.env`
   - Fill in your API keys and configuration (see Environment Variables section below)

4. **Start MongoDB**:
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/civic-issues`

5. **Start the application**:
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

## Environment Variables

### Backend (.env)
Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/civic-issues

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
Create a `.env` file in the `frontend` directory with the following variables:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Mapbox API Key (optional, for advanced mapping features)
REACT_APP_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token

# App Configuration
REACT_APP_APP_NAME=Civic Issue Tracker
REACT_APP_VERSION=1.0.0
```

## Getting API Keys

### 1. MongoDB
- Install MongoDB locally or use MongoDB Atlas (cloud)
- For local installation: https://docs.mongodb.com/manual/installation/
- For Atlas: https://www.mongodb.com/atlas

### 2. Cloudinary (Image Upload)
1. Sign up at https://cloudinary.com
2. Go to your dashboard
3. Copy your Cloud Name, API Key, and API Secret

### 3. Google Maps API
1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Create credentials (API Key)
5. Restrict the API key to your domains

### 4. JWT Secret
Generate a strong secret key:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Running Individual Services

### Backend Only
```bash
cd backend
npm install
npm run dev
```

### Frontend Only
```bash
cd frontend
npm install
npm start
```

## Database Setup

The application will automatically create the necessary collections when you first run it. No manual database setup is required.

## Testing the Application

1. **Start the application**: `npm run dev`
2. **Open your browser**: Go to http://localhost:3000
3. **Register a new account**: Click "Sign Up" and create an account
4. **Report an issue**: Click "Report Issue" and fill out the form
5. **View issues**: Browse the issues list and map view

## Admin Access

To access admin features:
1. Register a regular user account
2. In MongoDB, update the user's role to 'admin':
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```
3. Log out and log back in

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check the MONGODB_URI in your .env file

2. **CORS Error**:
   - Verify FRONTEND_URL in backend/.env matches your frontend URL

3. **Image Upload Issues**:
   - Check Cloudinary credentials
   - Ensure CLOUDINARY_* variables are set correctly

4. **Google Maps Not Loading**:
   - Verify GOOGLE_MAPS_API_KEY is set
   - Check API key restrictions in Google Console

5. **Port Already in Use**:
   - Change PORT in backend/.env
   - Or kill the process using the port

### Logs

- Backend logs: Check terminal where you ran `npm run dev`
- Frontend logs: Check browser console (F12)

## Production Deployment

For production deployment:

1. **Environment Variables**:
   - Set NODE_ENV=production
   - Use production MongoDB URI
   - Use production API keys

2. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

4. **Serve Frontend**:
   - Use a web server (nginx, Apache) to serve the built frontend
   - Or use a service like Vercel, Netlify for frontend
   - Use services like Heroku, DigitalOcean for backend

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check the console logs for error messages
4. Ensure all dependencies are installed

## Features Implemented

✅ **Backend Features**:
- User authentication (JWT)
- Issue reporting with image upload
- Admin panel APIs
- ML-based issue categorization
- Upvoting and commenting
- Geolocation support
- Role-based access control

✅ **Frontend Features**:
- React.js with Material-UI
- User authentication
- Issue reporting form
- Interactive map view
- Admin dashboard
- Responsive design
- Real-time updates

✅ **Bonus Features**:
- ML model for auto-categorization
- Image upload with Cloudinary
- Google Maps integration
- Advanced filtering and search
- Admin analytics
- Mobile-responsive design

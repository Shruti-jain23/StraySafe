# StraySafe Backend API

A comprehensive backend API for the StraySafe animal rescue platform built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Real-time Communication**: Socket.IO for live updates and notifications
- **File Upload**: Cloudinary integration for image storage
- **Email Notifications**: Automated email alerts using Nodemailer
- **SMS Alerts**: Critical notifications via Twilio
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Request validation using Joi
- **Security**: Helmet, CORS, rate limiting
- **Monitoring**: Request logging with Morgan

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Cloudinary account (for image uploads)
- Gmail account (for email notifications)
- Twilio account (for SMS notifications, optional)

### Installation

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your actual values in the `.env` file.

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run database migrations
   npm run migrate
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Reports
- `POST /api/reports` - Create new report
- `GET /api/reports` - Get all reports (with filters)
- `GET /api/reports/my` - Get user's reports
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `POST /api/reports/:id/updates` - Add update to report
- `POST /api/reports/:id/assign` - Assign report to NGO

### NGOs
- `POST /api/ngos/profile` - Create NGO profile
- `PUT /api/ngos/profile` - Update NGO profile
- `GET /api/ngos/profile/:id` - Get NGO profile
- `GET /api/ngos` - Get all NGOs
- `GET /api/ngos/my/reports` - Get NGO's assigned reports
- `GET /api/ngos/my/stats` - Get NGO statistics

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/stats` - Get user statistics

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts with roles (CITIZEN, VOLUNTEER, NGO, ADMIN)
- **NGO Profiles**: Extended profiles for NGO users
- **Reports**: Stray animal reports with location and status
- **Report Updates**: Timeline updates for reports

## Real-time Features

The application uses Socket.IO for real-time features:

- Live report notifications to nearby NGOs
- Real-time status updates
- Typing indicators in report updates
- Live dashboard updates

## Security Features

- JWT authentication with secure tokens
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet for security headers

## Notification System

- **Email**: Welcome emails, report notifications, status updates
- **SMS**: Critical alerts for urgent cases
- **Real-time**: Socket.IO for instant updates

## Background Jobs

Automated tasks using node-cron:

- Daily summary emails to NGOs
- Cleanup of old data
- Escalation of stale critical reports

## Development

### Database Operations

```bash
# Reset database
npm run migrate

# Open Prisma Studio
npm run studio

# Generate Prisma client after schema changes
npm run generate
```

### Testing

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_*`: Cloudinary credentials for image uploads
- `EMAIL_*`: Email service configuration
- `TWILIO_*`: SMS service configuration (optional)
- `GOOGLE_MAPS_API_KEY`: For geocoding services

## Deployment

The application is ready for deployment on platforms like:

- Heroku
- Railway
- DigitalOcean App Platform
- AWS/GCP/Azure

Make sure to:

1. Set up a production PostgreSQL database
2. Configure all environment variables
3. Run database migrations
4. Set up proper logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
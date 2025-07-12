# StraySafe Backend API

A comprehensive Node.js/Express backend for the StraySafe platform - a community-driven stray animal rescue coordination system.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Support for Citizens, NGOs, Volunteers, and Admins
- **Report Management**: Create, update, track stray animal reports
- **NGO Profiles**: Verified NGO registration and management
- **File Uploads**: Image processing and storage with Sharp
- **Real-time Updates**: Report status tracking and updates
- **Geographic Search**: Location-based report filtering
- **Security**: Rate limiting, input validation, and secure headers

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Sharp for image optimization
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and setup**:
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**:
   - Create PostgreSQL database
   - Run migrations (see main project supabase/migrations)
   - Seed sample data:
     ```bash
     npm run seed
     ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `GET /api/users/reports` - Get user's reports
- `GET /api/users` - Get all users (Admin)
- `PUT /api/users/:id/verify` - Verify user (Admin)

### Reports
- `GET /api/reports` - Get all reports (with filters)
- `GET /api/reports/:id` - Get single report
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report status
- `POST /api/reports/:id/updates` - Add report update
- `DELETE /api/reports/:id` - Delete report

### NGOs
- `GET /api/ngos` - Get verified NGOs
- `GET /api/ngos/:id` - Get NGO details
- `POST /api/ngos/profile` - Create/update NGO profile
- `GET /api/ngos/profile/me` - Get current NGO profile
- `PUT /api/ngos/:id/verify` - Verify NGO (Admin)
- `GET /api/ngos/stats/dashboard` - NGO dashboard stats

### File Uploads
- `POST /api/uploads/images` - Upload multiple images
- `POST /api/uploads/avatar` - Upload avatar image
- `DELETE /api/uploads/:filename` - Delete uploaded file

## Database Schema

The backend uses the existing PostgreSQL schema with these main tables:

- **users** - User accounts and profiles
- **ngo_profiles** - NGO organization details
- **reports** - Stray animal reports
- **report_updates** - Status updates for reports

## Authentication & Authorization

### Roles
- **CITIZEN** - Can create reports and view public data
- **VOLUNTEER** - Same as citizen with additional volunteer features
- **NGO** - Can manage reports, create profiles, add updates
- **ADMIN** - Full system access and user management

### JWT Tokens
- Tokens expire in 7 days (configurable)
- Include user ID and are verified on protected routes
- Refresh mechanism can be implemented as needed

## File Upload System

- **Image Processing**: Automatic WebP conversion and compression
- **Thumbnails**: Generated for all uploaded images
- **Size Limits**: 5MB per file, 10 files per request
- **Security**: File type validation and secure storage

## Error Handling

Comprehensive error handling with:
- Validation errors with detailed messages
- Database constraint error mapping
- Development vs production error responses
- Structured JSON error responses

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: All endpoints validated
- **SQL Injection Protection**: Parameterized queries
- **Password Hashing**: bcrypt with 12 rounds

## Development

### Sample Data
Run `npm run seed` to create sample accounts:
- Admin: admin@straysafe.org / admin123
- NGO: ngo@animalrescue.org / ngo123  
- Citizens: sarah.johnson@email.com / citizen123

### Environment Variables
Key configuration options:
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - CORS origin URL
- `NODE_ENV` - Environment (development/production)

### Logging
- Development: Detailed request logging
- Production: Combined format logging
- Database query logging with timing

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure SMTP for emails (optional)
5. Set up file storage (local or cloud)
6. Configure reverse proxy (nginx)
7. Set up SSL certificates

## API Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {
    // Response data
  },
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Contributing

1. Follow existing code style
2. Add validation for new endpoints
3. Include error handling
4. Update documentation
5. Test with sample data

## License

This project is part of the StraySafe platform for animal welfare.
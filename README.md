# Social Media Platform - MERN Stack

A comprehensive social media platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring user authentication, posts with media upload, social interactions, real-time features, and an admin panel with revenue management.

## 🚀 Features

### User Features

- **User Authentication & Profile Management**

  - User registration with email/username validation
  - JWT token-based authentication
  - Profile management with bio and profile picture
  - Password change functionality

- **Advanced Post Management**

  - Create posts with text content (max 280 characters)
  - Upload multiple images and videos
  - Auto-trim videos to 1 minute
  - Auto-generate video thumbnails
  - Character counter for posts
  - Edit and delete posts

- **Social Interactions**

  - Like/unlike posts with heart animation
  - Comment system with nested replies
  - Follow/unfollow users
  - Real-time like and comment updates
  - View tracking (70% visibility threshold)
  - Follow suggestions based on mutual connections

- **Enhanced User Interface**
  - Responsive design (desktop, tablet, mobile)
  - Dark/Light theme toggle
  - Infinite scroll for posts
  - Real-time notifications
  - Loading indicators and skeleton loaders
  - Success/error toast messages

### Admin Features

- **Employee Management**

  - Create employees with roles (Manager, Accountant)
  - Employee list with management capabilities
  - Role-based permissions

- **Revenue Sharing System**

  - Set pricing for views and likes
  - Revenue pricing management
  - Historical pricing records

- **Post Management**

  - Post approval system
  - View earnings calculations
  - Bulk post management

- **Account Dashboard**
  - Approved posts with earnings
  - Payment processing
  - Analytics and statistics

## 🛠 Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Media storage
- **Socket.io** - Real-time communication
- **Multer** - File upload handling

### Frontend

- **React.js** - UI framework
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time features
- **React Hook Form** - Form management
- **Framer Motion** - Animations
- **React Toastify** - Notifications

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- pnpm (preferred) or npm
- Cloudinary account (for media uploads)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-p
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pnpm install

# Create .env file and configure environment variables
cp .env.example .env
```

#### Environment Variables (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/socialmedia

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_should_be_very_long_and_random
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here_should_be_very_long_and_random
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cloudinary (Required for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Admin Credentials (optional)
ADMIN_EMAIL=admin@socialmedia.com
ADMIN_PASSWORD=admin123
ADMIN_USERNAME=admin
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
pnpm install

# Create .env file
touch .env
```

#### Frontend Environment Variables (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup

1. **Local MongoDB:**

   - Install MongoDB on your system
   - Start MongoDB service
   - The application will automatically create the database

2. **MongoDB Atlas (Cloud):**
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get the connection string
   - Update `MONGODB_URI` in backend .env file

### 5. Cloudinary Setup

1. Create a Cloudinary account at https://cloudinary.com
2. Go to Dashboard and copy:
   - Cloud Name
   - API Key
   - API Secret
3. Update the Cloudinary variables in backend .env file

## 🚀 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd backend
pnpm dev
```

The backend server will start on http://localhost:5000

#### Start Frontend Application

```bash
cd frontend
pnpm start
```

The frontend application will start on http://localhost:3000

### Production Mode

#### Backend

```bash
cd backend
pnpm start
```

#### Frontend

```bash
cd frontend
pnpm build
# Serve the build folder with your preferred web server
```

## 👥 Default Admin Account

To access the admin panel, you need to create an admin user manually in the database or use the seeding script.

**Default Admin Credentials:**

- Email: admin@socialmedia.com
- Password: admin123
- Role: admin

**Admin Login URL:** http://localhost:3000/admin/login

## 📱 Application Structure

```
project-p/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React contexts
│   │   ├── services/   # API services
│   │   ├── hooks/      # Custom hooks
│   │   ├── utils/      # Utility functions
│   │   └── App.js      # Main component
│   └── public/         # Static files
└── README.md
```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### Posts

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/view` - Add view to post

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/suggestions/follow` - Get follow suggestions

### Admin

- `GET /api/admin/stats` - Admin statistics
- `GET /api/admin/posts` - Posts for approval
- `POST /api/admin/posts/:id/approve` - Approve post
- `GET /api/admin/employees` - Get employees
- `POST /api/admin/employees` - Create employee

## 🎨 UI Features

- **Responsive Design:** Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme:** Toggle between themes with system preference detection
- **Real-time Updates:** Live notifications for likes, comments, and follows
- **Infinite Scroll:** Smooth loading of posts and content
- **Loading States:** Skeleton loaders and progress indicators
- **Toast Notifications:** Success and error messages
- **Form Validation:** Real-time form validation with helpful error messages

## 🔄 Real-time Features

The application uses Socket.io for real-time functionality:

- Live post likes and comments
- Real-time notifications
- Online user status
- Instant follow notifications
- Live post updates

## 🛡 Security Features

- JWT token authentication with refresh tokens
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- File upload restrictions
- XSS protection with helmet

## 🧪 Testing

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

## 📈 Performance Optimizations

- Image optimization with Cloudinary
- Lazy loading for components
- Pagination for large datasets
- Caching strategies
- Optimized database queries
- Compressed API responses

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)

1. Set environment variables
2. Deploy to your preferred platform
3. Ensure MongoDB connection

### Frontend Deployment (Netlify/Vercel)

1. Build the application
2. Set environment variables
3. Deploy the build folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **Cloudinary Upload Issues**

   - Verify API credentials
   - Check file size limits
   - Ensure proper file formats

3. **Port Already in Use**

   - Change port in environment variables
   - Kill existing processes

4. **CORS Errors**
   - Check frontend URL in backend CORS config
   - Verify API base URL in frontend

### Getting Help

If you encounter any issues:

1. Check the console for error messages
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check the troubleshooting section above

## 📞 Support

For support and questions, please open an issue on the repository or contact the development team.

---

**Built with ❤️ using the MERN Stack**

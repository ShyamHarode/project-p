# 🚀 Quick Setup Guide

## Prerequisites Setup

### 1. Install MongoDB

**Option A: Local MongoDB (Recommended for Development)**

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Windows
# Download from: https://www.mongodb.com/try/download/community
# Install and start MongoDB service
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to https://cloud.mongodb.com/
2. Create a free account
3. Create a new cluster
4. Get connection string
5. Update `MONGODB_URI` in backend/.env

### 2. Setup Environment Variables

**Backend (.env file):**

```bash
cd backend
cp .env.example .env  # If available, or create new .env
```

Update the `.env` file with your values:

```env
MONGODB_URI=mongodb://localhost:27017/socialmedia
JWT_SECRET=your_super_secret_jwt_key_here_should_be_very_long_and_random_12345
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here_should_be_very_long_and_random_67890
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# For media uploads (optional - get from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Frontend (.env file):**

```bash
cd frontend
# .env file should already exist with:
REACT_APP_API_URL=http://localhost:5000/api
```

## 🏃‍♂️ Quick Start

### Terminal 1 - Backend

```bash
cd backend
pnpm install
pnpm run seed:admin  # Create admin user
pnpm dev
```

### Terminal 2 - Frontend

```bash
cd frontend
pnpm install
pnpm start
```

## 🎯 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health
- **Admin Panel:** http://localhost:3000/admin/login

**Default Admin Credentials:**

- Email: admin@socialmedia.com
- Password: admin123

## 🔧 Troubleshooting

### MongoDB Issues

```bash
# Check if MongoDB is running
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux

# Start MongoDB
brew services start mongodb/brew/mongodb-community  # macOS
sudo systemctl start mongod                         # Linux
```

### Port Issues

If ports are busy, update in .env files:

- Backend: Change `PORT=5000` to `PORT=5001`
- Frontend: Change `REACT_APP_API_URL=http://localhost:5001/api`

### Dependency Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
```

## 📱 Testing the Application

1. **Register a new user** at http://localhost:3000/register
2. **Login** and explore the features
3. **Create posts** with text content
4. **Test admin panel** at http://localhost:3000/admin/login
5. **Check real-time features** by opening multiple browser tabs

## 🌟 What's Working

✅ User registration and authentication  
✅ Login/logout functionality  
✅ Protected routes  
✅ Dark/Light theme toggle  
✅ Responsive design  
✅ Admin authentication  
✅ Database connection  
✅ API endpoints  
✅ Real-time Socket.io setup

## 📋 Next Steps for Full Features

1. **Set up Cloudinary** for media uploads
2. **Test post creation** with images/videos
3. **Implement remaining UI components**
4. **Add more interactive features**
5. **Deploy to production**

Need help? Check the full README.md or open an issue!

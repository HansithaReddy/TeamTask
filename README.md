# TeamTask

A sleek, responsive task management application built with React, Firebase, and Tailwind CSS. Perfect for teams looking to organize and track their tasks efficiently.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## ✨ Key Features

### 🔐 User Management
- Secure authentication with Firebase
- Role-based access (Admin/User)
- User profile management

### 📋 Task Management
- Create, edit, and delete tasks
- Assign tasks to team members
- Priority levels (Low, Medium, High)
- Status tracking (To Do, In Progress, Done)
- Due date management
- Task commenting system

### 👑 Admin Features
- Comprehensive user management
- Task overview dashboard
- Bulk task operations
- Activity monitoring
- Analytics and reporting

### 📊 Analytics
- Task completion rates
- User performance metrics
- Priority distribution charts
- Time tracking

## 💡 Technical Highlights

- **Frontend**: React with Vite for fast development
- **Styling**: Tailwind CSS for responsive design
- **Animations**: Framer Motion for smooth transitions
- **Backend**: Firebase (Auth & Firestore)
- **Deployment**: Vercel-ready configuration

## 📱 Mobile Responsive

Fully responsive design that works seamlessly on:
- 💻 Desktop
- 📱 Mobile
- 📟 Tablets
  
## 📨 Email Notifications (Optional)

TeamTask includes optional email notifications for task assignments:

1. **Setup Cloud Function**
   - Check `functions/sendEmail/index.js` for SendGrid implementation
   - Deploy to Firebase Cloud Functions

2. **Configuration**
   Set your notification endpoint:
   ```powershell
   $env:NOTIFY_ENDPOINT = "https://us-central1-your-project.cloudfunctions.net/sendTaskNotification"
   ```

3. **Features**
   - Automatic notifications for new task assignments
   - Non-blocking operations
   - Secure API key handling

## 🎨 Design Features

- Dark/Light mode with consistent contrasts
- Smooth animations and transitions
- Modern, clean interface
- Accessible design patterns

## 🔒 Security Features

- Secure Firebase Authentication
- Role-based access control
- Environment variable protection
- Firestore security rules

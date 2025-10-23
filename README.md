# 🎓 Drive Learning

Transform your Google Drive into a powerful learning management system. This platform automatically converts your Google Drive folders into structured courses with lessons, progress tracking, and subscription management.

## Features

### **Google Drive Integration**
- **Automatic Course Discovery**: Convert Google Drive folders into structured courses
- **Real-time Content Sync**: Access your latest files directly from Google Drive
- **Seamless Authentication**: Use your Google account for secure access
- **Smart Token Management**: Automatic OAuth token refresh for uninterrupted access

### **Course Management**
- **Hierarchical Structure**: Organize content as Courses → Lessons → Files
- **Multiple Course Support**: Manage multiple courses from different Drive folders
- **File Type Support**: Handle documents, videos, presentations, and more
- **Breadcrumb Navigation**: Easy navigation through course hierarchy

### **Progress Tracking**
- **Lesson Completion**: Mark lessons as complete/incomplete
- **Course Progress**: Visual progress indicators for each course
- **Personal Dashboard**: Overview of all subscribed courses and progress
- **Progress Persistence**: Your progress is saved and synced across sessions

### **Subscription System**
- **Course Subscriptions**: Subscribe to courses you want to follow
- **Access Control**: Only access subscribed course content
- **Subscription Management**: Easy subscribe/unsubscribe functionality
- **User-specific Progress**: Individual progress tracking per user

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Console project with Drive API enabled
- Google Drive folders with your course content

### 1. Clone and Install

```bash
git clone git@github.com:dukex/drive-learning.git
cd drive-learning
npm install
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy your Client ID and Client Secret

### 3. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Course Configuration
COURSES_LIST="https://drive.google.com/drive/folders/your-folder-id-1,https://drive.google.com/drive/folders/your-folder-id-2"
```

### 4. Database Setup

The SQLite database will be created automatically on first run. No additional setup required!

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start learning!

## Course Structure

Organize your Google Drive folders like this:

```
📁 Course Folder (e.g., "JavaScript Fundamentals")
├── 📁 Lesson 1 - Variables and Data Types
│   ├── 📄 Introduction.pdf
│   ├── 🎥 Variables Demo.mp4
│   └── 📄 Exercises.docx
├── 📁 Lesson 2 - Functions
│   ├── 📄 Function Basics.pdf
│   └── 💻 Code Examples.js
└── 📁 Lesson 3 - Objects and Arrays
    ├── 📄 Objects Guide.pdf
    └── 🎥 Array Methods.mp4
```

The platform will automatically:
- Detect each top-level folder as a **Course**
- Treat subfolders as **Lessons**
- List all files within lessons as **Learning Materials**

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Authentication**: Better Auth with Google OAuth
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **APIs**: Google Drive API v3
- **Language**: TypeScript

## Architecture

### Core Components

- **Course Management**: Automatic Google Drive folder scanning and course creation
- **Authentication System**: Secure Google OAuth integration with automatic token refresh
- **Subscription Engine**: User-based course access control and management
- **Progress Tracking**: Lesson completion and course progress calculation
- **Database Layer**: SQLite for subscriptions, progress, and user data

### Key Features

- **Server-Side Rendering**: Fast initial page loads with Next.js SSR
- **Real-time Updates**: Dynamic content loading from Google Drive
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Error Handling**: Graceful handling of API limits and network issues

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── courses/           # Course-related pages
│   ├── dashboard/         # User dashboard
│   └── api/              # API routes
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── courses/          # Course-specific components
│   └── ui/               # General UI components
├── lib/                   # Core business logic
│   ├── models/           # Data models and types
│   ├── auth.ts           # Authentication configuration
│   ├── database.ts       # Database utilities
│   └── google-drive.ts   # Google Drive API integration
└── .kiro/specs/          # Feature specifications and documentation
```

### Adding New Features

This project uses a spec-driven development approach. Each feature is documented in `.kiro/specs/` with:

- **Requirements**: User stories and acceptance criteria
- **Design**: Technical architecture and implementation details  
- **Tasks**: Step-by-step implementation checklist

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow the spec-driven approach**: Create or update specs in `.kiro/specs/`
4. **Implement your changes**: Follow the existing code patterns
5. **Test thoroughly**: Ensure all features work as expected
6. **Submit a pull request**: Describe your changes and link to relevant specs

### Development Guidelines

- **Spec-First Development**: Create requirements and design documents before coding
- **TypeScript**: Use strong typing throughout the application
- **Component Reusability**: Create reusable components in the `components/` directory
- **Error Handling**: Implement proper error boundaries and user feedback
- **Performance**: Optimize for fast loading and smooth user experience

## Roadmap

### Current Features ✅
- Google Drive course integration
- User authentication and authorization
- Course subscription management
- Lesson progress tracking
- Responsive course browser

### Planned Features 🚧
- **Enhanced Progress Analytics**: Detailed learning analytics and insights
- **Course Recommendations**: AI-powered course suggestions
- **Collaborative Features**: Comments and discussions on lessons
- **Mobile App**: Native mobile application
- **Advanced Search**: Full-text search across course content
- **Offline Support**: Download courses for offline learning

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check the specs in `.kiro/specs/` for detailed feature documentation
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas

---

**Ready to transform your Google Drive into a learning platform?** 🚀

Get started in minutes and turn any Google Drive folder into an organized, trackable learning experience!
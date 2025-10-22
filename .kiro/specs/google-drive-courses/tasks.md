# Implementation Plan

- [x] 1. Set up Google Drive API integration with user authentication
  - Install required dependencies (googleapis)
  - Create Google Drive service that uses user access tokens
  - Implement environment variable configuration for COURSES_LIST
  - _Requirements: 4.1, 4.5_

- [x] 1.1 Create Google Drive service class with user auth
  - Implement GoogleDriveService that accepts user access tokens
  - Add methods for listing folders, files, and getting metadata
  - Handle API errors, rate limiting, and token refresh
  - _Requirements: 4.1, 4.5_

- [x] 1.2 Implement session and authentication utilities
  - Create utilities to extract user session and access token
  - Parse COURSES_LIST environment variable
  - Extract Google Drive folder IDs from URLs
  - Validate Google Drive URL formats
  - _Requirements: 1.1, 1.5, 4.1_

- [ ]* 1.3 Write unit tests for Google Drive service
  - Test authentication flow with mocked user tokens
  - Test API error handling scenarios
  - Test URL parsing and validation logic
  - _Requirements: 4.2, 4.3_

- [x] 2. Create data models and TypeScript interfaces
  - Define Course, Chapter, and ChapterFile interfaces
  - Create data transformation utilities for Google Drive API responses
  - Implement caching key generation functions
  - _Requirements: 1.2, 2.2, 3.2_

- [x] 2.1 Implement Course model and utilities
  - Create Course interface with all required properties
  - Add functions to transform Google Drive folder data to Course objects
  - Implement course metadata extraction from Drive API
  - _Requirements: 1.2, 1.3_

- [x] 2.2 Implement Chapter model and utilities
  - Create Chapter interface with course relationship
  - Add functions to transform subfolder data to Chapter objects
  - Implement chapter ordering and file counting logic
  - _Requirements: 2.2, 2.3_

- [x] 2.3 Implement ChapterFile model and utilities
  - Create ChapterFile interface with all file metadata
  - Add functions to transform Drive file data to ChapterFile objects
  - Generate download and view URLs for different file types
  - _Requirements: 3.2, 3.4_

- [x] 3. Create API routes for course data
  - Implement /api/courses route for listing all courses
  - Create /api/courses/[courseId] route for course details and chapters
  - Add /api/courses/[courseId]/chapters/[chapterId] route for chapter files
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 3.1 Implement courses list API endpoint with user auth
  - Create GET /api/courses route handler with session validation
  - Extract user access token from Better Auth session
  - Fetch all courses from COURSES_LIST using user's Drive permissions
  - Implement caching with 1-hour TTL per user
  - Handle authentication and Google Drive API errors gracefully
  - _Requirements: 1.1, 1.2, 4.1, 4.3, 5.1, 5.5_

- [x] 3.2 Implement course details API endpoint with user auth
  - Create GET /api/courses/[courseId] route handler with session validation
  - Use user access token to fetch course metadata and chapters from Google Drive
  - Implement user-specific caching with 30-minute TTL
  - Return structured course and chapter data
  - _Requirements: 2.1, 2.2, 4.1, 5.1_

- [x] 3.3 Implement chapter files API endpoint with user auth
  - Create GET /api/courses/[courseId]/chapters/[chapterId] route handler with session validation
  - Use user access token to fetch all files within the specified chapter folder
  - Implement user-specific caching with 15-minute TTL
  - Generate appropriate download and view URLs using user permissions
  - _Requirements: 3.1, 3.2, 3.4, 4.1, 5.1_

- [ ]* 3.4 Write integration tests for API routes
  - Test all API endpoints with mocked Google Drive responses
  - Verify error handling for invalid course/chapter IDs
  - Test caching behavior and TTL settings
  - _Requirements: 1.5, 2.5, 3.5_

- [x] 4. Create courses list page and navigation
  - Build courses list page component displaying all available courses
  - Implement course grid layout with course metadata
  - Add loading states and error handling for course fetching
  - _Requirements: 1.1, 1.3, 1.5_

- [x] 4.1 Implement CoursesListPage component with auth protection
  - Create React Server Component for courses list with session check
  - Redirect to login if user is not authenticated
  - Fetch courses data using authenticated API route
  - Display courses in responsive grid layout
  - Show course titles, descriptions, and chapter counts
  - _Requirements: 1.1, 1.3, 4.2, 4.3_

- [x] 4.2 Add loading and error states
  - Implement loading skeleton for courses list
  - Create error boundary for API failures
  - Display user-friendly error messages for inaccessible courses
  - Add retry functionality for failed requests
  - _Requirements: 1.5, 5.2, 5.3_

- [ ] 5. Create course detail page with chapters
  - Build course detail page showing course info and chapters list
  - Implement breadcrumb navigation
  - Add chapter metadata display (file count, last updated)
  - _Requirements: 2.1, 2.3, 2.5_

- [ ] 5.1 Implement CourseDetailPage component
  - Create dynamic route page for /courses/[courseId]
  - Fetch course and chapters data using API route
  - Display course information and chapters list
  - Implement navigation links to chapter pages
  - _Requirements: 2.1, 2.4_

- [ ] 5.2 Add breadcrumb navigation component
  - Create reusable Breadcrumb component
  - Show current course in navigation path
  - Implement proper linking back to courses list
  - Style breadcrumbs with Tailwind CSS
  - _Requirements: 2.5_

- [ ] 6. Create chapter detail page with files
  - Build chapter detail page displaying all chapter files
  - Implement file list with metadata (name, type, size)
  - Add file access links for viewing and downloading
  - Include breadcrumb navigation showing full hierarchy
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 6.1 Implement ChapterDetailPage component
  - Create dynamic route page for /courses/[courseId]/chapters/[chapterId]
  - Fetch chapter files data using API route
  - Display files list with comprehensive metadata
  - Implement direct access links for file viewing/downloading
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 6.2 Add file type icons and preview functionality
  - Create file type detection utility
  - Add appropriate icons for different file types
  - Implement file preview for supported formats
  - Handle unsupported file types gracefully
  - _Requirements: 3.3_

- [ ] 6.3 Enhance breadcrumb navigation for chapters
  - Extend Breadcrumb component to show course → chapter hierarchy
  - Add proper linking back to course and courses list
  - Display current chapter name in breadcrumb
  - _Requirements: 3.5_

- [ ] 7. Implement caching and performance optimizations
  - Add Redis caching layer for API responses
  - Implement cache invalidation strategies
  - Add loading indicators and pagination for large file lists
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 7.1 Set up caching infrastructure
  - Configure Redis or in-memory caching for API responses
  - Implement cache key generation based on course/chapter IDs
  - Add cache TTL settings matching design specifications
  - Create cache invalidation utilities
  - _Requirements: 5.1, 5.5_

- [ ] 7.2 Add pagination for large file lists
  - Implement pagination component for chapter files
  - Add server-side pagination to chapter files API
  - Set page size limit to 50 files per page
  - Include pagination controls in ChapterDetailPage
  - _Requirements: 5.4_

- [ ]* 7.3 Write performance tests
  - Create tests for API response times under load
  - Test cache effectiveness and hit rates
  - Verify pagination performance with large datasets
  - _Requirements: 5.1, 5.4_

- [ ] 8. Add error handling and user experience improvements
  - Implement comprehensive error boundaries
  - Add timeout handling for slow API responses
  - Create fallback UI for offline scenarios
  - _Requirements: 1.5, 4.2, 4.3, 5.3_

- [ ] 8.1 Implement error boundaries and fallback UI
  - Create global error boundary for unhandled errors
  - Add specific error handling for Google Drive API failures
  - Display appropriate error messages for different failure types
  - Implement fallback content when courses are unavailable
  - _Requirements: 1.5, 4.2, 4.3_

- [ ] 8.2 Add timeout and retry mechanisms
  - Implement 5-second timeout for API calls
  - Add exponential backoff for failed requests
  - Display timeout messages to users
  - Create retry buttons for failed operations
  - _Requirements: 5.3_

- [ ]* 8.3 Write end-to-end tests
  - Test complete course browsing workflow
  - Verify file access and download functionality
  - Test error scenarios and recovery
  - Validate mobile responsiveness
  - _Requirements: 1.1, 2.1, 3.1_
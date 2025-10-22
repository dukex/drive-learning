# Implementation Plan

- [x] 1. Create new lesson data models and interfaces
  - Create new lesson.ts model file with Lesson interface and utility functions
  - Create new lesson-file.ts model file with LessonFile interface and utility functions
  - Update models/index.ts to export new lesson models alongside existing chapter models
  - _Requirements: 1.1, 1.2_

- [x] 1.1 Implement Lesson model (replacing Chapter model)
  - Create src/lib/models/lesson.ts with Lesson interface
  - Implement transformDriveFolderToLesson function
  - Add sortLessonsByName and assignLessonOrder utility functions
  - Add generateLessonCacheKey function for caching
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Implement LessonFile model (replacing ChapterFile model)
  - Create src/lib/models/lesson-file.ts with LessonFile interface
  - Implement transformDriveFileToLessonFile function
  - Copy all utility functions from chapter-file.ts with lesson terminology
  - Add generateLessonFilesCacheKey function
  - _Requirements: 1.1, 1.2_

- [x] 1.3 Update models index to export lesson models
  - Add lesson and lesson-file exports to src/lib/models/index.ts
  - Keep existing chapter exports for backward compatibility during transition
  - Ensure all type exports and utility function exports are included
  - _Requirements: 1.1_

- [x] 2. Update course page to use lesson models and terminology
  - Update course detail page to import and use Lesson models instead of Chapter
  - Update all function calls to use lesson terminology
  - Update variable names and types throughout the component
  - _Requirements: 1.1, 1.2, 4.1_

- [x] 2.1 Update course page imports and data fetching
  - Update src/app/courses/[courseId]/page.tsx to import Lesson and LessonFile models
  - Replace transformDriveFolderToChapter with transformDriveFolderToLesson
  - Replace sortChaptersByName and assignChapterOrder with lesson equivalents
  - Update CourseApiResponse interface to use lessons instead of chapters
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Update course page variables and function parameters
  - Replace all chapter variables with lesson variables in fetchCourseData function
  - Update function comments and error messages to reference lessons
  - Update data transformation logic to use lesson terminology
  - _Requirements: 1.1, 4.5_

- [x] 3. Update chapter detail page to use lesson models and terminology
  - Update chapter detail page component to use new lesson models
  - Update all imports, interfaces, and function calls to use lesson terminology
  - Update all UI text to display "lesson" instead of "chapter"
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [x] 3.1 Update chapter detail page imports and interfaces
  - Update src/app/courses/[courseId]/chapters/[chapterId]/page.tsx imports to use LessonFile
  - Replace transformDriveFileToChapterFile with transformDriveFileToLessonFile
  - Update ChapterDetailPageProps interface to use lessonId parameter
  - Update ChapterApiResponse interface to use lesson terminology
  - _Requirements: 1.1, 1.2_

- [x] 3.2 Update chapter detail page data fetching and variables
  - Update fetchChapterData function to use lesson terminology in variables and parameters
  - Replace all chapter-related variable names with lesson equivalents
  - Update function comments and error messages to reference lessons
  - Update data transformation logic to use LessonFile models
  - _Requirements: 1.1, 1.2, 4.5_

- [x] 3.3 Update chapter detail page UI text and navigation
  - Replace all "chapter" text with "lesson" in the chapter detail page
  - Update breadcrumb navigation to show "lesson" terminology
  - Update page titles, headings, and loading states to use lesson terminology
  - Update component names and interfaces to use lesson terminology
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Update course detail page to use lesson terminology
  - Update course detail page to display "lessons" instead of "chapters"
  - Update navigation links to point to lesson routes
  - Update all UI text and counters to use lesson terminology
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4.1 Update course page imports and types
  - Update src/app/courses/[courseId]/page.tsx to import Lesson models
  - Update component interfaces to use Lesson type instead of Chapter
  - Update API response interfaces to use lessons terminology
  - _Requirements: 1.1, 3.1_

- [x] 4.2 Update course page UI and navigation
  - Replace all "chapter" text with "lesson" in course detail page
  - Update navigation links from /chapters/ to /lessons/
  - Update counters and labels to show lesson count instead of chapter count
  - Update empty state messages to reference lessons
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Update breadcrumb navigation component
  - Update Breadcrumb component to handle lesson routes
  - Update breadcrumb text to display "lesson" terminology
  - Ensure breadcrumb navigation works with new lesson URLs
  - _Requirements: 3.2, 3.4_

- [x] 5.1 Update Breadcrumb component for lesson support
  - Update src/components/ui/Breadcrumb.tsx to handle lesson routes
  - Update breadcrumb text generation to use lesson terminology
  - Ensure proper linking between course and lesson pages
  - Test breadcrumb navigation with new lesson URLs
  - _Requirements: 3.2, 3.4_

- [x] 6. Rename directory structure from chapters to lessons
  - Rename frontend page directories to use lesson terminology
  - Update all file paths and route structures
  - Ensure all navigation and links work with new directory structure
  - _Requirements: 2.3, 2.4_

- [x] 6.1 Rename chapter page directories to lesson directories
  - Rename src/app/courses/[courseId]/chapters/ to src/app/courses/[courseId]/lessons/
  - Rename [chapterId] directory to [lessonId] 
  - Update any remaining file references to use new directory structure
  - Test that all navigation and routing works with new paths
  - _Requirements: 2.3, 2.4_

- [x] 7. Clean up old chapter model files
  - Remove old chapter.ts and chapter-file.ts model files after migration
  - Update models/index.ts to remove chapter exports
  - Ensure no remaining imports reference the deleted chapter files
  - _Requirements: 2.1, 2.2_

- [x] 7.1 Remove old chapter model files
  - Delete src/lib/models/chapter.ts file
  - Delete src/lib/models/chapter-file.ts file
  - Update src/lib/models/index.ts to remove chapter exports
  - Ensure no remaining imports reference the deleted files
  - _Requirements: 2.1, 2.2_

- [ ]* 8. Write tests for lesson models and components
  - Create unit tests for new lesson model utility functions
  - Test lesson page components and navigation
  - Test data fetching and transformation logic
  - _Requirements: 1.1, 3.1_

- [ ]* 8.1 Write unit tests for lesson models
  - Test transformDriveFolderToLesson function with various inputs
  - Test sortLessonsByName and assignLessonOrder functions
  - Test lesson cache key generation functions
  - Test LessonFile transformation and utility functions
  - _Requirements: 1.1, 1.2_

- [ ]* 8.2 Write component tests for lesson pages
  - Test lesson detail page component rendering
  - Test course detail page with lesson terminology
  - Test navigation between course and lesson pages
  - Test error handling and loading states
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 9. Update documentation and comments
  - Update all code comments to use lesson terminology
  - Update JSDoc documentation for lesson models and functions
  - Update error messages and logging to reference lessons
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 9.1 Update code comments and JSDoc documentation
  - Update all inline comments in lesson model files
  - Update JSDoc comments for all lesson functions and interfaces
  - Update comments in lesson page components
  - Ensure all documentation accurately reflects lesson terminology
  - _Requirements: 5.1, 5.2_

- [ ] 9.2 Update error messages and logging
  - Update all error messages to reference lessons instead of chapters
  - Update console.log and debugging statements to use lesson terminology
  - Update user-facing error messages in frontend components
  - Ensure consistent terminology across all error handling
  - _Requirements: 5.4, 5.5_
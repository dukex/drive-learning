import { UserSession } from "@/lib/drive-auth-utils";
import Link from "next/link";

export default function Navigation({ user }: { user: UserSession['user']}) {
    return (
         <nav className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                      <Link href="/dashboard" className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Courses
                          </h1>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {user?.image && (
                        <img
                          src={user.image}
                          alt={user.name || 'User avatar'}
                          className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600"
                        />
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.name || user?.email}
                      </span>
                    </div>
                  </div>
                </div>
              </nav>
    )
}
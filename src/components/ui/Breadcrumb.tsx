import Link from 'next/link';
import { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index === 0 ? (
              // First item (home/root)
              item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {item.icon && (
                    <span className="w-3 h-3 mr-2.5">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </Link>
              ) : (
                <span className="inline-flex items-center text-sm font-medium text-gray-700">
                  {item.icon && (
                    <span className="w-3 h-3 mr-2.5">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </span>
              )
            ) : (
              // Subsequent items
              <div className="flex items-center">
                <ChevronRightIcon />
                {item.href ? (
                  <Link
                    href={item.href}
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {item.label}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="w-3 h-3 text-gray-400 mx-1"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 6 10"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m1 9 4-4-4-4"
      />
    </svg>
  );
}

// Common icons for breadcrumbs
export const BreadcrumbIcons = {
  Home: (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L9 3.414V19a1 1 0 0 0 2 0V3.414l7.293 7.293a1 1 0 0 0 1.414-1.414Z"/>
    </svg>
  ),
  Course: (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
  Chapter: (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};
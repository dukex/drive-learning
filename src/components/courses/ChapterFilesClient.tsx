'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { getFileTypeIcon, getFileTypeDisplayName, supportsPreview, getPreviewUrl } from '@/lib/utils/file-icons';
import { formatFileSize, isViewableInBrowser } from '@/lib/models/chapter-file';
import type { ChapterFile } from '@/lib/models';

interface ChapterFilesResponse {
  files: ChapterFile[];
  chapterName: string;
  chapterDescription?: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalFiles: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  cached: boolean;
  timestamp: string;
}

interface ChapterFilesClientProps {
  courseId: string;
  chapterId: string;
  initialData: ChapterFilesResponse;
}

function formatLastModified(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function ChapterFilesClient({ courseId, chapterId, initialData }: ChapterFilesClientProps) {
  const [data, setData] = useState<ChapterFilesResponse>(initialData);
  const [loading, setLoading] = useState(true); // Start with loading true to fetch initial data
  const [error, setError] = useState<string | null>(null);

  // Load initial data on mount
  useEffect(() => {
    fetchPage(1);
  }, [courseId, chapterId]);

  const fetchPage = async (page: number) => {
    if (page === data.pagination.currentPage) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/chapters/${chapterId}?page=${page}&limit=${data.pagination.limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chapter files');
      }

      const newData: ChapterFilesResponse = await response.json();
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const { files, pagination } = data;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Files</h2>
        {pagination.totalFiles > 0 && (
          <div className="text-sm text-gray-600">
            {pagination.totalFiles} {pagination.totalFiles === 1 ? 'file' : 'files'} total
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading files</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchPage(pagination.currentPage)}
                className="text-sm text-red-800 underline mt-2 hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No files found
          </h3>
          <p className="text-gray-500">
            This chapter doesn't have any files yet.
          </p>
        </div>
      ) : (
        <>
          {/* Files List */}
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${loading ? 'opacity-50' : ''}`}>
            <div className="divide-y divide-gray-200">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {getFileTypeIcon(file.mimeType, file.name)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {file.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>
                            {formatFileSize(file.size)}
                          </span>
                          <span>
                            {formatLastModified(new Date(file.lastModified))}
                          </span>
                          <span>
                            {getFileTypeDisplayName(file.mimeType, file.name)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 ml-4">
                      {/* Preview Button */}
                      {supportsPreview(file.mimeType, file.name) && (
                        <Link
                          href={getPreviewUrl(file.id, file.mimeType, file.name) || file.viewUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Preview
                        </Link>
                      )}

                      {/* View Button (fallback for non-previewable files) */}
                      {!supportsPreview(file.mimeType, file.name) && file.viewUrl && isViewableInBrowser(file.mimeType) && (
                        <Link
                          href={file.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Open
                        </Link>
                      )}

                      {/* Download Button */}
                      <Link
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download
                      </Link>
                    </div>
                  </div>

                  {/* Thumbnail if available */}
                  {file.thumbnailUrl && (
                    <div className="mt-4">
                      <img
                        src={file.thumbnailUrl}
                        alt={`${file.name} thumbnail`}
                        className="w-32 h-24 rounded-lg object-cover border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalFiles}
                itemsPerPage={pagination.limit}
                onPageChange={fetchPage}
                className="justify-center"
              />
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-900">Loading files...</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
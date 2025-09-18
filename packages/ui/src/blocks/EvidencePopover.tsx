import { useState } from 'react';
import { Button } from '../primitives/Button';

export interface CarrierCitation {
  chunkId: string;
  snippet: string;
  documentTitle: string;
  effectiveDate: string;
  page?: number;
  section?: string;
  score?: number;
}

export interface EvidencePopoverProps {
  citations: CarrierCitation[];
  trigger?: React.ReactNode;
  className?: string;
}

export const EvidencePopover = ({
  citations,
  trigger,
  className = ''
}: EvidencePopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleClose = () => setIsOpen(false);

  // Custom trigger with citation count
  const triggerContent = trigger || (
    <Button
      variant="secondary"
      size="sm"
      aria-label={`View ${citations.length} underwriting sources`}
    >
      View Sources ({citations.length})
    </Button>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <div onClick={handleToggle}>
        {triggerContent}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Popover */}
          <div
            id="evidence-popover"
            role="dialog"
            aria-modal="true"
            aria-label="Evidence sources"
            className="absolute z-50 w-96 mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Evidence Sources</h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {citations.length > 0 ? (
                  citations.map((citation, index) => (
                    <div key={citation.chunkId || index} className="border-l-4 border-blue-400 pl-4 pb-3">
                      <div className="text-sm">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-medium text-gray-900 flex-1">
                            {citation.documentTitle || 'Carrier Underwriting Guide'}
                          </div>
                          {citation.score && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                              {Math.round(citation.score * 100)}% match
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-600 mb-2 flex flex-wrap gap-2">
                          {citation.effectiveDate && (
                            <span>
                              📅 Effective: {new Date(citation.effectiveDate).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                          {citation.page && <span>📄 Page {citation.page}</span>}
                          {citation.section && <span>📑 {citation.section}</span>}
                        </div>

                        <blockquote className="text-gray-700 bg-blue-50 p-3 rounded-md border-l-3 border-blue-300">
                          <p className="text-sm leading-relaxed">
                            {citation.snippet ? (
                              <>
                                <span className="font-serif text-gray-900">"</span>
                                {citation.snippet}
                                <span className="font-serif text-gray-900">"</span>
                              </>
                            ) : (
                              <span className="italic text-gray-500">
                                Underwriting evidence for this carrier recommendation
                              </span>
                            )}
                          </p>
                        </blockquote>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No citations available</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Underwriting sources will appear here once processed
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Important:</span> These citations are extracted from carrier underwriting guides.
                    Always verify current requirements and pricing with carrier representatives before submitting applications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
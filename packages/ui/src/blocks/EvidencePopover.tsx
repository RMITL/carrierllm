import { useState } from 'react';

export interface CarrierCitation {
  chunkId: string;
  snippet: string;
  documentTitle: string;
  effectiveDate: string;
  page?: number;
  section?: string;
}

export interface EvidencePopoverProps {
  citations: CarrierCitation[];
  trigger?: React.ReactNode;
  className?: string;
}

export const EvidencePopover = ({
  citations,
  trigger = 'View sources',
  className = ''
}: EvidencePopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleClose = () => setIsOpen(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={handleToggle}
        className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-describedby={isOpen ? 'evidence-popover' : undefined}
      >
        {trigger}
      </button>

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
                {citations.map((citation, index) => (
                  <div key={citation.chunkId || index} className="border-l-4 border-blue-200 pl-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 mb-1">
                        {citation.documentTitle}
                      </div>

                      <div className="text-gray-600 mb-2">
                        <span>Effective: {new Date(citation.effectiveDate).toLocaleDateString()}</span>
                        {citation.page && <span className="ml-2">• Page {citation.page}</span>}
                        {citation.section && <span className="ml-2">• {citation.section}</span>}
                      </div>

                      <blockquote className="text-gray-700 bg-gray-50 p-3 rounded border-l-2 border-gray-200 italic">
                        "{citation.snippet}"
                      </blockquote>
                    </div>
                  </div>
                ))}

                {citations.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No sources available
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Citations are extracted from carrier underwriting guides and documentation.
                  Verify current requirements with carrier representatives.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
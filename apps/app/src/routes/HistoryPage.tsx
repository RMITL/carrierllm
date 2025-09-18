import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from '@carrierllm/ui';
import { getUserHistory } from '../lib/api';

interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'intake' | 'recommendation';
  title: string;
  score?: number;
  intakeData?: any;
}

export const HistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'intake' | 'recommendation'>('all');

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['user-history', user?.id],
    queryFn: getUserHistory,
    enabled: !!user?.id,
    staleTime: 30000
  });

  const sortedAndFilteredHistory = (history || [])
    .filter(item => filterType === 'all' || item.type === filterType)
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.type === 'recommendation' ? 'completed' : 'completed';
          bValue = b.type === 'recommendation' ? 'completed' : 'completed';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusClass = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusClass[status as keyof typeof statusClass] || statusClass.unknown
      }`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    if (type === 'intake') {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const handleSort = (field: 'date' | 'type' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (item: HistoryItem) => {
    if (item.type === 'recommendation') {
      // For recommendations, the id is the recommendation_id
      navigate(`/results/${item.id}`);
    }
  };

  const handleExportItem = (item: HistoryItem) => {
    const exportData = {
      id: item.id,
      type: item.type,
      timestamp: item.timestamp,
      title: item.title,
      score: item.score,
      intakeData: item.intakeData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.type}-${item.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintHistory = () => {
    window.print();
  };

  const handleShareHistory = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('History link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--color-primary)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load history</h3>
            <p className="text-gray-600 mb-4">There was an error loading your intake and recommendation history.</p>
            <Button onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">History</h1>
        <p className="text-gray-600">
          View and manage your previous intakes and recommendations
        </p>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="intake">Intakes</option>
                  <option value="recommendation">Recommendations</option>
                </select>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort:</label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSort('date')}
                  className={sortBy === 'date' ? 'bg-[color:var(--color-primary)] text-white' : ''}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSort('type')}
                  className={sortBy === 'type' ? 'bg-[color:var(--color-primary)] text-white' : ''}
                >
                  Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className={sortBy === 'status' ? 'bg-[color:var(--color-primary)] text-white' : ''}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </div>
            </div>

            {/* Export Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrintHistory}
              >
                Print
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShareHistory}
              >
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {sortedAndFilteredHistory.length} of {history.length} items
          </p>
        </div>
      </Card>

      {/* History Table */}
      {sortedAndFilteredHistory.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No history found</h3>
            <p className="text-gray-600 mb-4">
              {filterType === 'all'
                ? "You haven't created any intakes or recommendations yet."
                : `No ${filterType}s found.`}
            </p>
            <Button onClick={() => navigate('/intake')}>
              Create Your First Intake
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(item.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge('completed')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="text-sm font-medium">
                        {item.title}
                      </div>
                      {item.type === 'recommendation' && item.score && (
                        <div className="text-xs text-gray-500">
                          Fit Score: {item.score}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.type === 'recommendation' && (
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                          className="mr-2"
                        >
                          View Results
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExportItem(item)}
                      >
                        Export
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
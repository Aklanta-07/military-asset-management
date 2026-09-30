import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { auditLogApi } from '../services/api';

const ACTION_OPTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'RECEIVE',
  'CANCEL',
  'ASSIGN',
  'RETURN',
  'EXPEND',
  'LOGIN',
  'LOGOUT',
  'FAILED_LOGIN',
];

const DEFAULT_PAGE_SIZE = 20;

const formatAction = (action) => {
  if (!action) return '-';

  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getActionBadgeClass = (action) => {
  const classes = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    APPROVE: 'bg-purple-100 text-purple-700',
    RECEIVE: 'bg-teal-100 text-teal-700',
    CANCEL: 'bg-orange-100 text-orange-700',
    ASSIGN: 'bg-indigo-100 text-indigo-700',
    RETURN: 'bg-cyan-100 text-cyan-700',
    EXPEND: 'bg-yellow-100 text-yellow-700',
    LOGIN: 'bg-green-100 text-green-700',
    LOGOUT: 'bg-gray-100 text-gray-700',
    FAILED_LOGIN: 'bg-red-100 text-red-700',
  };

  return classes[action] || 'bg-gray-100 text-gray-700';
};

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatJsonValue = (value) => {
  if (!value) return null;

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(true);

  // Expanded row
  const [expandedId, setExpandedId] = useState(null);

  const hasFilters =
    entityType ||
    entityId ||
    performedBy ||
    action ||
    startDate ||
    endDate;

  const buildParams = useCallback(
    (requestedPage) => {
      const params = {
        page: requestedPage,
        size: pageSize,
      };

      if (entityType.trim()) {
        params.entityType = entityType.trim();
      }

      if (entityId.trim()) {
        params.entityId = entityId.trim();
      }

      if (performedBy.trim()) {
        params.performedBy = performedBy.trim();
      }

      if (action) {
        params.action = action;
      }

      if (startDate) {
        params.startDate = new Date(startDate).toISOString();
      }

      if (endDate) {
        params.endDate = new Date(endDate).toISOString();
      }

      return params;
    },
    [
      pageSize,
      entityType,
      entityId,
      performedBy,
      action,
      startDate,
      endDate,
    ]
  );

  const loadAuditLogs = useCallback(
    async (requestedPage, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const params = buildParams(requestedPage);

        const response = await auditLogApi.getAll(params);

        /*
         * Backend PageResponse:
         *
         * {
         *   content: [],
         *   pageNumber: 0,
         *   pageSize: 20,
         *   totalElements: 100,
         *   totalPages: 5,
         *   first: true,
         *   last: false,
         *   empty: false
         * }
         */

        setAuditLogs(response?.content || []);

        setPage(response?.pageNumber ?? requestedPage);
        setPageSize(response?.pageSize ?? DEFAULT_PAGE_SIZE);
        setTotalElements(response?.totalElements ?? 0);
        setTotalPages(response?.totalPages ?? 0);

        setIsFirstPage(response?.first ?? true);
        setIsLastPage(response?.last ?? true);

        setExpandedId(null);
      } catch (err) {
        console.error('Failed to load audit logs:', err);

        setError(
          err?.response?.data?.message ||
            'Failed to load audit logs. Please try again.'
        );

        setAuditLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    loadAuditLogs(page);
  }, [page, loadAuditLogs]);

  const applyFilters = () => {
    setPage(0);
  };

  const clearFilters = () => {
    setEntityType('');
    setEntityId('');
    setPerformedBy('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handlePrevious = () => {
    if (!isFirstPage) {
      setPage((current) => current - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      setPage((current) => current + 1);
    }
  };

  const pageRange = useMemo(() => {
    if (totalElements === 0) {
      return {
        start: 0,
        end: 0,
      };
    }

    return {
      start: page * pageSize + 1,
      end: Math.min(
        (page + 1) * pageSize,
        totalElements
      ),
    };
  }, [page, pageSize, totalElements]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-3">
            <Activity className="h-6 w-6 text-indigo-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Audit Logs
            </h1>

            <p className="text-sm text-gray-500">
              Monitor system activities and administrative actions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadAuditLogs(page, true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? 'animate-spin' : ''
            }`}
          />

          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-500" />

          <h2 className="text-sm font-semibold text-gray-900">
            Filter Audit Logs
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Entity Type */}
          <div>
            <label
              htmlFor="entity-type"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Entity Type
            </label>

            <input
              id="entity-type"
              type="text"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="e.g. Asset, Purchase"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Entity ID */}
          <div>
            <label
              htmlFor="entity-id"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Entity ID
            </label>

            <input
              id="entity-id"
              type="number"
              min="1"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="e.g. 25"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Performed By */}
          <div>
            <label
              htmlFor="performed-by"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Performed By User ID
            </label>

            <input
              id="performed-by"
              type="number"
              min="1"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              placeholder="User ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Action */}
          <div>
            <label
              htmlFor="action"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Action
            </label>

            <select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Actions</option>

              {ACTION_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatAction(item)}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label
              htmlFor="start-date"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Start Date & Time
            </label>

            <input
              id="start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="end-date"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              End Date & Time
            </label>

            <input
              id="end-date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" />
            Apply Filters
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadAuditLogs(page)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading audit logs...
          </p>
        </div>
      )}

      {/* Audit Logs */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Result Header */}
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Audit Activity
              </p>

              <p className="text-xs text-gray-500">
                Showing {pageRange.start}–{pageRange.end} of{' '}
                {totalElements} logs
              </p>
            </div>

            <span className="text-xs text-gray-500">
              Page {totalPages === 0 ? 0 : page + 1} of{' '}
              {totalPages}
            </span>
          </div>

          {/* Empty */}
          {auditLogs.length === 0 ? (
            <div className="p-10 text-center">
              <Activity className="mx-auto h-10 w-10 text-gray-400" />

              <h3 className="mt-3 text-sm font-semibold text-gray-900">
                No audit logs found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your filters or date range.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-10 px-4 py-3" />

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Time
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Entity
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Action
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Performed By
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        IP Address
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {auditLogs.map((log) => {
                      const isExpanded =
                        expandedId === log.id;

                      return (
                        <AuditLogRow
                          key={log.id}
                          log={log}
                          isExpanded={isExpanded}
                          onToggle={() =>
                            setExpandedId(
                              isExpanded ? null : log.id
                            )
                          }
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  {totalElements} total log
                  {totalElements === 1 ? '' : 's'}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={isFirstPage || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <span className="px-2 text-sm text-gray-600">
                    {page + 1} / {totalPages || 1}
                  </span>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLastPage || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AuditLogRow({
  log,
  isExpanded,
  onToggle,
}) {
  return (
    <>
      <tr className="transition hover:bg-gray-50">
        {/* Expand */}
        <td className="px-4 py-4">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label={
              isExpanded
                ? 'Collapse audit log'
                : 'Expand audit log'
            }
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </td>

        {/* Time */}
        <td className="whitespace-nowrap px-6 py-4">
          <div className="text-sm font-medium text-gray-900">
            {formatDateTime(log.performedAt)}
          </div>

          <div className="mt-1 text-xs text-gray-500">
            Log #{log.id}
          </div>
        </td>

        {/* Entity */}
        <td className="px-6 py-4">
          <div className="text-sm font-semibold text-gray-900">
            {log.entityType || '-'}
          </div>

          {log.entityId != null && (
            <div className="mt-1 text-xs text-gray-500">
              ID: {log.entityId}
            </div>
          )}
        </td>

        {/* Action */}
        <td className="whitespace-nowrap px-6 py-4">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActionBadgeClass(
              log.action
            )}`}
          >
            {formatAction(log.action)}
          </span>
        </td>

        {/* Performed By */}
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">
            {log.performedByName || 'System'}
          </div>

          {log.performedById != null && (
            <div className="mt-1 text-xs text-gray-500">
              User ID: {log.performedById}
            </div>
          )}
        </td>

        {/* IP */}
        <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-600">
          {log.ipAddress || '-'}
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan="6" className="px-6 py-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Changed Fields */}
              <DetailSection
                title="Changed Fields"
                value={log.changedFields}
              />

              {/* Old Values */}
              <DetailSection
                title="Old Values"
                value={formatJsonValue(log.oldValues)}
                code
              />

              {/* New Values */}
              <DetailSection
                title="New Values"
                value={formatJsonValue(log.newValues)}
                code
              />

              {/* Technical Details */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Technical Details
                </h3>

                <dl className="space-y-2 text-sm">
                  <DetailItem
                    label="IP Address"
                    value={log.ipAddress}
                  />

                  <DetailItem
                    label="User Agent"
                    value={log.userAgent}
                  />

                  <DetailItem
                    label="Correlation ID"
                    value={log.correlationId}
                  />

                  <DetailItem
                    label="Session ID"
                    value={log.sessionId}
                  />
                </dl>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailSection({
  title,
  value,
  code = false,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        {title}
      </h3>

      {!value ? (
        <p className="text-sm text-gray-400">
          No data
        </p>
      ) : code ? (
        <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
          {value}
        </pre>
      ) : (
        <p className="break-words text-sm text-gray-600">
          {value}
        </p>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[130px_1fr]">
      <dt className="font-medium text-gray-500">
        {label}
      </dt>

      <dd className="break-all text-gray-700">
        {value || '-'}
      </dd>
    </div>
  );
}
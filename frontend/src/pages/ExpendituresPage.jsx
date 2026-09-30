import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  expendituresApi,
  getApiErrorMessage,
  referenceApi,
} from '../services/api';

import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

const REASONS = [
  'TRAINING',
  'OPERATIONS',
  'TESTING',
  'DISPOSAL',
  'DAMAGED',
  'EXPIRED',
  'OTHER',
];

const PAGE_SIZE = 20;

const initialForm = {
  equipmentTypeId: '',
  baseId: '',
  quantity: '',
  expenditureDate: new Date().toISOString().split('T')[0],
  reason: '',
  description: '',
};

const getPageContent = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  return (
    response?.content ||
    response?.items ||
    response?.data ||
    []
  );
};

const getPageNumber = (response, fallback = 0) => {
  if (typeof response?.page === 'number') return response.page;
  if (typeof response?.pageNumber === 'number') return response.pageNumber;
  if (typeof response?.number === 'number') return response.number;

  return fallback;
};

const getTotalPages = (response, contentLength) => {
  if (typeof response?.totalPages === 'number') {
    return response.totalPages;
  }

  if (typeof response?.pages === 'number') {
    return response.pages;
  }

  if (typeof response?.totalElements === 'number') {
    return Math.max(
      1,
      Math.ceil(response.totalElements / PAGE_SIZE)
    );
  }

  return contentLength < PAGE_SIZE
    ? Math.max(1, Math.ceil(contentLength / PAGE_SIZE))
    : 1;
};

const formatDate = (date) => {
  if (!date) return '—';

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getReasonClass = (reason) => {
  switch (reason) {
    case 'TRAINING':
      return 'bg-blue-100 text-blue-700';

    case 'OPERATIONS':
      return 'bg-purple-100 text-purple-700';

    case 'TESTING':
      return 'bg-amber-100 text-amber-700';

    case 'DISPOSAL':
      return 'bg-red-100 text-red-700';

    case 'DAMAGED':
      return 'bg-orange-100 text-orange-700';

    case 'EXPIRED':
      return 'bg-gray-100 text-gray-700';

    case 'OTHER':
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const formatReason = (reason) => {
  if (!reason) return '—';

  return reason
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getUserIsAdmin = (user) => {
  if (!user) return false;

  if (user.isAdmin === true) return true;

  if (user.role === 'ADMIN') return true;

  if (Array.isArray(user.roles)) {
    return user.roles.some(
      (role) =>
        role === 'ADMIN' ||
        role?.name === 'ADMIN' ||
        role?.authority === 'ROLE_ADMIN'
    );
  }

  return false;
};

export default function ExpenditurePage() {
  const { user } = useAuth();

  const isAdmin = getUserIsAdmin(user);

  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingReferences, setLoadingReferences] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState({
    baseId: '',
    equipmentTypeId: '',
    reason: '',
    startDate: '',
    endDate: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedExpenditure, setSelectedExpenditure] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  /*
   * Load bases and equipment types.
   */
  const loadReferenceData = useCallback(async () => {
    try {
      setLoadingReferences(true);

      const [basesResponse, equipmentResponse] = await Promise.all([
        referenceApi.getBases(),
        referenceApi.getEquipmentTypes(),
      ]);

      setBases(Array.isArray(basesResponse) ? basesResponse : []);
      setEquipmentTypes(
        Array.isArray(equipmentResponse)
          ? equipmentResponse
          : []
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Unable to load reference data.'
        )
      );
    } finally {
      setLoadingReferences(false);
    }
  }, []);

  /*
   * Load expenditures using backend-side filtering and pagination.
   */
  const loadExpenditures = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'expenditureDate',
        sortDir: 'DESC',
      };

      if (filters.baseId) {
        params.baseId = filters.baseId;
      }

      if (filters.equipmentTypeId) {
        params.equipmentTypeId = filters.equipmentTypeId;
      }

      if (filters.reason) {
        params.reason = filters.reason;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response = await expendituresApi.getAll(params);

      const content = getPageContent(response);

      setExpenditures(content);
      setTotalPages(
        getTotalPages(response, content.length)
      );

      setTotalElements(
        typeof response?.totalElements === 'number'
          ? response.totalElements
          : content.length
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Unable to load expenditures.'
        )
      );

      setExpenditures([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadExpenditures();
  }, [loadExpenditures]);

  /*
   * Base ID is automatically populated for non-admin users
   * when their authenticated user object contains baseId.
   */
  useEffect(() => {
    if (!isAdmin && user?.baseId) {
      setForm((current) => ({
        ...current,
        baseId: String(user.baseId),
      }));
    }
  }, [isAdmin, user]);

  const selectedBase = useMemo(() => {
    if (!form.baseId) return null;

    return bases.find(
      (base) => String(base.id) === String(form.baseId)
    );
  }, [bases, form.baseId]);

  const selectedEquipment = useMemo(() => {
    if (!form.equipmentTypeId) return null;

    return equipmentTypes.find(
      (equipment) =>
        String(equipment.id) ===
        String(form.equipmentTypeId)
    );
  }, [equipmentTypes, form.equipmentTypeId]);

  const totalQuantityOnPage = useMemo(() => {
    return expenditures.reduce(
      (total, expenditure) =>
        total + Number(expenditure.quantity || 0),
      0
    );
  }, [expenditures]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));

    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      baseId: '',
      equipmentTypeId: '',
      reason: '',
      startDate: '',
      endDate: '',
    });

    setPage(0);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setError('');
    setSuccess('');

    setForm({
      ...initialForm,
      baseId: !isAdmin && user?.baseId
        ? String(user.baseId)
        : '',
    });

    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;

    setShowCreateModal(false);
    setForm(initialForm);
  };

  const handleCreateExpenditure = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.equipmentTypeId) {
      setError('Please select an equipment type.');
      return;
    }

    if (!form.baseId) {
      setError('Please select a base.');
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Quantity must be a positive whole number.');
      return;
    }

    if (!form.expenditureDate) {
      setError('Please select an expenditure date.');
      return;
    }

    if (!form.reason) {
      setError('Please select a reason.');
      return;
    }

    if (form.description.length > 500) {
      setError('Description must not exceed 500 characters.');
      return;
    }

    const payload = {
      equipmentTypeId: Number(form.equipmentTypeId),
      baseId: Number(form.baseId),
      quantity,
      expenditureDate: form.expenditureDate,
      reason: form.reason,
      description: form.description.trim() || null,
    };

    try {
      setSubmitting(true);

      await expendituresApi.create(payload);

      setSuccess('Expenditure recorded successfully.');

      setShowCreateModal(false);
      setForm(initialForm);

      if (!isAdmin && user?.baseId) {
        setForm((current) => ({
          ...current,
          baseId: String(user.baseId),
        }));
      }

      setPage(0);

      await loadExpenditures();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Unable to record expenditure.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (expenditure) => {
    try {
      setError('');

      const response = await expendituresApi.getById(
        expenditure.id
      );

      setSelectedExpenditure(response);
      setShowDetailsModal(true);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Unable to load expenditure details.'
        )
      );
    }
  };

  const handleRefresh = async () => {
    setSuccess('');
    await Promise.all([
      loadReferenceData(),
      loadExpenditures(),
    ]);
  };

  const canGoPrevious = page > 0;
  const canGoNext = page < totalPages - 1;

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <ClipboardList className="h-6 w-6 text-red-700" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Expenditures
              </h1>

              <p className="text-sm text-gray-500">
                Track and manage military asset consumption.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Record Expenditure
        </button>
      </div>

      {/* =====================================================
          ALERTS
      ====================================================== */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">Unable to complete request</p>
            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess('')}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Expenditure Records
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalElements}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <ClipboardList className="h-5 w-5 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Quantity on Current Page
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalQuantityOnPage}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <ClipboardList className="h-5 w-5 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER BAR
      ====================================================== */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Search className="h-4 w-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="border-t border-gray-200 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Base */}
              <div>
                <label
                  htmlFor="filter-base"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Base
                </label>

                <select
                  id="filter-base"
                  name="baseId"
                  value={filters.baseId}
                  onChange={handleFilterChange}
                  disabled={!isAdmin}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
                >
                  <option value="">
                    {isAdmin ? 'All Bases' : 'My Base'}
                  </option>

                  {bases.map((base) => (
                    <option key={base.id} value={base.id}>
                      {base.code} - {base.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment */}
              <div>
                <label
                  htmlFor="filter-equipment"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Equipment
                </label>

                <select
                  id="filter-equipment"
                  name="equipmentTypeId"
                  value={filters.equipmentTypeId}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">All Equipment</option>

                  {equipmentTypes.map((equipment) => (
                    <option
                      key={equipment.id}
                      value={equipment.id}
                    >
                      {equipment.code} - {equipment.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor="filter-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Reason
                </label>

                <select
                  id="filter-reason"
                  name="reason"
                  value={filters.reason}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">All Reasons</option>

                  {REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {formatReason(reason)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start date */}
              <div>
                <label
                  htmlFor="filter-start-date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  From
                </label>

                <input
                  id="filter-start-date"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* End date */}
              <div>
                <label
                  htmlFor="filter-end-date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  To
                </label>

                <input
                  id="filter-end-date"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-[1250px] min-w-[1250px] table-fixed">
            <colgroup>
              <col className="w-[130px]" />
              <col className="w-[210px]" />
              <col className="w-[190px]" />
              <col className="w-[90px]" />
              <col className="w-[145px]" />
              <col className="w-[280px]" />
              <col className="w-[150px]" />
              <col className="w-[55px]" />
            </colgroup>

            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Equipment
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Base
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Qty
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reason
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Authorized By
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center"
                  >
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary-600" />

                    <p className="mt-3 text-sm text-gray-500">
                      Loading expenditures...
                    </p>
                  </td>
                </tr>
              ) : expenditures.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center"
                  >
                    <ClipboardList className="mx-auto h-9 w-9 text-gray-300" />

                    <p className="mt-3 font-medium text-gray-600">
                      No expenditures found
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Try changing your filters or record a
                      new expenditure.
                    </p>
                  </td>
                </tr>
              ) : (
                expenditures.map((expenditure) => (
                  <tr
                    key={expenditure.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* Date */}
                    <td className="align-top px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(
                        expenditure.expenditureDate
                      )}
                    </td>

                    {/* Equipment */}
                    <td className="align-top px-4 py-4">
                      <div className="font-medium text-gray-900 break-words">
                        {expenditure.equipmentTypeCode || '—'}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500 break-words">
                        {expenditure.equipmentTypeName || '—'}
                      </div>

                      {expenditure.equipmentCategory && (
                        <div className="mt-1 text-xs text-gray-400">
                          {expenditure.equipmentCategory}
                        </div>
                      )}
                    </td>

                    {/* Base */}
                    <td className="align-top px-4 py-4">
                      <div className="font-medium text-gray-900 break-words">
                        {expenditure.baseCode || '—'}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500 break-words">
                        {expenditure.baseName || '—'}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="align-top px-4 py-4">
                      <span className="font-semibold text-gray-900">
                        {expenditure.quantity}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="align-top px-4 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getReasonClass(
                          expenditure.reason
                        )}`}
                      >
                        {formatReason(expenditure.reason)}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="align-top px-4 py-4">
                      <p className="break-words text-sm text-gray-600">
                        {expenditure.description || '—'}
                      </p>
                    </td>

                    {/* Authorized By */}
                    <td className="align-top px-4 py-4">
                      <div className="break-words text-sm font-medium text-gray-900">
                        {expenditure.authorizedByName ||
                          expenditure.authorizedBy ||
                          '—'}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleViewDetails(expenditure)
                        }
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        title="View expenditure details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        ==================================================== */}
        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Page{' '}
            <span className="font-medium text-gray-700">
              {page + 1}
            </span>{' '}
            of{' '}
            <span className="font-medium text-gray-700">
              {totalPages}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrevious || loading}
              onClick={() =>
                setPage((current) => current - 1)
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              disabled={!canGoNext || loading}
              onClick={() =>
                setPage((current) => current + 1)
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          CREATE EXPENDITURE MODAL
      ====================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Record Expenditure
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Record assets consumed from a base.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={submitting}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateExpenditure}
              className="space-y-5 p-6"
            >
              {/* Base */}
              <div>
                <label
                  htmlFor="expenditure-base"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Base <span className="text-red-500">*</span>
                </label>

                <select
                  id="expenditure-base"
                  name="baseId"
                  value={form.baseId}
                  onChange={handleFormChange}
                  disabled={!isAdmin || loadingReferences}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
                >
                  <option value="">Select base</option>

                  {bases.map((base) => (
                    <option key={base.id} value={base.id}>
                      {base.code} - {base.name}
                    </option>
                  ))}
                </select>

                {!isAdmin && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    You can only record expenditures for your
                    assigned base.
                  </p>
                )}
              </div>

              {/* Equipment Type */}
              <div>
                <label
                  htmlFor="expenditure-equipment"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Equipment Type{' '}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  id="expenditure-equipment"
                  name="equipmentTypeId"
                  value={form.equipmentTypeId}
                  onChange={handleFormChange}
                  disabled={loadingReferences}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
                >
                  <option value="">
                    Select equipment type
                  </option>

                  {equipmentTypes.map((equipment) => (
                    <option
                      key={equipment.id}
                      value={equipment.id}
                    >
                      {equipment.code} - {equipment.name}
                    </option>
                  ))}
                </select>

                {selectedEquipment && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {selectedEquipment.category || 'Equipment'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Quantity */}
                <div>
                  <label
                    htmlFor="expenditure-quantity"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Quantity{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="expenditure-quantity"
                    type="number"
                    name="quantity"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="expenditure-date"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Expenditure Date{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      id="expenditure-date"
                      type="date"
                      name="expenditureDate"
                      value={form.expenditureDate}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor="expenditure-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Reason <span className="text-red-500">*</span>
                </label>

                <select
                  id="expenditure-reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Select reason</option>

                  {REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {formatReason(reason)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="expenditure-description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <span className="text-xs text-gray-400">
                    {form.description.length}/500
                  </span>
                </div>

                <textarea
                  id="expenditure-description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  maxLength={500}
                  rows={4}
                  placeholder="Enter additional details about this expenditure..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* Warning */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                  <p className="text-xs leading-5 text-amber-700">
                    Recording an expenditure will mark the
                    corresponding available assets as{' '}
                    <strong>EXPENDED</strong>. The requested
                    quantity must be available at the selected
                    base.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || loadingReferences}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {submitting
                    ? 'Recording...'
                    : 'Record Expenditure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DETAILS MODAL
      ====================================================== */}
      {showDetailsModal && selectedExpenditure && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Expenditure Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Expenditure #{selectedExpenditure.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedExpenditure(null);
                }}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Basic information */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Expenditure Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      Equipment
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {selectedExpenditure.equipmentTypeCode ||
                        '—'}
                    </p>

                    <p className="text-sm text-gray-500">
                      {selectedExpenditure.equipmentTypeName ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Category
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {selectedExpenditure.equipmentCategory ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Base
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {selectedExpenditure.baseCode || '—'}
                    </p>

                    <p className="text-sm text-gray-500">
                      {selectedExpenditure.baseName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Quantity
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {selectedExpenditure.quantity}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Expenditure Date
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(
                        selectedExpenditure.expenditureDate
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Reason
                    </p>

                    <div className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getReasonClass(
                          selectedExpenditure.reason
                        )}`}
                      >
                        {formatReason(
                          selectedExpenditure.reason
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </h3>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                    {selectedExpenditure.description ||
                      'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Authorization */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Authorization
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      Authorized By
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {selectedExpenditure.authorizedByName ||
                        selectedExpenditure.authorizedBy ||
                        '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Created At
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {formatDateTime(
                        selectedExpenditure.createdAt
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedExpenditure(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

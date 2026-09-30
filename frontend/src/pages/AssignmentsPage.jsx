import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import {
  assignmentsApi,
  assetsApi,
  referenceApi,
  getApiErrorMessage,
} from '../services/api';

export function AssignmentsPage() {
  const { isAdmin, isBaseCommander } = useAuth();

  const canManage = isAdmin || isBaseCommander;

  // =========================================================
  // DATA
  // =========================================================

  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [personnel, setPersonnel] = useState([]);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // =========================================================
  // FILTERS
  // =========================================================

  const [filters, setFilters] = useState({
    assetId: '',
    personnelId: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const [search, setSearch] = useState('');

  // =========================================================
  // PAGINATION
  // =========================================================

  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
  });

  // =========================================================
  // MODALS
  // =========================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // =========================================================
  // CREATE FORM
  // =========================================================

  const [form, setForm] = useState({
    assetId: '',
    personnelId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
  });

  // =========================================================
  // RETURN FORM
  // =========================================================

  const [returnedDate, setReturnedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // =========================================================
  // LOAD REFERENCE DATA
  // =========================================================

  const loadReferenceData = useCallback(async () => {
    try {
      const [assetResponse, personnelResponse] = await Promise.all([
        assetsApi.getAll({
          status: 'AVAILABLE',
          page: 0,
          size: 1000,
        }),
        referenceApi.getPersonnel(),
      ]);

      setAssets(assetResponse?.content || []);
      setPersonnel(
        Array.isArray(personnelResponse)
          ? personnelResponse.filter((person) => person.active)
          : []
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Failed to load assets and personnel.'
        )
      );
    }
  }, []);

  // =========================================================
  // LOAD ASSIGNMENTS
  // =========================================================

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        size: pageSize,
        sortBy: 'assignedDate',
        sortDir: 'DESC',
      };

      if (filters.assetId) {
        params.assetId = filters.assetId;
      }

      if (filters.personnelId) {
        params.personnelId = filters.personnelId;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response = await assignmentsApi.getAll(params);

      setAssignments(response?.content || []);

      setPagination({
        totalElements: response?.totalElements || 0,
        totalPages: response?.totalPages || 0,
        number: response?.number || 0,
        size: response?.size || pageSize,
      });
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Failed to load assignments.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) {
      return assignments;
    }

    const value = search.toLowerCase();

    return assignments.filter((assignment) =>
      [
        assignment.assetSerialNumber,
        assignment.equipmentTypeCode,
        assignment.equipmentTypeName,
        assignment.personnelServiceNumber,
        assignment.personnelFullName,
        assignment.personnelRank,
        assignment.personnelUnit,
        assignment.baseCode,
        assignment.baseName,
        assignment.status,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value)
        )
    );
  }, [assignments, search]);

  // =========================================================
  // FORM HANDLERS
  // =========================================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPage(0);

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE ASSIGNMENT
  // =========================================================

  const handleCreateAssignment = async (event) => {
    event.preventDefault();

    if (!form.assetId || !form.personnelId || !form.assignedDate) {
      setError(
        'Asset, personnel, and assigned date are required.'
      );
      return;
    }

    if (
      form.expectedReturnDate &&
      form.expectedReturnDate < form.assignedDate
    ) {
      setError(
        'Expected return date cannot be before assigned date.'
      );
      return;
    }

    try {
      setFormLoading(true);
      setError('');
      setSuccess('');

      await assignmentsApi.create({
        assetId: Number(form.assetId),
        personnelId: Number(form.personnelId),
        assignedDate: form.assignedDate,
        expectedReturnDate:
          form.expectedReturnDate || null,
        notes: form.notes.trim() || null,
      });

      setSuccess('Asset assigned successfully.');

      setShowCreateModal(false);

      setForm({
        assetId: '',
        personnelId: '',
        assignedDate: new Date()
          .toISOString()
          .split('T')[0],
        expectedReturnDate: '',
        notes: '',
      });

      await Promise.all([
        loadAssignments(),
        loadReferenceData(),
      ]);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Failed to create assignment.'
        )
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // RETURN ASSET
  // =========================================================

  const handleReturnAsset = async (event) => {
    event.preventDefault();

    if (!selectedAssignment) {
      return;
    }

    if (
      returnedDate < selectedAssignment.assignedDate
    ) {
      setError(
        'Returned date cannot be before assigned date.'
      );
      return;
    }

    try {
      setFormLoading(true);
      setError('');
      setSuccess('');

      await assignmentsApi.returnAsset(
        selectedAssignment.id,
        returnedDate
      );

      setSuccess('Asset returned successfully.');

      setShowReturnModal(false);
      setSelectedAssignment(null);

      await Promise.all([
        loadAssignments(),
        loadReferenceData(),
      ]);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Failed to return asset.'
        )
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // DETAILS
  // =========================================================

  const handleViewDetails = async (assignment) => {
    try {
      setError('');

      const response = await assignmentsApi.getById(
        assignment.id
      );

      setSelectedAssignment(response);
      setShowDetailsModal(true);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Failed to load assignment details.'
        )
      );
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setSearch('');
    setPage(0);

    setFilters({
      assetId: '',
      personnelId: '',
      status: '',
      startDate: '',
      endDate: '',
    });

    await loadReferenceData();
  };

  // =========================================================
  // FILTER CLEAR
  // =========================================================

  const clearFilters = () => {
    setFilters({
      assetId: '',
      personnelId: '',
      status: '',
      startDate: '',
      endDate: '',
    });

    setSearch('');
    setPage(0);
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return '—';
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';

      case 'RETURNED':
        return 'badge-secondary';

      case 'OVERDUE':
        return 'badge-warning';

      case 'LOST':
        return 'badge-danger';

      default:
        return 'badge-secondary';
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-primary-600" />

            <h1 className="text-2xl font-bold text-gray-900">
              Assignments
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Manage asset assignments to personnel.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowCreateModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        )}
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Filters
            </h2>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">


            {/* ASSET */}
            <div>
              <label className="label">
                Asset
              </label>

              <select
                name="assetId"
                value={filters.assetId}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Assets</option>

                {assets.map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                  >
                    {asset.serialNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* PERSONNEL */}
            <div>
              <label className="label">
                Personnel
              </label>

              <select
                name="personnelId"
                value={filters.personnelId}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Personnel</option>

                {personnel.map((person) => (
                  <option
                    key={person.id}
                    value={person.id}
                  >
                    {person.serviceNumber} - {person.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}
            <div>
              <label className="label">
                Status
              </label>

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="RETURNED">Returned</option>
                <option value="OVERDUE">Overdue</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            {/* START DATE */}
            <div>
              <label className="label">
                From
              </label>

              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="input"
              />
            </div>

            {/* END DATE */}
            <div>
              <label className="label">
                To
              </label>

              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="input"
              />
            </div>

            {/* SEARCH */}
            <div className="lg:col-span-2">
              <label className="label">
                Search
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Serial no, personnel..."
                  className="input pl-9"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="card-header">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Assignment Records
              </h2>

              <p className="text-sm text-gray-500">
                {pagination.totalElements} total records
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="btn-secondary"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Personnel</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Expected Return</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="py-12 text-center"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-600" />

                    <p className="mt-2 text-sm text-gray-500">
                      Loading assignments...
                    </p>
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="py-12 text-center"
                  >
                    <ClipboardCheck className="mx-auto h-8 w-8 text-gray-300" />

                    <p className="mt-2 font-medium text-gray-600">
                      No assignments found
                    </p>

                    <p className="text-sm text-gray-400">
                      Try changing your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id}>

                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {assignment.assetSerialNumber || '—'}
                      </div>

                      <div className="text-xs text-gray-500">
                        ID: {assignment.assetId}
                      </div>
                    </td>

                    <td className="whitespace-normal">
                      <div className="font-medium break-words">
                        {assignment.equipmentTypeCode || '—'}
                      </div>

                      <div className="text-xs text-gray-500 break-words">
                        {assignment.equipmentTypeName || '—'}
                      </div>
                    </td>

                    <td className="whitespace-normal">
                      <div className="font-medium break-words">
                        {assignment.personnelFullName || '—'}
                      </div>

                      <div className="text-xs text-gray-500 break-words">
                        {assignment.personnelServiceNumber || '—'}
                      </div>
                    </td>

                    <td className="whitespace-normal">
                    <div className="font-medium break-words">
                       {assignment.baseCode || '—'}
                    </div>

                    <div className="text-xs text-gray-500 break-words">
                       {assignment.baseName || '—'}
                    </div>
                  </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(assignment.assignedDate)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(
                        assignment.expectedReturnDate
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          assignment.status
                        )}`}
                      >
                        {assignment.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleViewDetails(assignment)
                          }
                          className="btn-icon"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canManage &&
                          assignment.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => {
                                setError('');
                                setSuccess('');
                                setSelectedAssignment(
                                  assignment
                                );
                                setReturnedDate(
                                  new Date()
                                    .toISOString()
                                    .split('T')[0]
                                );
                                setShowReturnModal(true);
                              }}
                              className="btn-icon text-green-600 hover:bg-green-50"
                              title="Return asset"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 0 && (
          <div className="card-footer">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-gray-500">
                Page {pagination.number + 1} of{' '}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={page === 0 || loading}
                  onClick={() =>
                    setPage((prev) => prev - 1)
                  }
                  className="btn-secondary"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages - 1 ||
                    loading
                  }
                  onClick={() =>
                    setPage((prev) => prev + 1)
                  }
                  className="btn-secondary"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          CREATE MODAL
      ====================================================== */}

      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  New Assignment
                </h2>

                <p className="text-sm text-gray-500">
                  Assign an available asset to personnel.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateAssignment}
              className="space-y-5 p-6"
            >

              {/* ASSET */}
              <div>
                <label className="label">
                  Asset <span className="text-red-500">*</span>
                </label>

                <select
                  name="assetId"
                  value={form.assetId}
                  onChange={handleFormChange}
                  className="input"
                  required
                >
                  <option value="">
                    Select available asset
                  </option>

                  {assets.map((asset) => (
                    <option
                      key={asset.id}
                      value={asset.id}
                    >
                      {asset.serialNumber}
                      {asset.equipmentTypeCode
                        ? ` - ${asset.equipmentTypeCode}`
                        : ''}
                    </option>
                  ))}
                </select>

                {assets.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No available assets found.
                  </p>
                )}
              </div>

              {/* PERSONNEL */}
              <div>
                <label className="label">
                  Personnel{' '}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  name="personnelId"
                  value={form.personnelId}
                  onChange={handleFormChange}
                  className="input"
                  required
                >
                  <option value="">
                    Select personnel
                  </option>

                  {personnel.map((person) => (
                    <option
                      key={person.id}
                      value={person.id}
                    >
                      {person.serviceNumber} -{' '}
                      {person.fullName}
                      {person.rank
                        ? ` (${person.rank})`
                        : ''}
                    </option>
                  ))}
                </select>

                {personnel.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No active personnel found.
                  </p>
                )}
              </div>

              {/* ASSIGNED DATE */}
              <div>
                <label className="label">
                  Assigned Date{' '}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  name="assignedDate"
                  value={form.assignedDate}
                  onChange={handleFormChange}
                  className="input"
                  required
                />
              </div>

              {/* EXPECTED RETURN */}
              <div>
                <label className="label">
                  Expected Return Date
                </label>

                <input
                  type="date"
                  name="expectedReturnDate"
                  value={form.expectedReturnDate}
                  onChange={handleFormChange}
                  className="input"
                  min={form.assignedDate}
                />
              </div>

              {/* NOTES */}
              <div>
                <label className="label">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows="4"
                  maxLength="1000"
                  className="input resize-none"
                  placeholder="Optional assignment notes..."
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.notes.length}/1000
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-4 w-4" />
                      Assign Asset
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DETAILS MODAL
      ====================================================== */}

      {showDetailsModal && selectedAssignment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Assignment Details
                </h2>

                <p className="text-sm text-gray-500">
                  Assignment #{selectedAssignment.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAssignment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

              <DetailItem
                label="Asset Serial Number"
                value={
                  selectedAssignment.assetSerialNumber
                }
              />

              <DetailItem
                label="Asset ID"
                value={selectedAssignment.assetId}
              />

              <DetailItem
                label="Equipment Type"
                value={
                  selectedAssignment.equipmentTypeName ||
                  selectedAssignment.equipmentTypeCode
                }
              />

              <DetailItem
                label="Personnel"
                value={
                  selectedAssignment.personnelFullName
                }
              />

              <DetailItem
                label="Service Number"
                value={
                  selectedAssignment.personnelServiceNumber
                }
              />

              <DetailItem
                label="Rank"
                value={selectedAssignment.personnelRank}
              />

              <DetailItem
                label="Unit"
                value={selectedAssignment.personnelUnit}
              />

              <DetailItem
                label="Base"
                value={
                  selectedAssignment.baseName ||
                  selectedAssignment.baseCode
                }
              />

              <DetailItem
                label="Assigned Date"
                value={formatDate(
                  selectedAssignment.assignedDate
                )}
              />

              <DetailItem
                label="Expected Return"
                value={formatDate(
                  selectedAssignment.expectedReturnDate
                )}
              />

              <DetailItem
                label="Returned Date"
                value={formatDate(
                  selectedAssignment.returnedDate
                )}
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </p>

                <span
                  className={`mt-1 inline-flex badge ${getStatusClass(
                    selectedAssignment.status
                  )}`}
                >
                  {selectedAssignment.status}
                </span>
              </div>

              <DetailItem
                label="Assigned By"
                value={
                  selectedAssignment.assignedBy
                }
              />

              <DetailItem
                label="Returned By"
                value={
                  selectedAssignment.returnedBy
                }
              />

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                  {selectedAssignment.notes || '—'}
                </p>
              </div>

            </div>

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">

              {canManage &&
                selectedAssignment.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setReturnedDate(
                        new Date()
                          .toISOString()
                          .split('T')[0]
                      );
                      setShowReturnModal(true);
                    }}
                    className="btn-primary"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Return Asset
                  </button>
                )}

            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          RETURN MODAL
      ====================================================== */}

      {showReturnModal && selectedAssignment && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Return Asset
                </h2>

                <p className="text-sm text-gray-500">
                  Confirm asset return.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowReturnModal(false)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleReturnAsset}
              className="space-y-5 p-6"
            >

              <div className="rounded-lg bg-gray-50 p-4">

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Asset
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {selectedAssignment.assetSerialNumber}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Assigned to{' '}
                  <span className="font-medium">
                    {selectedAssignment.personnelFullName}
                  </span>
                </p>

              </div>

              <div>
                <label className="label">
                  Returned Date{' '}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  value={returnedDate}
                  onChange={(e) =>
                    setReturnedDate(e.target.value)
                  }
                  min={selectedAssignment.assignedDate}
                  className="input"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setShowReturnModal(false)
                  }
                  className="btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Returning...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Confirm Return
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// =========================================================
// DETAIL ITEM
// =========================================================

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-gray-900">
        {value || '—'}
      </p>
    </div>
  );
}
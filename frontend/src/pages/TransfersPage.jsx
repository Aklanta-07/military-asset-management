import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react';

import { transfersApi, referenceApi, getApiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUS_OPTIONS = [
  'REQUESTED',
  'APPROVED',
  'IN_TRANSIT',
  'RECEIVED',
  'CANCELLED',
];

const INITIAL_FORM = {
  equipmentTypeId: '',
  fromBaseId: '',
  toBaseId: '',
  quantity: '',
  transferDate: new Date().toISOString().split('T')[0],
  notes: '',
};

function getStatusClasses(status) {
  switch (status) {
    case 'REQUESTED':
      return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_TRANSIT':
      return 'bg-purple-100 text-purple-800';
    case 'RECEIVED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatStatus(status) {
  return status?.replaceAll('_', ' ') || '-';
}

function formatDate(date) {
  if (!date) return '-';

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TransfersPage() {
  const {isAdmin, isBaseCommander } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState({
    fromBaseId: '',
    toBaseId: '',
    equipmentTypeId: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [form, setForm] = useState(INITIAL_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const canManageWorkflow = isAdmin || isBaseCommander;

  const loadReferenceData = useCallback(async () => {
    setReferenceLoading(true);

    try {
      const [basesData, equipmentData] = await Promise.all([
        referenceApi.getBases(),
        referenceApi.getEquipmentTypes(),
      ]);

      setBases(basesData || []);
      setEquipmentTypes(equipmentData || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load bases and equipment types.'
      );
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        size: pageSize,
        sortBy: 'transferDate',
        sortDir: 'DESC',
      };

      if (filters.fromBaseId) {
        params.fromBaseId = filters.fromBaseId;
      }

      if (filters.toBaseId) {
        params.toBaseId = filters.toBaseId;
      }

      if (filters.equipmentTypeId) {
        params.equipmentTypeId = filters.equipmentTypeId;
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

      const data = await transfersApi.getAll(params);

      setTransfers(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load transfers.'
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return transfers;

    return transfers.filter((transfer) => {
      return (
        transfer.equipmentTypeCode?.toLowerCase().includes(query) ||
        transfer.equipmentTypeName?.toLowerCase().includes(query) ||
        transfer.fromBaseCode?.toLowerCase().includes(query) ||
        transfer.fromBaseName?.toLowerCase().includes(query) ||
        transfer.toBaseCode?.toLowerCase().includes(query) ||
        transfer.toBaseName?.toLowerCase().includes(query) ||
        transfer.requestedBy?.toLowerCase().includes(query)
      );
    });
  }, [transfers, search]);

  const handleFilterChange = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));

    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      fromBaseId: '',
      toBaseId: '',
      equipmentTypeId: '',
      status: '',
      startDate: '',
      endDate: '',
    });

    setSearch('');
    setPage(0);
  };

  const handleFormChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (form.fromBaseId === form.toBaseId) {
      setError('From Base and To Base cannot be the same.');
      return;
    }

    if (!form.equipmentTypeId) {
      setError('Please select an equipment type.');
      return;
    }

    if (!form.fromBaseId || !form.toBaseId) {
      setError('Please select both source and destination bases.');
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!form.transferDate) {
      setError('Transfer date is required.');
      return;
    }

    setSubmitting(true);

    try {
      await transfersApi.create({
        equipmentTypeId: Number(form.equipmentTypeId),
        fromBaseId: Number(form.fromBaseId),
        toBaseId: Number(form.toBaseId),
        quantity: Number(form.quantity),
        transferDate: form.transferDate,
        notes: form.notes.trim() || null,
      });

      setSuccess('Transfer initiated successfully.');

      setShowCreateModal(false);
      setForm(INITIAL_FORM);
      setPage(0);

      await loadTransfers();
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Failed to create transfer.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (transfer) => {
    setError('');

    try {
      const data = await transfersApi.getById(transfer.id);
      setSelectedTransfer(data);
      setShowDetailsModal(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load transfer details.'
      );
    }
  };

  const handleAction = async (transfer, action) => {
    setError('');
    setSuccess('');
    setActionLoading(`${action}-${transfer.id}`);

    try {
      let response;

      switch (action) {
        case 'approve':
          response = await transfersApi.approve(transfer.id);
          setSuccess('Transfer approved successfully.');
          break;

        case 'in-transit':
          response = await transfersApi.markInTransit(transfer.id);
          setSuccess('Transfer marked as in transit.');
          break;

        case 'receive':
          response = await transfersApi.receive(transfer.id);
          setSuccess('Transfer received successfully.');
          break;

        default:
          return;
      }

      if (response) {
        setSelectedTransfer(response);
      }

      await loadTransfers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${action} transfer.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openCancelModal = (transfer) => {
    setSelectedTransfer(transfer);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancel = async (event) => {
    event.preventDefault();

    if (!cancelReason.trim()) {
      setError('Cancellation reason is required.');
      return;
    }

    setError('');
    setSuccess('');
    setActionLoading(`cancel-${selectedTransfer.id}`);

    try {
      await transfersApi.cancel(
        selectedTransfer.id,
        cancelReason.trim()
      );

      setSuccess('Transfer cancelled successfully.');

      setShowCancelModal(false);
      setCancelReason('');
      setSelectedTransfer(null);

      await loadTransfers();
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Failed to create transfer.')
      );
    } finally {
      setActionLoading(null);
    }
  };

  const isActionLoading = (action, id) =>
    actionLoading === `${action}-${id}`;

  const canCancel = (transfer) => {
    return transfer.status !== 'RECEIVED' &&
      transfer.status !== 'CANCELLED';
  };

  const canApprove = (transfer) => {
    return canManageWorkflow &&
      transfer.status === 'REQUESTED';
  };

  const canMarkInTransit = (transfer) => {
    return canManageWorkflow &&
      transfer.status === 'APPROVED';
  };

  const canReceive = (transfer) => {
    return canManageWorkflow &&
      (transfer.status === 'APPROVED' ||
        transfer.status === 'IN_TRANSIT');
  };

  const isSameBase = form.fromBaseId && form.toBaseId &&
    form.fromBaseId === form.toBaseId;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transfers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage equipment transfers between military bases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');
            setSuccess('');
            setForm(INITIAL_FORM);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New Transfer
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess('')}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />

            <h2 className="font-semibold text-gray-900">
              Filters
            </h2>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Clear filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              From Base
            </label>

            <select
              value={filters.fromBaseId}
              onChange={(e) =>
                handleFilterChange('fromBaseId', e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All bases</option>

              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.code} - {base.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              To Base
            </label>

            <select
              value={filters.toBaseId}
              onChange={(e) =>
                handleFilterChange('toBaseId', e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All bases</option>

              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.code} - {base.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Equipment
            </label>

            <select
              value={filters.equipmentTypeId}
              onChange={(e) =>
                handleFilterChange('equipmentTypeId', e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All equipment</option>

              {equipmentTypes.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.code} - {equipment.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={filters.status}
              onChange={(e) =>
                handleFilterChange('status', e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">All statuses</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Start Date
            </label>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                handleFilterChange('startDate', e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              End Date
            </label>

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                handleFilterChange('endDate', e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment, base, requester..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-gray-900">
              Transfer Records
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {totalElements} total transfer{totalElements === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={loadTransfers}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />

              <p className="mt-2 text-sm text-gray-500">
                Loading transfers...
              </p>
            </div>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <Truck className="h-10 w-10 text-gray-300" />

            <h3 className="mt-3 font-medium text-gray-900">
              No transfers found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or create a new transfer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredTransfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {transfer.equipmentTypeCode}
                      </div>

                      <div className="text-xs text-gray-500">
                        {transfer.equipmentTypeName}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {transfer.fromBaseCode}
                      </div>

                      <div className="text-xs text-gray-500">
                        {transfer.fromBaseName}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />

                        <div>
                          <div className="font-medium text-gray-900">
                            {transfer.toBaseCode}
                          </div>

                          <div className="text-xs text-gray-500">
                            {transfer.toBaseName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {transfer.quantity}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(transfer.transferDate)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          transfer.status
                        )}`}
                      >
                        {formatStatus(transfer.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {transfer.requestedByName ||
                        transfer.requestedBy ||
                        '-'}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            handleViewDetails(transfer)
                          }
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {canApprove(transfer) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(transfer, 'approve')
                            }
                            disabled={actionLoading !== null}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                            title="Approve"
                          >
                            {isActionLoading(
                              'approve',
                              transfer.id
                            ) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {canMarkInTransit(transfer) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(
                                transfer,
                                'in-transit'
                              )
                            }
                            disabled={actionLoading !== null}
                            className="rounded-lg p-2 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                            title="Mark in transit"
                          >
                            {isActionLoading(
                              'in-transit',
                              transfer.id
                            ) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Truck className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {canReceive(transfer) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(transfer, 'receive')
                            }
                            disabled={actionLoading !== null}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                            title="Receive transfer"
                          >
                            {isActionLoading(
                              'receive',
                              transfer.id
                            ) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {canCancel(transfer) && (
                          <button
                            type="button"
                            onClick={() =>
                              openCancelModal(transfer)
                            }
                            disabled={actionLoading !== null}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Cancel transfer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((previous) =>
                    Math.max(previous - 1, 0)
                  )
                }
                disabled={page === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((previous) =>
                    Math.min(previous + 1, totalPages - 1)
                  )
                }
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  New Transfer
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Initiate an equipment transfer between bases.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-5 p-5"
            >

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Equipment Type *
                  </label>

                  <select
                    value={form.equipmentTypeId}
                    onChange={(e) =>
                      handleFormChange(
                        'equipmentTypeId',
                        e.target.value
                      )
                    }
                    disabled={referenceLoading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    required
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
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    From Base *
                  </label>

                  <select
                    value={form.fromBaseId}
                    onChange={(e) =>
                      handleFormChange(
                        'fromBaseId',
                        e.target.value
                      )
                    }
                    disabled={referenceLoading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    required
                  >
                    <option value="">
                      Select source base
                    </option>

                    {bases.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.code} - {base.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    To Base *
                  </label>

                  <select
                    value={form.toBaseId}
                    onChange={(e) =>
                      handleFormChange(
                        'toBaseId',
                        e.target.value
                      )
                    }
                    disabled={referenceLoading}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${
                      isSameBase
                        ? 'border-red-400'
                        : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">
                      Select destination base
                    </option>

                    {bases.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.code} - {base.name}
                      </option>
                    ))}
                  </select>

                  {isSameBase && (
                    <p className="mt-1 text-xs text-red-600">
                      Source and destination cannot be the same.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      handleFormChange(
                        'quantity',
                        e.target.value
                      )
                    }
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    required
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Must not exceed available inventory at the source base.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Transfer Date *
                  </label>

                  <input
                    type="date"
                    value={form.transferDate}
                    onChange={(e) =>
                      handleFormChange(
                        'transferDate',
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Notes
                  </label>

                  <textarea
                    rows="4"
                    maxLength="1000"
                    value={form.notes}
                    onChange={(e) =>
                      handleFormChange('notes', e.target.value)
                    }
                    placeholder="Enter transfer notes..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />

                  <p className="mt-1 text-right text-xs text-gray-400">
                    {form.notes.length}/1000
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || isSameBase}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Initiate Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTransfer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Transfer #{selectedTransfer.id}
                </h2>

                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                    selectedTransfer.status
                  )}`}
                >
                  {formatStatus(selectedTransfer.status)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTransfer(null);
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Transfer Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Equipment"
                    value={`${selectedTransfer.equipmentTypeCode || '-'} - ${
                      selectedTransfer.equipmentTypeName || '-'
                    }`}
                  />

                  <DetailItem
                    label="Category"
                    value={selectedTransfer.equipmentCategory}
                  />

                  <DetailItem
                    label="Quantity"
                    value={selectedTransfer.quantity}
                  />

                  <DetailItem
                    label="Transfer Date"
                    value={formatDate(
                      selectedTransfer.transferDate
                    )}
                  />

                  <DetailItem
                    label="From Base"
                    value={`${selectedTransfer.fromBaseCode || '-'} - ${
                      selectedTransfer.fromBaseName || '-'
                    }`}
                  />

                  <DetailItem
                    label="To Base"
                    value={`${selectedTransfer.toBaseCode || '-'} - ${
                      selectedTransfer.toBaseName || '-'
                    }`}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Workflow
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Requested By"
                    value={
                      selectedTransfer.requestedByName ||
                      selectedTransfer.requestedBy
                    }
                  />

                  <DetailItem
                    label="Approved By"
                    value={
                      selectedTransfer.approvedByName ||
                      selectedTransfer.approvedBy
                    }
                  />

                  <DetailItem
                    label="Approved At"
                    value={formatDateTime(
                      selectedTransfer.approvedAt
                    )}
                  />

                  <DetailItem
                    label="Received By"
                    value={
                      selectedTransfer.receivedByName ||
                      selectedTransfer.receivedBy
                    }
                  />

                  <DetailItem
                    label="Received At"
                    value={formatDateTime(
                      selectedTransfer.receivedAt
                    )}
                  />

                  <DetailItem
                    label="Cancelled By"
                    value={
                      selectedTransfer.cancelledByName ||
                      selectedTransfer.cancelledBy
                    }
                  />

                  <DetailItem
                    label="Cancelled At"
                    value={formatDateTime(
                      selectedTransfer.cancelledAt
                    )}
                  />
                </div>
              </div>

              {selectedTransfer.cancellationReason && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Cancellation Reason
                  </h3>

                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {selectedTransfer.cancellationReason}
                  </p>
                </div>
              )}

              {selectedTransfer.notes && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Notes
                  </h3>

                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {selectedTransfer.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2">
                <DetailItem
                  label="Created At"
                  value={formatDateTime(
                    selectedTransfer.createdAt
                  )}
                />

                <DetailItem
                  label="Updated At"
                  value={formatDateTime(
                    selectedTransfer.updatedAt
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedTransfer && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Cancel Transfer
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Transfer #{selectedTransfer.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCancel}
              className="space-y-4 p-5"
            >
              <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                This action will mark the transfer as cancelled.
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Cancellation Reason *
                </label>

                <textarea
                  rows="4"
                  maxLength="1000"
                  value={cancelReason}
                  onChange={(e) =>
                    setCancelReason(e.target.value)
                  }
                  placeholder="Enter reason for cancellation..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  required
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {cancelReason.length}/1000
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Keep Transfer
                </button>

                <button
                  type="submit"
                  disabled={
                    !cancelReason.trim() ||
                    actionLoading !== null
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ===
                    `cancel-${selectedTransfer.id}` && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Cancel Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value || '-'}
      </p>
    </div>
  );
}
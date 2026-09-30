import { useEffect, useState } from 'react';
import { Plus, Search, RefreshCw, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { purchasesApi, referenceApi, getApiErrorMessage } from '../services/api';
import { cn } from '../utils/helpers';

const initialForm = {
  equipmentTypeId: '',
  baseId: '',
  quantity: '',
  unitCost: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  supplier: '',
  invoiceReference: '',
  description: '',
};

export function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const [search, setSearch] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');

  const [form, setForm] = useState(initialForm);

  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
  });

  // ---------------------------------------------------------
  // Load reference data
  // ---------------------------------------------------------

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [basesData, equipmentData] = await Promise.all([
        referenceApi.getBases(),
        referenceApi.getEquipmentTypes(),
      ]);

      setBases(basesData || []);
      setEquipmentTypes(equipmentData || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      toast.error('Failed to load reference data');
    }
  };

  // ---------------------------------------------------------
  // Load purchases
  // ---------------------------------------------------------

  const loadPurchases = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        size: pageSize,
        sortBy: 'purchaseDate',
        sortDir: 'DESC',
      };

      if (baseFilter) {
        params.baseId = baseFilter;
      }

      if (equipmentFilter) {
        params.equipmentTypeId = equipmentFilter;
      }

      const response = await purchasesApi.getAll(params);

      /*
       * Expected PageResponse:
       * {
       *   content: [],
       *   totalElements,
       *   totalPages,
       *   number,
       *   size
       * }
       */

      setPurchases(response?.content || []);

      setPagination({
        totalElements: response?.totalElements || 0,
        totalPages: response?.totalPages || 0,
        number: response?.number ?? page,
        size: response?.size || pageSize,
      });
    } catch (error) {
      console.error('Failed to load purchases:', error);
      toast.error(
        error.response?.data?.message || 'Failed to load purchases'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [page, baseFilter, equipmentFilter]);

  // ---------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingPurchase(null);

    setForm({
      ...initialForm,
      purchaseDate: new Date().toISOString().split('T')[0],
    });

    setShowModal(true);
  };

  const openEditModal = (purchase) => {
    setEditingPurchase(purchase);

    setForm({
      equipmentTypeId: purchase.equipmentTypeId ?? '',
      baseId: purchase.baseId ?? '',
      quantity: purchase.quantity ?? '',
      unitCost: purchase.unitCost ?? '',
      purchaseDate: purchase.purchaseDate ?? '',
      supplier: purchase.supplier ?? '',
      invoiceReference: purchase.invoiceReference ?? '',
      description: purchase.description ?? '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPurchase(null);
    setForm(initialForm);
  };

  // ---------------------------------------------------------
  // Create / Update
  // ---------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.equipmentTypeId ||
      !form.baseId ||
      !form.quantity ||
      !form.unitCost ||
      !form.purchaseDate
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      equipmentTypeId: Number(form.equipmentTypeId),
      baseId: Number(form.baseId),
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
      purchaseDate: form.purchaseDate,
      supplier: form.supplier.trim() || null,
      invoiceReference: form.invoiceReference.trim() || null,
      description: form.description.trim() || null,
    };

    try {
      setSaving(true);

      if (editingPurchase) {
        await purchasesApi.update(editingPurchase.id, payload);
        toast.success('Purchase updated successfully');
      } else {
        await purchasesApi.create(payload);
        toast.success('Purchase created successfully');
      }

      closeModal();
      await loadPurchases();
    } catch (error) {
      console.error('Failed to save purchase:', error);

      const message =
        error.response?.data?.message ||
        'Failed to save purchase';

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // Delete
  // ---------------------------------------------------------

  const handleDelete = async (purchase) => {
    const confirmed = window.confirm(
      `Delete purchase #${purchase.id}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await purchasesApi.delete(purchase.id);

      toast.success('Purchase deleted successfully');

      await loadPurchases();
    } catch (error) {
      console.error('Failed to delete purchase:', error);

      toast.error(
        getApiErrorMessage(error, 'Failed to delete purchase')
      );
    }
  };

  // ---------------------------------------------------------
  // Search
  // ---------------------------------------------------------

  const filteredPurchases = purchases.filter((purchase) => {
    if (!search.trim()) return true;

    const query = search.toLowerCase();

    return (
      String(purchase.id || '').includes(query) ||
      purchase.equipmentTypeCode?.toLowerCase().includes(query) ||
      purchase.equipmentTypeName?.toLowerCase().includes(query) ||
      purchase.baseCode?.toLowerCase().includes(query) ||
      purchase.baseName?.toLowerCase().includes(query) ||
      purchase.supplier?.toLowerCase().includes(query) ||
      purchase.invoiceReference?.toLowerCase().includes(query)
    );
  });

  // ---------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0.00';

    return `₹${Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';

    return new Date(`${value}T00:00:00`).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Purchases
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record and manage military equipment purchases.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Record Purchase
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search purchases..."
              className="input pl-10"
            />
          </div>

          {/* Base */}
          <select
            value={baseFilter}
            onChange={(event) => {
              setBaseFilter(event.target.value);
              setPage(0);
            }}
            className="input"
          >
            <option value="">All Bases</option>

            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.code || base.name}
              </option>
            ))}
          </select>

          {/* Equipment */}
          <select
            value={equipmentFilter}
            onChange={(event) => {
              setEquipmentFilter(event.target.value);
              setPage(0);
            }}
            className="input"
          >
            <option value="">All Equipment</option>

            {equipmentTypes.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.code || equipment.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Purchase Records
            </h2>

            <p className="text-sm text-gray-500">
              {pagination.totalElements} total purchase
              {pagination.totalElements === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={loadPurchases}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={cn(
                'h-5 w-5',
                loading && 'animate-spin'
              )}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />

              <p className="mt-3 text-sm text-gray-500">
                Loading purchases...
              </p>
            </div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-gray-100 p-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>

            <h3 className="mt-4 font-medium text-gray-900">
              No purchases found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or record a new purchase.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[1100px]">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipment</th>
                  <th>Base</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Purchase Date</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="font-medium">
                      #{purchase.id}
                    </td>

                    <td>
                      <div className="font-medium text-gray-900">
                        {purchase.equipmentTypeCode ||
                          purchase.equipmentTypeName ||
                          '-'}
                      </div>

                      {purchase.equipmentTypeName && (
                        <div className="text-xs text-gray-500">
                          {purchase.equipmentTypeName}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="font-medium">
                        {purchase.baseCode || '-'}
                      </div>

                      <div className="text-xs text-gray-500">
                        {purchase.baseName || ''}
                      </div>
                    </td>

                    <td>{purchase.quantity}</td>

                    <td>
                      {formatCurrency(purchase.unitCost)}
                    </td>

                    <td className="font-medium">
                      {formatCurrency(purchase.totalCost)}
                    </td>

                    <td>
                      {formatDate(purchase.purchaseDate)}
                    </td>

                    <td>
                      {purchase.supplier || '-'}
                    </td>

                    <td>
                      <span
                        className={cn(
                          'badge',
                          purchase.status === 'COMPLETED'
                            ? 'badge-success'
                            : purchase.status === 'CANCELLED'
                              ? 'badge-danger'
                              : 'badge-warning'
                        )}
                      >
                        {purchase.status || 'UNKNOWN'}
                      </span>
                    </td>

                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(purchase)
                          }
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(purchase)
                          }
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.number + 1} of{' '}
              {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() =>
                  setPage((previous) => previous - 1)
                }
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages - 1}
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingPurchase
                    ? 'Edit Purchase'
                    : 'Record Purchase'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingPurchase
                    ? 'Update purchase information.'
                    : 'Record a new equipment purchase.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Equipment */}
                <div>
                  <label className="label">
                    Equipment Type <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="equipmentTypeId"
                    value={form.equipmentTypeId}
                    onChange={handleChange}
                    className="input"
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
                        {equipment.code
                          ? `${equipment.code} - ${equipment.name}`
                          : equipment.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Base */}
                <div>
                  <label className="label">
                    Base <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="baseId"
                    value={form.baseId}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">
                      Select base
                    </option>

                    {bases.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.code
                          ? `${base.code} - ${base.name}`
                          : base.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="label">
                    Quantity <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    className="input"
                    required
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="label">
                    Unit Cost <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    name="unitCost"
                    value={form.unitCost}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    className="input"
                    required
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="label">
                    Purchase Date{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="label">
                    Supplier
                  </label>

                  <input
                    type="text"
                    name="supplier"
                    value={form.supplier}
                    onChange={handleChange}
                    maxLength={200}
                    className="input"
                    placeholder="Supplier name"
                  />
                </div>

                {/* Invoice */}
                <div className="sm:col-span-2">
                  <label className="label">
                    Invoice Reference
                  </label>

                  <input
                    type="text"
                    name="invoiceReference"
                    value={form.invoiceReference}
                    onChange={handleChange}
                    maxLength={100}
                    className="input"
                    placeholder="Invoice / reference number"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="label">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    maxLength={500}
                    rows={3}
                    className="input resize-none"
                    placeholder="Additional purchase details..."
                  />
                </div>
              </div>

              {/* Calculated total */}
              {form.quantity && form.unitCost && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Total Cost
                    </span>

                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        Number(form.quantity) *
                          Number(form.unitCost)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingPurchase
                      ? 'Update Purchase'
                      : 'Record Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
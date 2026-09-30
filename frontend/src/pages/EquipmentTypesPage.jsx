import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Package,
  RefreshCw,
  Search,
  Filter,
  X,
} from 'lucide-react';

import { referenceApi } from '../services/api';

const CATEGORY_OPTIONS = [
  'WEAPON',
  'VEHICLE',
  'AMMUNITION',
  'COMMUNICATION',
  'ENGINEERING',
  'MEDICAL',
  'OTHER',
];

const UNIT_OPTIONS = [
  'UNIT',
  'ROUND',
  'BOX',
  'SET',
  'LITER',
  'KG',
  'KIT',
];

const formatCategory = (value) => {
  if (!value) return '-';

  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatUnit = (value) => {
  if (!value) return '-';

  const labels = {
    UNIT: 'Unit',
    ROUND: 'Round',
    BOX: 'Box',
    SET: 'Set',
    LITER: 'Liter',
    KG: 'Kg',
    KIT: 'Kit',
  };

  return labels[value] || value;
};

const getCategoryBadgeClass = (category) => {
  const classes = {
    WEAPON: 'bg-red-100 text-red-700',
    VEHICLE: 'bg-blue-100 text-blue-700',
    AMMUNITION: 'bg-orange-100 text-orange-700',
    COMMUNICATION: 'bg-purple-100 text-purple-700',
    ENGINEERING: 'bg-yellow-100 text-yellow-700',
    MEDICAL: 'bg-green-100 text-green-700',
    OTHER: 'bg-gray-100 text-gray-700',
  };

  return classes[category] || 'bg-gray-100 text-gray-700';
};

export default function EquipmentTypes() {
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  const loadEquipmentTypes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const data = await referenceApi.getEquipmentTypes();

      setEquipmentTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load equipment types:', err);

      setError(
        err?.response?.data?.message ||
        'Failed to load equipment types. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEquipmentTypes();
  }, [loadEquipmentTypes]);

  const filteredEquipmentTypes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return equipmentTypes.filter((equipmentType) => {
      const matchesSearch =
        !search ||
        equipmentType.code?.toLowerCase().includes(search) ||
        equipmentType.name?.toLowerCase().includes(search) ||
        equipmentType.description?.toLowerCase().includes(search);

      const matchesCategory =
        !categoryFilter ||
        equipmentType.category === categoryFilter;

      const matchesUnit =
        !unitFilter ||
        equipmentType.unitOfMeasure === unitFilter;

      return matchesSearch && matchesCategory && matchesUnit;
    });
  }, [
    equipmentTypes,
    searchTerm,
    categoryFilter,
    unitFilter,
  ]);

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setUnitFilter('');
  };

  const hasFilters =
    searchTerm || categoryFilter || unitFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-3">
            <Package className="h-6 w-6 text-indigo-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Equipment Types
            </h1>

            <p className="text-sm text-gray-500">
              View active equipment types and their classifications
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadEquipmentTypes(true)}
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

      {/* Summary */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Equipment Types
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {equipmentTypes.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Matching Results
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {filteredEquipmentTypes.length}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Search */}
          <div className="flex-1">
            <label
              htmlFor="equipment-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="equipment-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code, name or description..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Category */}
          <div className="w-full lg:w-56">
            <label
              htmlFor="category-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Category
            </label>

            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Categories</option>

              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div className="w-full lg:w-48">
            <label
              htmlFor="unit-filter"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Unit of Measure
            </label>

            <select
              id="unit-filter"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Units</option>

              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {formatUnit(unit)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />

          <span>
            Showing {filteredEquipmentTypes.length} of{' '}
            {equipmentTypes.length} equipment types
          </span>
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
              onClick={() => loadEquipmentTypes()}
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
            Loading equipment types...
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {filteredEquipmentTypes.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="mx-auto h-10 w-10 text-gray-400" />

              <h3 className="mt-3 text-sm font-semibold text-gray-900">
                No equipment types found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {hasFilters
                  ? 'Try adjusting your search or filters.'
                  : 'No active equipment types are available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Code
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Equipment Type
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Category
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Unit of Measure
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Description
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredEquipmentTypes.map((equipmentType) => (
                    <tr
                      key={equipmentType.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Code */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {equipmentType.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {equipmentType.name}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                            equipmentType.category
                          )}`}
                        >
                          {formatCategory(equipmentType.category)}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatUnit(equipmentType.unitOfMeasure)}
                      </td>

                      {/* Description */}
                      <td className="max-w-md px-6 py-4">
                        <p
                          className="truncate text-sm text-gray-600"
                          title={equipmentType.description || ''}
                        >
                          {equipmentType.description || '-'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-6 py-4">
                        {equipmentType.active ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
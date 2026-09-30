import { useCallback, useEffect, useMemo, useState } from 'react';
import { referenceApi } from '../services/api';
import {
  Building2,
  Search,
  RefreshCw,
  MapPin,
  UserRound,
  ChevronDown,
} from 'lucide-react';

const BasesPage = () => {
  const [bases, setBases] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBases = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await referenceApi.getBases();

      setBases(data || []);
    } catch (err) {
      console.error('Failed to load bases:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load bases. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBases();
  }, [loadBases]);

  const filteredBases = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return bases.filter((base) => {
      const matchesSearch =
        !search ||
        [
          base.code,
          base.name,
          base.location,
          base.commanderName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(search)
          );

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && base.active) ||
        (statusFilter === 'INACTIVE' && !base.active);

      return matchesSearch && matchesStatus;
    });
  }, [bases, searchTerm, statusFilter]);

  const activeCount = useMemo(
    () => bases.filter((base) => base.active).length,
    [bases]
  );

  const inactiveCount = useMemo(
    () => bases.filter((base) => !base.active).length,
    [bases]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bases
            </h1>

            <p className="text-sm text-gray-500">
              View military bases and their assigned commanders
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadBases}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? 'animate-spin' : ''
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Bases
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {bases.length}
          </p>
        </div>

        {/* Active */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Bases
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {activeCount}
          </p>
        </div>

        {/* Inactive */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Inactive Bases
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-500">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, name, location or commander..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}
          <div className="relative w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing{' '}
          <span className="font-semibold text-gray-900">
            {filteredBases.length}
          </span>{' '}
          bases
        </p>

        {(searchTerm || statusFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Code
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Base
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Location
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Commander
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Loading bases...
                  </td>
                </tr>
              ) : filteredBases.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <Building2 className="mb-3 h-10 w-10 text-gray-300" />

                      <p className="text-sm font-medium text-gray-900">
                        No bases found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBases.map((base) => (
                  <tr
                    key={base.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* Code */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-sm font-semibold text-gray-800">
                        {base.code}
                      </span>
                    </td>

                    {/* Base */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>

                        <p className="text-sm font-medium text-gray-900">
                          {base.name}
                        </p>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />

                        <span className="text-sm text-gray-700">
                          {base.location || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Commander */}
                    <td className="px-6 py-4">
                      {base.commanderName ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                            <UserRound className="h-4 w-4 text-gray-500" />
                          </div>

                          <span className="text-sm text-gray-700">
                            {base.commanderName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-6 py-4">
                      {base.active ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BasesPage;
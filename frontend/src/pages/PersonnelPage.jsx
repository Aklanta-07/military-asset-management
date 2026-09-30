import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { referenceApi } from '../services/api';
import {
  Users,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  UserRound,
} from 'lucide-react';

const PersonnelPage = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('ADMIN');

  const [personnel, setPersonnel] = useState([]);
  const [bases, setBases] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBase, setSelectedBase] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPersonnel = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const baseId =
        isAdmin && selectedBase ? Number(selectedBase) : undefined;

      const data = await referenceApi.getPersonnel(baseId);

      setPersonnel(data || []);
    } catch (err) {
      console.error('Failed to load personnel:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load personnel. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedBase]);

  const loadBases = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const data = await referenceApi.getBases();
      setBases(data || []);
    } catch (err) {
      console.error('Failed to load bases:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadBases();
  }, [loadBases]);

  useEffect(() => {
    loadPersonnel();
  }, [loadPersonnel]);

  const filteredPersonnel = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return personnel;
    }

    return personnel.filter((person) =>
      [
        person.serviceNumber,
        person.rank,
        person.fullName,
        person.unit,
        person.baseCode,
        person.baseName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        )
    );
  }, [personnel, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Users className="h-6 w-6 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Personnel
            </h1>

            <p className="text-sm text-gray-500">
              View military personnel assigned to bases
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadPersonnel}
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
              placeholder="Search by name, service number, rank or unit..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Base filter - ADMIN only */}
          {isAdmin && (
            <div className="relative w-full lg:w-64">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <select
                value={selectedBase}
                onChange={(e) => setSelectedBase(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Bases</option>

                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.code} - {base.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing{' '}
          <span className="font-semibold text-gray-900">
            {filteredPersonnel.length}
          </span>{' '}
          personnel
        </p>

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Clear search
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
                  Service Number
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Personnel
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Rank
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Unit
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Base
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
                    colSpan="6"
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Loading personnel...
                  </td>
                </tr>
              ) : filteredPersonnel.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <UserRound className="mb-3 h-10 w-10 text-gray-300" />

                      <p className="text-sm font-medium text-gray-900">
                        No personnel found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((person) => (
                  <tr
                    key={person.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* Service Number */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {person.serviceNumber}
                      </span>
                    </td>

                    {/* Personnel */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                          <UserRound className="h-4 w-4 text-blue-600" />
                        </div>

                        <p className="text-sm font-medium text-gray-900">
                          {person.fullName}
                        </p>
                      </div>
                    </td>

                    {/* Rank */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {person.rank}
                    </td>

                    {/* Unit */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {person.unit || '—'}
                    </td>

                    {/* Base */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {person.baseCode}
                      </p>

                      <p className="text-xs text-gray-500">
                        {person.baseName}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-6 py-4">
                      {person.active ? (
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

export default PersonnelPage;
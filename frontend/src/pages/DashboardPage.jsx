import { useState, useEffect, useCallback } from 'react';
import {ClipboardList} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, referenceApi } from '../services/api';
import {
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  MinusCircle,
  UserCheck,
  Filter,
  ChevronDown,
  RefreshCw,
  BarChart2,
  Plus,
  Minus,
  Eye,
  Download,
} from 'lucide-react';
import { formatDate, formatNumber, formatCurrency, cn, getStatusColor } from '../utils/helpers';
import { MetricCard } from '../components/dashboard/MetricCard';
import { NetMovementModal } from '../components/dashboard/NetMovementModal';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { Select } from '../components/common/Select';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-primary-500',
  gray: 'bg-gray-400',
};

export function DashboardPage() {
  const { user, isAdmin, isBaseCommander } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    baseId: user?.baseId || '',
    equipmentTypeId: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [showNetMovementModal, setShowNetMovementModal] = useState(false);
  const [netMovementData, setNetMovementData] = useState(null);
  const [netMovementLoading, setNetMovementLoading] = useState(false);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [basesRes, equipmentTypesRes] = await Promise.all([
        referenceApi.getBases(),
        referenceApi.getEquipmentTypes(),
      ]);
      setBases(basesRes);
      setEquipmentTypes(equipmentTypesRes);
    } catch (error) {
      toast.error('Failed to load reference data');
    }
  }, []);

  const fetchDashboardSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        baseId: filters.baseId || undefined,
        equipmentTypeId: filters.equipmentTypeId || undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      const data = await dashboardApi.getSummary(params);
      setSummary(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleNetMovementClick = async () => {
    setNetMovementLoading(true);
    try {
      const params = {
        baseId: filters.baseId || undefined,
        equipmentTypeId: filters.equipmentTypeId || undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      const data = await dashboardApi.getNetMovementDetail(params);
      setNetMovementData(data);
      setShowNetMovementModal(true);
    } catch (error) {
      toast.error('Failed to load net movement details');
    } finally {
      setNetMovementLoading(false);
    }
  };

  const handleRefresh = () => {
  setFilters(prev => ({
    ...prev,
    baseId: '',
    equipmentTypeId: '',
  }));
};

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  const metrics = [
    {
      label: 'Opening Balance',
      value: summary?.openingBalance || 0,
      icon: Package,
      color: 'primary',
      trend: null,
    },
    {
      label: 'Closing Balance',
      value: summary?.closingBalance || 0,
      icon: Package,
      color: 'success',
      trend: null,
    },
    {
      label: 'Purchases',
      value: summary?.purchasesQty || 0,
      secondaryValue: summary?.purchasesValue ? formatCurrency(summary.purchasesValue) : null,
      icon: Plus,
      color: 'success',
      clickable: true,
      onClick: handleNetMovementClick,
    },
    {
      label: 'Transfers In',
      value: summary?.transfersInQty || 0,
      icon: ArrowDownRight,
      color: 'info',
      clickable: true,
      onClick: handleNetMovementClick,
    },
    {
      label: 'Transfers Out',
      value: summary?.transfersOutQty || 0,
      icon: ArrowUpRight,
      color: 'warning',
      clickable: true,
      onClick: handleNetMovementClick,
    },
    {
      label: 'Net Movement',
      value: summary?.netMovement || 0,
      icon: BarChart2,
      color: summary?.netMovement >= 0 ? 'success' : 'danger',
      clickable: true,
      onClick: handleNetMovementClick,
    },
    {
      label: 'Assigned',
      value: summary?.assignedQty || 0,
      icon: UserCheck,
      color: 'info',
    },
    {
      label: 'Expended',
      value: summary?.expendedQty || 0,
      icon: MinusCircle,
      color: 'danger',
    },
  ];

  const equipmentTypeMetrics = summary?.equipmentTypeSummaries || [];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of asset movements and balances</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Base Filter */}
          {(isAdmin || isBaseCommander) && (
            <Select
              label="Base"
              value={filters.baseId}
              options={bases.map(b => ({ value: b.id, label: `${b.code} - ${b.name}` }))}
              onChange={(value) => setFilters(prev => ({ ...prev, baseId: value }))}
              placeholder="All Bases"
              className="w-56"
            />
          )}

          {/* Equipment Type Filter */}
          <Select
            label="Equipment Type"
            value={filters.equipmentTypeId}
            options={equipmentTypes.map(et => ({ value: et.id, label: `${et.code} - ${et.name}` }))}
            onChange={(value) => setFilters(prev => ({ ...prev, equipmentTypeId: value }))}
            placeholder="All Types"
            className="w-56"
          />

          {/* Date Range */}
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={(range) => setFilters(prev => ({ ...prev, ...range }))}
          />

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            {...metric}
            formatValue={formatNumber}
          />
        ))}
      </div>

      {/* Equipment Type Breakdown */}
      {equipmentTypeMetrics.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Equipment Type Breakdown</h2>
          </div>
          <div className="card-body p-0">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Equipment Type</th>
                    <th>Category</th>
                    <th className="text-right">Opening</th>
                    <th className="text-right">Purchases</th>
                    <th className="text-right">Transfers In</th>
                    <th className="text-right">Transfers Out</th>
                    <th className="text-right">Net Movement</th>
                    <th className="text-right">Closing</th>
                    <th className="text-right">Assigned</th>
                    <th className="text-right">Expended</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentTypeMetrics.map((et) => (
                    <tr key={et.equipmentTypeId}>
                      <td className="font-medium">{et.equipmentTypeCode} - {et.equipmentTypeName}</td>
                      <td>
                        <span className={cn('badge', `badge-${getStatusColor(et.equipmentCategory)}`)}>
                          {et.equipmentCategory}
                        </span>
                      </td>
                      <td className="text-right">{formatNumber(et.openingBalance)}</td>
                      <td className="text-right text-success-600">+{formatNumber(et.purchasesQty)}</td>
                      <td className="text-right text-primary-600">+{formatNumber(et.transfersInQty)}</td>
                      <td className="text-right text-warning-600">-{formatNumber(et.transfersOutQty)}</td>
                      <td className={cn('text-right font-medium', et.netMovement >= 0 ? 'text-success-600' : 'text-danger-600')}>
                        {et.netMovement >= 0 ? '+' : ''}{formatNumber(et.netMovement)}
                      </td>
                      <td className="text-right font-medium">{formatNumber(et.currentBalance)}</td>
                      <td className="text-right text-info-600">{formatNumber(et.assignedQty)}</td>
                      <td className="text-right text-danger-600">{formatNumber(et.expendedQty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
<div className="card relative z-10">
  <div className="card-header">
    <h2 className="text-lg font-semibold text-gray-900">
      Quick Actions
    </h2>
  </div>

  <div className="card-body">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <Link
        to="/purchases"
        className="relative z-20 flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
      >
        <Plus className="w-6 h-6 mb-2 text-green-700" />

        <p className="font-bold text-gray-900">
          Record Purchase
        </p>

        <p className="text-sm text-gray-600">
          Add new asset purchases
        </p>
      </Link>

      <Link
        to="/transfers"
        className="relative z-20 flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
      >
        <Truck className="w-6 h-6 mb-2 text-blue-700" />

        <p className="font-bold text-gray-900">
          Create Transfer
        </p>

        <p className="text-sm text-gray-600">
          Transfer assets between bases
        </p>
      </Link>

      <Link
  to="/assignments"
  className="relative z-20 flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
>
  <UserCheck className="h-6 w-6 text-green-700" />

  <div>
    <p className="font-bold text-gray-900">
      Create Assignment
    </p>

    <p className="text-sm text-gray-600">
      Assign assets to personnel
    </p>
  </div>
</Link>

<Link
  to="/expenditures"
  className="relative z-20 flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
>
  <ClipboardList className="h-6 w-6 text-red-700" />

  <div>
    <p className="font-bold text-gray-900">
      Record Expenditure
    </p>

    <p className="text-sm text-gray-600">
      Record assets consumed
    </p>
  </div>
</Link>

    </div>
  </div>
</div>

      {/* Net Movement Modal */}
      <NetMovementModal
        isOpen={showNetMovementModal}
        onClose={() => setShowNetMovementModal(false)}
        data={netMovementData}
        loading={netMovementLoading}
        filters={filters}
      />
    </div>
  );
}
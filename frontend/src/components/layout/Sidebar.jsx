import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Truck,
  UserCheck,
  MinusCircle,
  Settings,
  LogOut,
  Shield,
  Users,
  Database,
  X,
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'BASE_COMMANDER'],
  },
  {
    name: 'Purchases',
    href: '/purchases',
    icon: Package,
    roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'],
  },
  {
    name: 'Transfers',
    href: '/transfers',
    icon: Truck,
    roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'],
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: UserCheck,
    roles: ['ADMIN', 'BASE_COMMANDER'],
  },
  {
    name: 'Expenditures',
    href: '/expenditures',
    icon: MinusCircle,
    roles: ['ADMIN', 'BASE_COMMANDER'],
  },
  {
    name: 'Bases',
    href: '/bases',
    icon: Database,
    roles: ['ADMIN'],
  },
  {
    name: 'Personnel',
    href: '/personnel',
    icon: Users,
    roles: ['ADMIN', 'BASE_COMMANDER'],
  },
  {
    name: 'Equipment Types',
    href: '/equipment-types',
    icon: Settings,
    roles: ['ADMIN'],
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: Shield,
    roles: ['ADMIN'],
  },
];

export function Sidebar({ isOpen, onClose }) {
  const { user, logout, hasRole } = useAuth();

  const filteredNavigation = navigation.filter((item) =>
    hasRole(item.roles)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[110] w-64 bg-white border-r border-gray-200',
          'flex flex-col',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>

            <span className="font-semibold text-gray-900 text-lg">
              MAMS
            </span>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-4 py-4 space-y-1 overflow-y-auto"
          aria-label="Main navigation"
        >
          {filteredNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  aria-hidden="true"
                />

                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || user?.username}
              </p>

              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ') || ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut
              className="w-5 h-5"
              aria-hidden="true"
            />

            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
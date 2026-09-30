import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Building2,
  Hash,
  RefreshCw,
} from 'lucide-react';

import { authApi } from '../services/api';

const formatRole = (role) => {
  if (!role) return '-';

  return role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getInitials = (fullName, username) => {
  const name = fullName || username || 'User';

  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await authApi.getCurrentUser();

      setProfile(response);
    } catch (err) {
      console.error('Failed to load profile:', err);

      setError(
        err?.response?.data?.message ||
          'Failed to load profile. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-red-800">
              Unable to load profile
            </h2>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadProfile(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />

            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initials = getInitials(
    profile.fullName,
    profile.username
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View your account and assignment details
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadProfile(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? 'animate-spin' : ''
            }`}
          />

          Refresh
        </button>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Profile Banner */}
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-500" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-primary-100 text-2xl font-bold text-primary-700 shadow-md">
                {initials}
              </div>

              <div className="pb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.fullName || profile.username}
                </h2>

                <p className="text-sm text-gray-500">
                  @{profile.username}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
              Active Account
            </span>
          </div>

          {/* Details */}
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Account Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ProfileField
                icon={User}
                label="Full Name"
                value={profile.fullName}
              />

              <ProfileField
                icon={Hash}
                label="Username"
                value={profile.username}
              />

              <ProfileField
                icon={Mail}
                label="Email"
                value={profile.email}
              />

              <ProfileField
                icon={Shield}
                label="Role"
                value={formatRole(profile.role)}
              />
            </div>
          </div>

          {/* Base Information */}
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Base Assignment
            </h3>

            {profile.baseId ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ProfileField
                  icon={Building2}
                  label="Base Name"
                  value={profile.baseName}
                />

                <ProfileField
                  icon={Hash}
                  label="Base Code"
                  value={profile.baseCode}
                />

                <ProfileField
                  icon={Hash}
                  label="Base ID"
                  value={profile.baseId}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
                <p className="text-sm text-gray-500">
                  No base assigned to this user.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="rounded-lg bg-white p-2 shadow-sm">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
          {value || '-'}
        </p>
      </div>
    </div>
  );
}
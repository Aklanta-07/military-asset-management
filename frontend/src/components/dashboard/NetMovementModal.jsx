import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';

export function NetMovementModal({
  isOpen,
  onClose,
  data,
  loading = false,
}) {
  if (!isOpen) {
    return null;
  }

  const transfersIn = data?.transfersIn ?? 0;
  const transfersOut = data?.transfersOut ?? 0;
  const netMovement = data?.netMovement ?? transfersIn - transfersOut;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Net Movement Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Transfer movement for the selected period
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2 text-green-600">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Transfers In
                    </p>
                    <p className="text-xs text-gray-500">
                      Assets received
                    </p>
                  </div>
                </div>

                <p className="text-lg font-bold text-green-600">
                  {formatNumber(transfersIn)}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2 text-red-600">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Transfers Out
                    </p>
                    <p className="text-xs text-gray-500">
                      Assets transferred
                    </p>
                  </div>
                </div>

                <p className="text-lg font-bold text-red-600">
                  {formatNumber(transfersOut)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Net Movement
                  </p>

                  <p
                    className={`text-xl font-bold ${
                      netMovement > 0
                        ? 'text-green-600'
                        : netMovement < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {netMovement > 0 ? '+' : ''}
                    {formatNumber(netMovement)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
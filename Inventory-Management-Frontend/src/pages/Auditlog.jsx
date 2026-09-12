import { useEffect, useMemo, useState } from "react";
import { ScrollText, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { auditLogApi } from "../services/service";

const EVENT_STYLE = {
  login: { color: "#2F5FEA", bg: "#EFF3FE" },
  logout: { color: "#6B7280", bg: "#F3F4F6" },
  created: { color: "#22C55E", bg: "#EFFBF3" },
  updated: { color: "#F4972B", bg: "#FEF6EC" },
  deleted: { color: "#EF4444", bg: "#FEF3F2" },
};

const shortModel = (type) => type?.split("\\").pop() ?? "—";

function LogDetail({ log, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <div>
            <h2 className="font-display font-semibold text-[15px] text-[#10151F] capitalize">
              {log.event} · {shortModel(log.auditable_type)}
              {log.auditable_id ? ` #${log.auditable_id}` : ""}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-[#9CA3AF]">
              {log.created_at}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">
          {log.old_values && (
            <div className="mb-4">
              <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
                Before
              </div>
              <pre className="max-h-48 overflow-auto rounded-lg bg-[#F9FAFB] border border-[#F0F1F3] p-3 font-mono text-[12px] text-[#374151]">
                {JSON.stringify(log.old_values, null, 2)}
              </pre>
            </div>
          )}

          {log.new_values && (
            <div>
              <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
                After
              </div>
              <pre className="max-h-48 overflow-auto rounded-lg bg-[#F9FAFB] border border-[#F0F1F3] p-3 font-mono text-[12px] text-[#374151]">
                {JSON.stringify(log.new_values, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[#F0F1F3] px-5 py-4">
          <button
            onClick={onClose}
            className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventFilter, setEventFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [selected, setSelected] = useState(null);

  const load = async (event = eventFilter, pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageNum };
      if (event) params.event = event;
      const res = await auditLogApi.list(params);
      setRows(res.data.data ?? []);
      setMeta({
        current_page: res.data.current_page ?? 1,
        last_page: res.data.last_page ?? 1,
        total: res.data.total ?? (res.data.data ?? []).length,
        per_page: res.data.per_page ?? 10,
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load audit log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(eventFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilterChange = (e) => {
    const event = e.target.value;
    setEventFilter(event);
    setPage(1);
    load(event, 1);
  };

  const showingFrom = useMemo(
    () => (rows.length ? (meta.current_page - 1) * meta.per_page + 1 : 0),
    [rows, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * meta.per_page + rows.length,
    [rows, meta],
  );

  return (
    <div className="bg-[#F9FAFB] min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-6 pt-8 pb-6">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
            Admin
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Audit Log
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            {meta.total
              ? `${meta.total} events recorded.`
              : "A record of logins and changes made across the system."}
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="px-6 mb-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 max-w-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                Total events
              </p>
              <p className="font-display font-semibold text-[24px] text-[#10151F]">
                {loading ? (
                  <span className="inline-block h-6 w-10 bg-[#F3F4F6] rounded animate-pulse" />
                ) : (
                  meta.total
                )}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#2F5FEA]/10">
              <ScrollText size={17} className="text-[#2F5FEA]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 px-6 mb-4">
        <select
          value={eventFilter}
          onChange={handleFilterChange}
          className="font-body px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[13.5px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
        >
          <option value="">All events</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {error && !loading && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => load()}
            className="font-medium underline shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mx-6 bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full min-w-[640px] font-body text-[13.5px]">
          <thead>
            <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide border-b border-[#F0F1F3]">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Target</th>
              <th className="px-5 py-3 font-medium">IP address</th>
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F1F3] last:border-0">
                  <td colSpan={6} className="px-5 py-3.5">
                    <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <ScrollText
                    size={28}
                    className="mx-auto text-[#D1D5DB] mb-2"
                  />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    {eventFilter
                      ? "No events match this filter."
                      : "No activity recorded yet."}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows.map((log) => {
                const style = EVENT_STYLE[log.event] ?? EVENT_STYLE.logout;
                const hasDetails = log.old_values || log.new_values;
                return (
                  <tr
                    key={log.audit_log_id}
                    className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {log.user?.image_url ? (
                          <img
                            src={log.user.image_url}
                            alt={log.user.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2F5FEA] font-body text-[11px] font-semibold text-white">
                            {log.user?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="text-[#10151F] font-medium">
                          {log.user?.name ?? `User #${log.user_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11.5px] font-medium"
                        style={{
                          color: style.color,
                          backgroundColor: style.bg,
                        }}
                      >
                        {log.event}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      {log.auditable_type
                        ? `${shortModel(log.auditable_type)} #${log.auditable_id}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-[#6B7280]">
                      {log.ip_address}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      {log.created_at}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {hasDetails ? (
                          <button
                            onClick={() => setSelected(log)}
                            className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                            aria-label="View details"
                          >
                            <Eye size={15} />
                          </button>
                        ) : (
                          <span className="text-[#D1D5DB] pr-1.5">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && !error && rows.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0F1F3]">
            <p className="font-body text-[12.5px] text-[#9CA3AF]">
              Showing{" "}
              <span className="text-[#374151] font-medium">
                {showingFrom}–{showingTo}
              </span>{" "}
              of{" "}
              <span className="text-[#374151] font-medium">{meta.total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="p-1.5 rounded-md border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="font-mono text-[12px] text-[#6B7280] px-2">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="p-1.5 rounded-md border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <LogDetail log={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

import { NavLink, useNavigate } from "react-router-dom";
import { UserCircle, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAuth } from "../hook/useAuth";
import { getGroupedNavItems } from "../config/navConfig";

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role?.role_name?.toLowerCase() === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const width = collapsed ? "w-[76px]" : "w-[248px]";

  const groupedNav = getGroupedNavItems()
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#10151F]/40 z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`${width} shrink-0 bg-white border-r border-[#E5E7EB] h-screen sticky top-0 flex flex-col transition-[width] duration-200
        fixed lg:static z-40 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
          .font-display { font-family: 'Space Grotesk', sans-serif; }
          .font-body { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'IBM Plex Mono', monospace; }
        `}</style>

        {/* Brand */}
        <div
          className={`flex items-center gap-2.5 h-16 shrink-0 ${collapsed ? "justify-center px-0" : "px-5"}`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 34 34"
            fill="none"
            className="shrink-0"
          >
            <rect width="34" height="34" rx="9" fill="#2F5FEA" />
            <path
              d="M17 8L24.5 12.2V21.8L17 26L9.5 21.8V12.2L17 8Z"
              stroke="white"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 12.2L17 16.3M17 16.3L24.5 12.2M17 16.3V26"
              stroke="white"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {!collapsed && (
            <div className="font-display font-semibold text-[16px] text-[#10151F] leading-none">
              SMART INVENTORY
            </div>
          )}
        </div>

        {/* Nav, grouped by category */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-3">
          {groupedNav.map((group) => (
            <div key={group.category}>
              {!collapsed && (
                <div className="px-3 pb-1 text-[10.5px] font-semibold tracking-wide text-[#9CA3AF] uppercase">
                  {group.category}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-[13.5px] font-medium transition relative
                      ${collapsed ? "justify-center" : ""}
                      ${
                        isActive
                          ? "bg-[#2F5FEA]/[0.08] text-[#2F5FEA]"
                          : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#10151F]"
                      }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !collapsed && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[#2F5FEA]" />
                          )}
                          <Icon
                            size={17}
                            strokeWidth={2}
                            className="shrink-0"
                          />
                          {!collapsed && <span>{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: profile + logout + collapse toggle */}
        <div className="border-t border-[#F0F1F3] p-3 space-y-0.5">
          <NavLink
            to="/profile"
            onClick={onCloseMobile}
            title={collapsed ? "My Profile" : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-[13.5px] font-medium transition
              ${collapsed ? "justify-center" : ""}
              ${isActive ? "text-[#2F5FEA] bg-[#2F5FEA]/[0.08]" : "text-[#4B5563] hover:bg-[#F3F4F6]"}`
            }
          >
            <UserCircle size={17} strokeWidth={2} className="shrink-0" />
            {!collapsed && <span>My Profile</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            title={collapsed ? "Log out" : undefined}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-[13.5px] font-medium text-[#EF4444] hover:bg-[#FEF3F2] transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={17} strokeWidth={2} className="shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>

          <button
            onClick={onToggle}
            className={`hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-body text-[12.5px] text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280] transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? (
              <ChevronsRight size={16} />
            ) : (
              <ChevronsLeft size={16} />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

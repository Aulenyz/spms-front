import clsx from "clsx";
import {User} from "../../../domain/model/user/user.ts";

const SidebarUserCard = ({user, collapsed}: { user?: User, collapsed: boolean }) => (
    <div
        className={clsx(
            "border-t border-gray-100 px-4 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200",
            collapsed ? "flex-col gap-2" : "flex-row"
        )}
    >
        <div className="flex items-center gap-3">
            <img
                src={user?.info.image || '/default-avatar.png'}
                alt="User Avatar"
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
            />
            {!collapsed && (
                <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800 leading-tight">
            {user?.info.name || '/default-avatar.png'}
          </span>
                    <span className="text-xs text-gray-500 truncate max-w-[140px]">
           {user?.email || '/default-avatar.png'}
          </span>
                </div>
            )}
        </div>
    </div>
);

export default SidebarUserCard;

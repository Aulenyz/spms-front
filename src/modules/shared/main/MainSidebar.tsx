import {useEffect, useState} from "react";
import {UserService} from "../../../services/user/UserService.ts";
import {User} from "../../../domain/model/user/user.ts";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import SidebarUserCard from "./SidebarUserCard";
import clsx from "clsx";

export const MainSidebar = () => {
    const [user, setUser] = useState<User>();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        UserService.instance
            .current()
            .then(setUser)
    }, []);

    return (
        <aside
            className={clsx(
                "fixed top-0 left-0 h-screen z-[9999] bg-white text-gray-800 flex flex-col justify-between shadow-2xl border-r border-gray-200 transition-all duration-300 ease-in-out",
                collapsed ? "w-[80px] items-center" : "w-[270px]"
            )}
        >

            <SidebarHeader
                organization={user?.organization}
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}/>
            <SidebarMenu collapsed={collapsed}/>
            <SidebarUserCard user={user} collapsed={collapsed}/>
        </aside>
    );
};

export default MainSidebar;

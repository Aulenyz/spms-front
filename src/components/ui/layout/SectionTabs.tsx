import clsx from "clsx";
import {Link} from "react-router-dom";

export type SectionTab = {
    icon?: string;
    label: string;
    to: string;
    active: boolean;
    helper?: string;
};

export const SectionTabs = ({tabs}: { tabs: SectionTab[] }) => {
    return (
        <div className="section-tabs">
            {tabs.map((tab) => (
                <Link key={tab.to} to={tab.to} className={clsx("section-tab", {"section-tab-active": tab.active})}>
                    {tab.icon && <i className={`fa ${tab.icon} text-sm`}/>}
                    <span>{tab.label}</span>
                    {tab.helper && <small>{tab.helper}</small>}
                </Link>
            ))}
        </div>
    );
};

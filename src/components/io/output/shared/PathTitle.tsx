import {RouteLabelMatch} from "../../../../utils/RouteLabelMatch.ts";
import {TruncateText} from "../TruncateText.tsx";

type PathTitleProps = {
    matched?: RouteLabelMatch;
}

export const PathTitle = ({matched}: PathTitleProps) => {
    if (!matched) return null;

    return (
        <span className="flex items-center gap-1 text-sm sm:text-xs font-medium relative top-[3px] truncate whitespace-nowrap">
            <i className="fas fa-angle-right text-xs"/>
            <TruncateText text={matched.label} maxLength={22}/>
        </span>
    );
}
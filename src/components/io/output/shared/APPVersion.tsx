import {version} from '../../../../../package.json';
import clsx from "clsx";

export const APPVersion = (props: { className: string }) => {
    return (
        <div className={clsx(props.className, 'font-normal text-xs')}>
            Version: <span className="font-medium ml-1">{version}</span>
        </div>
    )
};
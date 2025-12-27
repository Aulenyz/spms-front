import {ReactNode} from "react";

interface inputLabelParams {
    labelText?: string;
    value?: string | ReactNode;
}

export const InputLabel = ({labelText, value}: inputLabelParams) => {
    return (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{labelText}</label>
            <label
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100
                whitespace-pre-wrap break-words">
                {value || "- - -"}
            </label>
        </div>
    );
};
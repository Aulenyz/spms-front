import {MouseEvent, useState} from "react";
import {createPortal} from "react-dom";

interface TruncatedTextProps {
    text: string;
    maxLength?: number;
}

export const TruncateText = ({text, maxLength = 30}: TruncatedTextProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState<{ x: number; y: number }>({x: 0, y: 0});
    const isTruncated = text.length > maxLength;

    const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({x: rect.left, y: rect.bottom});
        setIsHovered(true);
    };

    return (
        <div
            className="relative w-fit"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsHovered(false)}
        >

                     <span className="truncate block w-full">
                         {isTruncated ? `${text.substring(0, maxLength)}...` : text}
                     </span>

            {isTruncated && isHovered &&
                createPortal(
                    <div
                        className="fixed z-[9999] bg-white dark:bg-gray-800 text-black dark:text-gray-100 text-xs font-medium px-3 py-1 rounded shadow-lg border border-gray-300 dark:border-gray-700"
                        style={{
                            left: coords.x,
                            top: coords.y + 4,
                        }}
                    >
                        {text}
                    </div>,
                    document.body
                )}
        </div>
    );
};

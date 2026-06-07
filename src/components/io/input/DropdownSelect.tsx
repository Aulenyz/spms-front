import ReactDOM from "react-dom";
import {forwardRef, KeyboardEvent, RefObject, useEffect, useMemo, useRef, useState} from "react";
import clsx from "clsx";
import {SelectOption} from "../output/Select.tsx";
import {Optional, PlainValue, State} from "../../../domain/types/steoreotype.ts";
import {titleCase} from "../../../utils/texts.ts";

interface DropdownSelectProps {
    text: string;
    hasError: boolean;
    value?: PlainValue;
    options: SelectOption[];
    onSelect: (value: Optional<PlainValue>) => void;
    className?: string;
    portal?: boolean;
}

export const DropdownSelect = forwardRef<HTMLInputElement, DropdownSelectProps>(
    ({options, onSelect, value, hasError, className, text, portal = false}: DropdownSelectProps, inputRef) => {
        const [isOpen, setIsOpen]: State<boolean> = useState(false);
        const dropdownRef: RefObject<HTMLDivElement> = useRef(null);
        const listRef: RefObject<HTMLUListElement> = useRef(null);
        const localInputRef = useRef<HTMLInputElement | null>(null);
        const [highlightedIndex, setHighlightedIndex]: State<number> = useState(-1);
        const [portalRect, setPortalRect] = useState<{left: number; top: number; width: number; opensUp: boolean} | null>(null);

        const selectedLabel = useMemo(() => {
            if (value === undefined || value === null) return "";
            const selected = options.find(
                (option) => String(option.value).toLowerCase() === String(value).toLowerCase()
            );
            return selected?.description ?? "";
        }, [value, options]);

        const handleOptionClick = (option: SelectOption) => {
            setIsOpen(false);
            onSelect(option.value);
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInInput = dropdownRef.current?.contains(target);
            const clickedInList = listRef.current?.contains(target);
            if (!clickedInInput && !clickedInList) {
                setIsOpen(false);
            }
        };

        useEffect(() => {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        useEffect(() => setHighlightedIndex(-1), [options]);

        const syncPortalPosition = () => {
            const element = localInputRef.current;
            if (!element) return;
            const rect = element.getBoundingClientRect();
            const estimatedHeight = Math.min(320, Math.max(96, options.length * 44 + 12));
            const opensUp = window.innerHeight - rect.bottom < estimatedHeight + 16 && rect.top > estimatedHeight;
            setPortalRect({
                left: rect.left,
                top: opensUp ? rect.top - estimatedHeight - 8 : rect.bottom + 8,
                width: rect.width,
                opensUp,
            });
        };

        useEffect(() => {
            if (!portal || !isOpen) return;
            syncPortalPosition();
            const handle = () => syncPortalPosition();
            window.addEventListener("scroll", handle, true);
            window.addEventListener("resize", handle);
            return () => {
                window.removeEventListener("scroll", handle, true);
                window.removeEventListener("resize", handle);
            };
        }, [portal, isOpen]);

        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
            if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                setIsOpen(true);
                return;
            }

            if (!isOpen) return;

            if (event.key === "Escape") {
                event.preventDefault();
                setIsOpen(false);
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex((prev) => Math.max(prev - 1, 0));
            }

            if (event.key === "Enter" && highlightedIndex >= 0) {
                event.preventDefault();
                handleOptionClick(options[highlightedIndex]);
            }
        };

        return (
            <div className="relative w-full" ref={dropdownRef}>
                <div>
                    <input
                        ref={(node) => {
                            localInputRef.current = node;
                            if (typeof inputRef === "function") inputRef(node);
                            else if (inputRef) (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
                        }}
                        type="text"
                        readOnly
                        value={selectedLabel}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        onClick={() => setIsOpen((prev) => !prev)}
                        className={clsx("input select select-sm search-select-input cursor-pointer", className, {
                            "border-red-500": hasError,
                        })}
                        placeholder={text}
                    />
                </div>

                {isOpen &&
                    (portal ? (
                        ReactDOM.createPortal(
                            <ul
                                ref={listRef}
                                className="search-select-dropdown z-[9999]"
                                style={{
                                    position: "fixed",
                                    left: portalRect?.left ?? 0,
                                    top: portalRect?.top ?? 0,
                                    width: portalRect?.width ?? undefined,
                                    maxHeight: "min(50vh, 320px)",
                                }}
                            >
                                {options.length > 0 ? (
                                    options.map((option, index) => (
                                        <li
                                            key={String(option.value ?? option.description ?? index)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            onClick={() => handleOptionClick(option)}
                                            className={clsx("search-select-option cursor-pointer", {
                                                "search-select-option-active": index === highlightedIndex,
                                            })}
                                        >
                                            {titleCase(option.description)}
                                        </li>
                                    ))
                                ) : (
                                    <li className="search-select-option">No hay opciones disponibles</li>
                                )}
                            </ul>,
                            document.body
                        )
                    ) : (
                        <ul ref={listRef} className="search-select-dropdown" style={{maxHeight: "min(50vh, 320px)"}}>
                            {options.length > 0 ? (
                                options.map((option, index) => (
                                    <li
                                        key={String(option.value ?? option.description ?? index)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onClick={() => handleOptionClick(option)}
                                        className={clsx("search-select-option cursor-pointer", {
                                            "search-select-option-active": index === highlightedIndex,
                                        })}
                                    >
                                        {titleCase(option.description)}
                                    </li>
                                ))
                            ) : (
                                <li className="search-select-option">No hay opciones disponibles</li>
                            )}
                        </ul>
                    ))}
            </div>
        );
    }
);

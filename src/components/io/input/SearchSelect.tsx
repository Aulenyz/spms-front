import ReactDOM from "react-dom";
import {ChangeEvent, forwardRef, KeyboardEvent, RefObject, useEffect, useRef, useState} from "react";
import clsx from "clsx";
import {SelectOption} from "../output/Select.tsx";
import {nonNil, Optional, PlainValue, State} from "../../../domain/types/steoreotype.ts";
import {titleCase} from "../../../utils/texts.ts";

interface SearchableSelectProps {
    text: string;
    hasError: boolean;
    value?: PlainValue;
    options: SelectOption[];
    onSearch?: (criteria: string) => void;
    onSelect: (value: Optional<PlainValue>) => void;
    className?: string;
    portal?: boolean;
}

export const SearchSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(
    (props: SearchableSelectProps, inputRef) => {
        const {options, onSelect, onSearch, value, hasError, className, text, portal = false} = props;
        const [isFirst, setIsFirst]: State<boolean> = useState(true);
        const [isOpen, setIsOpen]: State<boolean> = useState(false);
        const [searchTerm, setSearchTerm]: State<string> = useState('');
        const dropdownRef: RefObject<HTMLDivElement> = useRef(null);
        const listRef: RefObject<HTMLUListElement> = useRef(null);
        const localInputRef = useRef<HTMLInputElement | null>(null);
        const [portalRect, setPortalRect] = useState<{left: number; top: number; width: number} | null>(null);
        const [highlightedIndex, setHighlightedIndex]: State<number> = useState(-1);

        const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
            const term = event.target.value;
            setIsFirst(false);
            setSearchTerm(term);
            onSearch?.(term);
            if (!term.trim()) onSelect(undefined);
            setHighlightedIndex(-1);
        };

        const handleOptionClick = (option: SelectOption) => {
            setSearchTerm(option.description);
            setIsOpen(false);
            onSelect(option.value);
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!dropdownRef.current?.contains(target) && !listRef.current?.contains(target)) {
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

        useEffect(() => {
            if (value && isFirst) {
                const selected = options.find(
                    o => o.value?.toString().toLowerCase() === value?.toString().toLowerCase()
                );
                setSearchTerm(selected?.description ?? '');
            }
        }, [value, options]);

        const syncPortalPosition = () => {
            const element = localInputRef.current;
            if (!element) return;
            const rect = element.getBoundingClientRect();
            setPortalRect({left: rect.left, top: rect.bottom + 8, width: rect.width});
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
            if (!isOpen) {
                setIsOpen(true);
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
            }

            if (event.key === "Enter" && nonNil(highlightedIndex) && highlightedIndex >= 0) {
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
                        value={searchTerm}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        className={clsx("input select select-sm search-select-input", className, {
                            "border-red-500": hasError,
                        })}
                        placeholder={text}
                    />
                </div>

                {isOpen && (portal ? ReactDOM.createPortal(
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
                                    onClick={() => handleOptionClick(option)}
                                    className={clsx("search-select-option cursor-pointer", {
                                        "search-select-option-active": index === highlightedIndex,
                                    })}
                                >
                                    {titleCase(option.description)}
                                </li>
                            ))
                        ) : (
                            <li className="search-select-option">
                                No hay opciones disponibles
                            </li>
                        )}
                    </ul>,
                    document.body
                ) : (
                    <ul ref={listRef} className="search-select-dropdown" style={{maxHeight: "min(50vh, 320px)"}}>
                        {options.length > 0 ? (
                            options.map((option, index) => (
                                <li
                                    key={String(option.value ?? option.description ?? index)}
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

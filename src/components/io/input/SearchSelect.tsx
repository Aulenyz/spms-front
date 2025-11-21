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
}

export const SearchSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(
    (props: SearchableSelectProps, inputRef) => {
        const {options, onSelect, onSearch, value, hasError, className, text} = props;
        const [isFirst, setIsFirst]: State<boolean> = useState(true);
        const [isOpen, setIsOpen]: State<boolean> = useState(false);
        const [searchTerm, setSearchTerm]: State<string> = useState('');
        const dropdownRef: RefObject<HTMLDivElement> = useRef(null);
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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
            <div className={clsx("relative w-full", className)} ref={dropdownRef}>
                <div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        className={clsx("w-full py-2 px-3 focus:outline-none rounded-lg select-sm bg-transparent", {
                            'border-red-500': hasError,
                            'border-gray-300': !hasError
                        })}
                        placeholder={text}
                    />
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <ul className={clsx("absolute left-0 w-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg",
                        "max-h-60 sm:max-h-72 md:max-h-80 overflow-y-auto"
                    )}
                        style={{
                            maxHeight: "min(50vh, 320px)"
                        }}
                    >
                        {options.length > 0 ? (
                            options.map((option, index) => (
                                <li key={String(option.value ?? option.description ?? index)}
                                    onClick={() => handleOptionClick(option)}
                                    className={clsx("px-4 py-2 cursor-pointer text-sm hover:bg-blue-100",
                                        {"bg-blue-100": index === highlightedIndex}
                                    )}>
                                    {titleCase(option.description)}
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-2 text-gray-500 text-sm">
                                No hay opciones disponibles
                            </li>
                        )}
                    </ul>
                )}
            </div>
        );
    }
);

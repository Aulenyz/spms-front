import {ChangeEvent, forwardRef, KeyboardEvent, RefObject, useEffect, useRef, useState} from "react";
import {nonNil, Optional, PlainValue, SelectOption, State} from "../../../domain/types/steoreotype.ts";
import clsx from "clsx";
import {titleCase} from "../../../utils/texts.ts";

interface SearchableSelectProps {
    hasError: boolean;
    value?: PlainValue;
    options: SelectOption[];
    onSearch?: (criteria: string) => void;
    onSelect: (value: Optional<PlainValue>) => void;
}

export const SearchSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(
    (props: SearchableSelectProps, inputRef) => {
        const {options, onSelect, onSearch, value, hasError} = props;
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
            <div className="relative w-full" ref={dropdownRef}>
                <div className={clsx(
                    "flex items-center w-full border rounded-lg input bg-transparent text-md",
                    {
                        'border-red-500': hasError,
                        'hover:border-red-500': hasError,
                        'focus-within:border-blue-500': !hasError,
                    }
                )}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        className={clsx("w-full py-2 px-3 focus:outline-none rounded-lg", {
                            'border-red-500': hasError
                        })}
                        placeholder="Seleccione..."
                    />
                    <i className="fa fa-angle-down text-gray-400 px-2"/>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <ul
                        className={clsx(
                            "absolute left-0 w-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg",
                            "max-h-60 sm:max-h-72 md:max-h-80 overflow-y-auto"
                        )}
                        style={{
                            maxHeight: "min(50vh, 320px)" // Seguridad adicional para evitar overflow en pantallas muy pequeñas
                        }}
                    >
                        {options.length > 0 ? (
                            options.map((option, index) => (
                                <li
                                    key={String(option.value ?? option.description ?? index)}
                                    onClick={() => handleOptionClick(option)}
                                    className={clsx(
                                        "px-4 py-2 cursor-pointer text-sm hover:bg-blue-100",
                                        {"bg-blue-100": index === highlightedIndex}
                                    )}
                                >
                                    {titleCase(option.description)}
                                </li>
                            ))
                        ) : (<li className="px-4 py-2 text-gray-500 text-sm">
                            No hay opciones disponibles
                        </li>)}
                    </ul>
                )}
            </div>
        );
    }
);

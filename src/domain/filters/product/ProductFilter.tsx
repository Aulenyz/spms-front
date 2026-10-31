import {useCallback, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {Pagination} from "../Page.ts";
import {
    ProductStatus,
    ProductStatusLabel,
    RecurrenceType,
} from "../../model/product/Product.ts";
import {ProductCategoryService} from "../../../services/product/ProductCategoryService.ts";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
import {PRODUCT_FILTER_DEFAULTS, ProductFilterValues} from "./productFilterDefaults.ts";

export type {ProductFilterValues} from "./productFilterDefaults.ts";

const productCategoryService = ProductCategoryService.instance;

const statusOptions: SelectOption[] = [
    {value: "", description: "Todos"},
    ...Object.values(ProductStatus).map((status) => ({value: status, description: ProductStatusLabel[status]})),
];

const chargeModeOptions: SelectOption[] = [
    {value: "", description: "Todos"},
    {value: RecurrenceType.NONE, description: "Pago único"},
    {value: RecurrenceType.MONTHLY, description: "Recurrente"},
];

export const ProductFilter = ({
    onFilter,
}: {
    onFilter: (filters: ProductFilterValues, pagination: Pick<Pagination, "field" | "order">) => void;
}) => {
    const [categoryTerm, setCategoryTerm] = useState("");
    const [values, setValues] = useState<ProductFilterValues>(PRODUCT_FILTER_DEFAULTS);

    const {data: categoryPage} = useQuery({
        queryKey: [...queryKeys.categories.all, "search", {term: categoryTerm, active: true}],
        queryFn: ({signal}) => productCategoryService.withSignal(signal).search({term: categoryTerm, active: true}, Pagination.ofSize(12)),
        meta: {silent: true},
    });
    const categoryOptions: SelectOption[] = useMemo(() => (categoryPage?.content ?? []).map((category) => ({
        value: category.id ?? category.code,
        description: `${category.code} · ${category.name}`,
    })), [categoryPage]);

    const emit = useCallback(
        (next: ProductFilterValues) => onFilter(next, {field: next.field, order: next.order}),
        [onFilter],
    );
    useFilterEmitter(values, emit, 300);

    const setField = <K extends keyof ProductFilterValues>(key: K, value: ProductFilterValues[K]) => {
        setValues((current) => ({...current, [key]: value}));
    };

    // Mismo diseño que los filtros de Estudiantes: desplegables compactos y búsqueda en una fila.
    return (
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <DropdownSelect text="Estado" hasError={false} value={values.status ?? ""} options={statusOptions} portal
                                onSelect={(value) => setField("status", (value || undefined) as ProductStatus | undefined)}/>
            </div>
            <div className="w-full sm:w-[160px]">
                <SearchSelect text="Categoría" hasError={false} value={values.categoryId} options={categoryOptions} portal
                              onSearch={setCategoryTerm}
                              onSelect={(value) => setField("categoryId", value ? Number(value) : undefined)}/>
            </div>
            <div className="w-full sm:w-[140px]">
                <DropdownSelect text="Cobro" hasError={false} value={values.chargeMode ?? ""} options={chargeModeOptions} portal
                                onSelect={(value) => setField("chargeMode", (value || undefined) as RecurrenceType | undefined)}/>
            </div>
            <label className="input input-sm w-full sm:w-56">
                <i className="fa fa-search me-1"/>
                <input type="text" value={values.term} placeholder="Nombre o código"
                       onChange={(event) => setField("term", event.target.value)}/>
            </label>
        </form>
    );
};

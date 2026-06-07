import {useEffect, useState} from "react";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {Pagination, SortOrder} from "../Page.ts";
import {
    ProductStatus,
    ProductStatusLabel,
    ProductType,
    ProductTypeLabel,
    RecurrenceType,
    RecurrenceTypeLabel,
} from "../../model/product/Product.ts";
import {ProductCategoryService} from "../../../services/product/ProductCategoryService.ts";

export type ProductFilterValues = {
    term: string;
    status?: ProductStatus;
    type?: ProductType;
    categoryId?: number;
    chargeMode?: RecurrenceType;
    field: string;
    order: SortOrder;
};

const productCategoryService = ProductCategoryService.instance;

const statusOptions: SelectOption[] = [
    {value: "", description: "Todos los estados"},
    ...Object.values(ProductStatus).map((status) => ({value: status, description: ProductStatusLabel[status]})),
];

const typeOptions: SelectOption[] = [
    {value: "", description: "Todos los tipos"},
    ...Object.values(ProductType).map((type) => ({value: type, description: ProductTypeLabel[type]})),
];

const chargeModeOptions: SelectOption[] = [
    {value: "", description: "Todas las modalidades"},
    ...Object.values(RecurrenceType).map((chargeMode) => ({
        value: chargeMode,
        description: RecurrenceTypeLabel[chargeMode],
    })),
];

const sortFieldOptions: SelectOption[] = [
    {value: "id", description: "Registro"},
    {value: "name", description: "Nombre"},
    {value: "code", description: "Código"},
    {value: "price", description: "Precio"},
    {value: "status", description: "Estado"},
    {value: "type", description: "Tipo"},
];

const sortOrderOptions: SelectOption[] = [
    {value: SortOrder.ASC, description: "Ascendente"},
    {value: SortOrder.DESC, description: "Descendente"},
];

export const ProductFilter = ({
    onFilter,
}: {
    onFilter: (filters: ProductFilterValues, pagination: Pick<Pagination, "field" | "order">) => void;
}) => {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
    const [values, setValues] = useState<ProductFilterValues>({
        term: "",
        status: ProductStatus.ACTIVE,
        field: "id",
        order: SortOrder.DESC,
    });

    const searchCategories = (term: string) => {
        productCategoryService
            .search({term, active: true}, Pagination.ofSize(12))
            .then((page) => setCategoryOptions(page.content.map((category) => ({
                value: category.id ?? category.code,
                description: `${category.code} · ${category.name}`,
            }))))
            .catch(() => setCategoryOptions([]));
    };

    useEffect(() => {
        searchCategories("");
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            onFilter(values, {field: values.field, order: values.order});
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [onFilter, values]);

    const setField = <K extends keyof ProductFilterValues>(key: K, value: ProductFilterValues[K]) => {
        setValues((current) => ({...current, [key]: value}));
    };

    const clear = () => {
        setValues({
            term: "",
            status: ProductStatus.ACTIVE,
            field: "id",
            order: SortOrder.DESC,
        });
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex flex-wrap items-end gap-2.5">
                <div className="w-full sm:w-[360px]">
                    <label className="input input-sm flex w-full items-center gap-2">
                        <i className="fa fa-magnifying-glass text-xs"/>
                        <input
                            value={values.term}
                            onChange={(event) => setField("term", event.target.value)}
                            placeholder="Buscar por nombre, código o descripción..."
                        />
                    </label>
                </div>

                <div className="ml-auto flex flex-wrap items-end gap-2.5">
                    <div className="w-full sm:w-[260px]">
                        <SearchSelect
                            text="Buscar categoría"
                            hasError={false}
                            value={values.categoryId}
                            options={categoryOptions}
                            onSearch={searchCategories}
                            onSelect={(value) => setField("categoryId", value ? Number(value) : undefined)}
                            portal
                        />
                    </div>

                    <div className="w-full sm:w-[170px]">
                        <DropdownSelect
                            text="Estado"
                            hasError={false}
                            value={values.status ?? ""}
                            onSelect={(value) => setField("status", (value || undefined) as ProductStatus | undefined)}
                            options={statusOptions}
                            portal
                        />
                    </div>

                    <button type="button" className="btn btn-sm" onClick={clear}>
                        <i className="fa fa-rotate-left"/>
                        Limpiar
                    </button>

                    <button type="button" className="btn btn-sm btn-light" onClick={() => setAdvancedOpen((open) => !open)}>
                        <i className="fa fa-sliders"/>
                        Más filtros
                        <i className={`fa ${advancedOpen ? "fa-chevron-up" : "fa-chevron-down"} text-[10px]`}/>
                    </button>
                </div>
            </div>

            {advancedOpen && (
                <div
                    className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <div>
                        <span className="mb-1.5 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Tipo</span>
                        <DropdownSelect
                            text="Todos los tipos"
                            hasError={false}
                            value={values.type ?? ""}
                            onSelect={(value) => setField("type", (value || undefined) as ProductType | undefined)}
                            options={typeOptions}
                            portal
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Modalidad de cobro</span>
                        <DropdownSelect
                            text="Todas las modalidades"
                            hasError={false}
                            value={values.chargeMode ?? ""}
                            onSelect={(value) => setField("chargeMode", (value || undefined) as RecurrenceType | undefined)}
                            options={chargeModeOptions}
                            portal
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Ordenar por</span>
                        <DropdownSelect
                            text="Campo"
                            hasError={false}
                            value={values.field}
                            onSelect={(value) => setField("field", String(value ?? "id"))}
                            options={sortFieldOptions}
                            portal
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Dirección</span>
                        <DropdownSelect
                            text="Orden"
                            hasError={false}
                            value={values.order}
                            onSelect={(value) => setField("order", value as SortOrder)}
                            options={sortOrderOptions}
                            portal
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

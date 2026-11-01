import {useCallback, useState} from "react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {ProductFilter, ProductFilterValues} from "../../../domain/filters/product/ProductFilter.tsx";
import {PRODUCT_FILTER_DEFAULTS} from "../../../domain/filters/product/productFilterDefaults.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {Product} from "../../../domain/model/product/Product.ts";
import {ProductSearchFilters, ProductService} from "../../../services/product/ProductService.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {ProductTable} from "./ProductTable.tsx";
import {ProductActions} from "./ProductActions.tsx";
import {ProductForm} from "./ProductForm.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";

const productService = ProductService.instance;
const EMPTY_PAGE: Page<Product> = Pagination.empty<Product>();
const EMPTY_COUNTS: Record<string, number> = {};

export const ListProductPage = () => {
    const {hasAuthority} = useAuthContext();
    const canEdit = hasAuthority(AuthorityKey.CATALOG_EDIT);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    // Deben coincidir con PRODUCT_FILTER_DEFAULTS: el filtro no emite su valor inicial.
    const [pagination, setPagination] = useState<Pagination>({
        ...Pagination.ofSize(5),
        field: PRODUCT_FILTER_DEFAULTS.field,
        order: PRODUCT_FILTER_DEFAULTS.order,
    });
    const [filters, setFilters] = useState<ProductSearchFilters>({
        term: PRODUCT_FILTER_DEFAULTS.term,
        status: PRODUCT_FILTER_DEFAULTS.status,
    });
    const {data: statusCounts = EMPTY_COUNTS} = useQuery({
        queryKey: queryKeys.products.totals,
        queryFn: ({signal}) => productService.withSignal(signal).grouped(),
        meta: {silent: true},
    });

    const productsQuery = useQuery({
        queryKey: queryKeys.products.list({filters, pagination}),
        queryFn: ({signal}) => productService.withSignal(signal).search(filters, pagination),
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar los conceptos de pago."},
    });
    const products: Page<Product> = productsQuery.data ?? EMPTY_PAGE;
    // Spinner en la carga inicial y al cambiar filtros/página (no en refrescos en segundo plano).
    const loading: boolean = productsQuery.isPending || (productsQuery.isFetching && productsQuery.isPlaceholderData);

    const handleFilters = useCallback((values: ProductFilterValues, sort: Pick<Pagination, "field" | "order">) => {
        setFilters({
            term: values.term,
            status: values.status,
            type: values.type,
            categoryId: values.categoryId,
            chargeMode: values.chargeMode,
        });
        setPagination((current) => ({...current, ...sort, page: 0}));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Conceptos de pago"
                description="Lo que el colegio cobra a sus estudiantes: inscripción, mensualidades, transporte, libros y más, con su precio y cómo se cobra."
            />

            <ProductActions counts={statusCounts} onExport={() => productService.exportExcel(filters)}
                            onCreate={canEdit ? () => setShowForm(true) : undefined}/>

            <DataTableCard
                title="Conceptos registrados"
                description="Abre un concepto para ver su detalle, cambiar su precio o editar cómo se cobra."
                filters={<ProductFilter onFilter={handleFilters}/>}
                footer={!loading ? (
                    <Pager
                        page={products}
                        onChange={(page) => setPagination((current) => ({...current, page}))}
                        onPageSizeChange={(size) => setPagination((current) => ({...current, page: 0, size}))}
                        pageSizeOptions={[5, 10, 20, 50]}
                    />
                ) : undefined}
            >
                <LoadingContent loading={loading} className="min-h-[280px]">
                    {products.content.length === 0 ? (
                        <EmptyState
                            title="No hay conceptos para mostrar"
                            description="Ajusta los filtros o crea un concepto nuevo."
                            icon="fa-box-open"
                        />
                    ) : (
                        <ProductTable products={products.content}/>
                    )}
                </LoadingContent>
            </DataTableCard>

            <RightModal title="Nuevo concepto de pago" isOpen={showForm} onClose={() => setShowForm(false)}
                        className="h-full w-[460px] z-[9999]">
                <ProductForm onDone={() => setShowForm(false)}
                             onSaved={(saved) => {
                                 void queryClient.invalidateQueries({queryKey: queryKeys.products.all});
                                 navigate(`/catalog/products/${saved.id}`);
                             }}/>
            </RightModal>
        </div>
    );
};

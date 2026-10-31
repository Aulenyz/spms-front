import {useCallback, useState} from "react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {toast} from "react-toastify";
import {ProductCategoryFilter} from "../../../domain/filters/product/ProductCategoryFilter.tsx";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {ProductCategory} from "../../../domain/model/product/ProductCategory.ts";
import {ProductCategoryService, ProductCategorySearchFilters} from "../../../services/product/ProductCategoryService.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {ProductCategoryCard} from "./ProductCategoryCard.tsx";
import {ProductCategoryActions} from "./ProductCategoryActions.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ProductCategoryForm} from "./ProductCategoryForm.tsx";

const productCategoryService = ProductCategoryService.instance;
const EMPTY_PAGE: Page<ProductCategory> = Pagination.empty<ProductCategory>();
const EMPTY_COUNTS: Record<string, number> = {};

const getApiErrorMessage = (error: unknown) => {
    if (typeof error !== "object" || error === null) return null;
    const message = (error as {message?: unknown}).message;
    return typeof message === "string" && message.trim() ? message : null;
};

export const ListProductCategoryPage = () => {
    const [pagination, setPagination] = useState(Pagination.ofSize(6));
    const [filters, setFilters] = useState<ProductCategorySearchFilters>({term: "", active: true});
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<ProductCategory | null>(null);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const queryClient = useQueryClient();
    const {data: statusCounts = EMPTY_COUNTS} = useQuery({
        queryKey: queryKeys.categories.totals,
        queryFn: ({signal}) => productCategoryService.withSignal(signal).grouped(),
        meta: {silent: true},
    });

    const categoriesQuery = useQuery({
        queryKey: queryKeys.categories.list({filters, pagination}),
        queryFn: ({signal}) => productCategoryService.withSignal(signal).search(filters, pagination),
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar las categorías de recursos."},
    });
    const categories: Page<ProductCategory> = categoriesQuery.data ?? EMPTY_PAGE;
    // Spinner en la carga inicial y al cambiar filtros/página (no en refrescos en segundo plano).
    const loading: boolean = categoriesQuery.isPending || (categoriesQuery.isFetching && categoriesQuery.isPlaceholderData);
    const refresh = () => void queryClient.invalidateQueries({queryKey: queryKeys.categories.all});

    const handleFilters = useCallback((nextFilters: Record<string, string>) => {
        setFilters({
            term: nextFilters.term ?? "",
            active: nextFilters.active === "" ? undefined : nextFilters.active === "true",
        });
        setPagination((current) => ({...current, page: 0}));
    }, []);

    const handleEdit = async (category: ProductCategory) => {
        if (!category.id || category.isSystem || loadingEdit) return;
        setLoadingEdit(true);
        try {
            setEditing(await productCategoryService.getCategory(category.id));
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo cargar la categoría.");
        } finally {
            setLoadingEdit(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Categorías"
                description="Clasifica los recursos escolares y distingue las categorías protegidas definidas por el sistema."
            />

            <ProductCategoryActions counts={statusCounts} onCreate={() => setShowCreate(true)}/>

            <DataTableCard
                title="Categorías del catálogo"
                description="Consulta y organiza las agrupaciones disponibles para los recursos de la institución."
                filters={<ProductCategoryFilter onFilter={handleFilters}/>}
                footer={!loading ? (
                    <Pager
                        onChange={(page) => setPagination((current) => ({...current, page}))}
                        onPageSizeChange={(size) => setPagination((current) => ({...current, page: 0, size}))}
                        pageSizeOptions={[3, 6, 9, 12]}
                        page={categories}
                    />
                ) : undefined}
            >
                <LoadingContent loading={loading} className="min-h-[260px]">
                    {categories.content.length === 0 ? (
                        <EmptyState
                            title="No hay categorías para mostrar"
                            description="Ajusta los filtros para encontrar otras categorías de recursos."
                            icon="fa-folder-open"
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {categories.content.map((category) => (
                                <ProductCategoryCard
                                    key={category.id ?? category.code}
                                    category={category}
                                    onEdit={handleEdit}
                                />
                            ))}
                        </div>
                    )}
                </LoadingContent>
            </DataTableCard>

            <LeftModal
                title="Nueva categoría"
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                className="w-[420px] h-full z-[9999]"
            >
                <ProductCategoryForm
                    onDone={() => setShowCreate(false)}
                    onSaved={refresh}
                />
            </LeftModal>

            <LeftModal
                title="Editar categoría"
                isOpen={Boolean(editing)}
                onClose={() => setEditing(null)}
                className="w-[420px] h-full z-[9999]"
            >
                <ProductCategoryForm
                    initial={editing}
                    onDone={() => setEditing(null)}
                    onSaved={refresh}
                />
            </LeftModal>
        </div>
    );
};

import {useCallback, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {ProductFilter, ProductFilterValues} from "../../../domain/filters/product/ProductFilter.tsx";
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

const productService = ProductService.instance;

export const ListProductPage = () => {
    const [pagination, setPagination] = useState(Pagination.ofSize(5));
    const [filters, setFilters] = useState<ProductSearchFilters>({});
    const [products, setProducts] = useState<Page<Product>>(Pagination.empty<Product>());
    const [loading, setLoading] = useState(true);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        productService
            .grouped()
            .then(setStatusCounts)
            .catch(() => setStatusCounts({}));
    }, []);

    useEffect(() => {
        let activeRequest = true;
        setLoading(true);
        productService
            .search(filters, pagination)
            .then((page) => {
                if (activeRequest) setProducts(page);
            })
            .catch((error) => {
                if (!activeRequest) return;
                setProducts(Pagination.empty<Product>());
                toast.error((error as {message?: string})?.message || "No se pudieron cargar los recursos.");
            })
            .finally(() => {
                if (activeRequest) setLoading(false);
            });
        return () => {
            activeRequest = false;
        };
    }, [filters, pagination]);

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

    const exportProducts = async () => {
        try {
            await productService.export(filters);
        } catch (error) {
            toast.error((error as {message?: string})?.message || "No se pudo exportar el listado de recursos.");
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Listado de recursos"
                description="Consulta recursos registrados, revisa precios, impuestos y modalidades de cobro sin perder contexto."
            />

            <ProductActions counts={statusCounts} onExport={exportProducts}/>

            <section
                className="rounded-[24px] border p-4 sm:p-5"
                style={{
                    borderColor: "var(--border-soft)",
                    background: "var(--surface)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                <ProductFilter onFilter={handleFilters}/>
            </section>

            <DataTableCard
                title="Recursos registrados"
                description="Consulta la información principal y expande cada fila para revisar datos adicionales."
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
                            title="No hay recursos para mostrar"
                            description="Ajusta los filtros para consultar otros recursos."
                            icon="fa-box-open"
                        />
                    ) : (
                        <ProductTable products={products.content}/>
                    )}
                </LoadingContent>
            </DataTableCard>
        </div>
    );
};

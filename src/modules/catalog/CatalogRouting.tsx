import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListProductCategoryPage = lazyPage(() => import("./category/ListProductCategoryPage.tsx"), "ListProductCategoryPage");
const ListProductPage = lazyPage(() => import("./product/ListProductPage.tsx"), "ListProductPage");
const ProductDetailsPage = lazyPage(() => import("./product/ProductDetailsPage.tsx"), "ProductDetailsPage");

export const CatalogRouting = () => {
    return (
        <Routes>
            <Route path="products" element={<ListProductPage/>}/>
            <Route path="products/:id" element={<ProductDetailsPage/>}/>
            <Route path="categories" element={<ListProductCategoryPage/>}/>
            <Route path="*" element={<Navigate to="/catalog/products" replace/>}/>
        </Routes>
    );
};

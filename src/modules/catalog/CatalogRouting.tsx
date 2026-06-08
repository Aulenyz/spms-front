import {Navigate, Route, Routes} from "react-router-dom";
import {CatalogCollectionsPage} from "./CatalogPages.tsx";
import {ListProductCategoryPage} from "./category/ListProductCategoryPage.tsx";
import {ListProductPage} from "./product/ListProductPage.tsx";
import {ProductDetailsPage} from "./product/ProductDetailsPage.tsx";

export const CatalogRouting = () => {
    return (
        <Routes>
            <Route path="products" element={<ListProductPage/>}/>
            <Route path="products/:id" element={<ProductDetailsPage/>}/>
            <Route path="categories" element={<ListProductCategoryPage/>}/>
            <Route path="collections" element={<CatalogCollectionsPage/>}/>
            <Route path="*" element={<Navigate to="/catalog/products" replace/>}/>
        </Routes>
    );
};

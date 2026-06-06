import {Navigate, Route, Routes} from "react-router-dom";
import {CatalogCollectionsPage, CatalogProductsPage} from "./CatalogPages.tsx";
import {ListProductCategoryPage} from "./category/ListProductCategoryPage.tsx";

export const CatalogRouting = () => {
    return (
        <Routes>
            <Route path="products" element={<CatalogProductsPage/>}/>
            <Route path="categories" element={<ListProductCategoryPage/>}/>
            <Route path="collections" element={<CatalogCollectionsPage/>}/>
            <Route path="*" element={<Navigate to="/catalog/products" replace/>}/>
        </Routes>
    );
};

import {Navigate, Route, Routes} from "react-router-dom";
import {CatalogCollectionsPage} from "./CatalogPages.tsx";
import {ListProductCategoryPage} from "./category/ListProductCategoryPage.tsx";
import {ListProductPage} from "./product/ListProductPage.tsx";

export const CatalogRouting = () => {
    return (
        <Routes>
            <Route path="products" element={<ListProductPage/>}/>
            <Route path="categories" element={<ListProductCategoryPage/>}/>
            <Route path="collections" element={<CatalogCollectionsPage/>}/>
            <Route path="*" element={<Navigate to="/catalog/products" replace/>}/>
        </Routes>
    );
};

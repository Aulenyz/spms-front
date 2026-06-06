export interface ProductCategory {
    id?: number;
    code: string;
    name: string;
    active: boolean;
    isSystem: boolean;
    description?: string;
}

export interface ProductCategoryFormValues {
    code: string;
    name: string;
    description: string;
    active: boolean;
}

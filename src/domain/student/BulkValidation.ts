// src/domain/student/BulkValidation.ts

export type BulkValidationType = 'ERROR' | 'WARNING';

export interface BulkValidationItem {
    type: BulkValidationType;
    code: string;
    message: string;
    column: string;
    row: number;
    field: string;
    cell: string;
    foundValue: string;
}

export interface BulkValidationSummary {
    errors: number;
    warnings: number;
    valid: number;
}

export interface BulkValidationResult {
    totalRows: number;
    summary: BulkValidationSummary;
    errors: BulkValidationItem[];
    warnings: BulkValidationItem[];
}

export interface BulkValidationResponse {
    result: BulkValidationResult;
}
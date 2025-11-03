export const useQueryParams = (): Record<string, string> => {
    const result: Record<string, string> = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

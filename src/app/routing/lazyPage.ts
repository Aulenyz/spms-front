import {ComponentType, lazy, LazyExoticComponent} from "react";

/**
 * `React.lazy` para módulos con export nombrado:
 * `const ListStudentPage = lazyPage(() => import("./ListStudentPage.tsx"), "ListStudentPage");`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyPage = <M extends Record<K, ComponentType<any>>, K extends keyof M & string>(
    loader: () => Promise<M>,
    name: K,
): LazyExoticComponent<M[K]> => lazy(() => loader().then((module) => ({default: module[name]})));

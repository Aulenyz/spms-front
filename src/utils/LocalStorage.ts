import {StorageItem} from "../domain/types/StorageItem.ts";
import {Nullable, Optional} from "../domain/types/steoreotype.ts";
import {isNil} from "lodash";

type PlainValue<T> = string | number | boolean | null | T;

export class LocalStorage {

    static set<T>(item: StorageItem, value: PlainValue<T>) {
        localStorage.setItem(item, this.mapValue(value));
    }

    static remove(item: StorageItem) {
        localStorage.removeItem(item);
    }

    static get<T>(item: StorageItem) {
        return this.getValue(localStorage.getItem(item)) as T;
    }

    static getOr<T>(item: StorageItem, orElse: T): T {
        return this.getValue(localStorage.getItem(item), orElse) as T ?? orElse;
    }

    static getObject<T>(item: StorageItem, orElse: any = {}): T {
        const value: Nullable<string> = localStorage.getItem(item);
        return isNil(value) ? orElse as T : this.getJSON(value);
    }

    private static getValue<T>(value: Nullable<string>, orElse: any = undefined): Optional<T> {
        return isNil(value) ? orElse : this.getJSON(value);
    }

    private static getJSON<T>(value: string): T {
        try {
            return JSON.parse(value);
        } catch (e) {
            return value as T;
        }
    }

    private static mapValue<T>(value: PlainValue<T>): string {
        switch (typeof value) {
            case "object":
                return JSON.stringify(value);
            case 'number':
            case 'boolean':
            case 'bigint':
            case 'string':
                return value.toString();
            default :
                return 'undefined';
        }
    }
}
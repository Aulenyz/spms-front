import {Optional} from "../domain/types/steoreotype.ts";
import {isEmpty, isNil} from "lodash";
import {Messages} from "../domain/types/Messages.ts";

const SPACE = ' ';

const LOWER_CASE_WORDS: Array<string> = [
    "a", "ante", "bajo", "con", "contra", "de", "desde", "durante",
    "en", "entre", "hacia", "hasta", "mediante", "para", "por", "según",
    "sin", "sobre", "tras", "el", "la", "los", "las", "un", "una", "unos", "unas",
    "y", "o", "u", "ni", "que"
];

const UPPER_CASE_WORDS: Array<string> = [
    // Formas societarias comunes
    "srl", "eirl", "sa", "sas", "s.a.", "s.a.s", "s.a.s.", "srls", "cxA", "cxa", "ltd", "inc", "corp", "co", "cia",
    // Bancos e instituciones
    "afp", "bco", "ban", "bbva", "bhd", "bpd", "zf", "zfsi", "pbs", "gdlr",
    // Organizaciones
    "ong", "onu", "unicef", "usaid", "ops", "oms", "oca", "oecd", "ue", "uep",
    // Números romanos (comunes en nombres)
    "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx",
    // Otros posibles acrónimos o sufijos
    "jr", "sr", "md", "phd", "mba", "rd", "tv", "fm", "hd"
];


export const titleCase = (text?: string) => {
    return text?.toLowerCase()?.split(SPACE)?.map((word: string, index: number) => {
        if (UPPER_CASE_WORDS.includes(word)) {
            return word.toUpperCase();
        } else if (index === 0 || !LOWER_CASE_WORDS.includes(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1)
        } else {
            return word
        }
    })?.join(SPACE);
};

export const phone = (text?: string, def: string = Messages.Unavailable) => {
    if (isNil(text) || isEmpty(text)) {
        return def;
    }
    // Limpia el valor ingresado
    const cleaned: string = text.replace(/\D/g, '');
    // Validar longitud del número
    if (cleaned.length !== 10) {
        return text;
    }
    // Aplicar formato
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;

}

export const orElse = (value?: string, def: string = Messages.Unavailable) => {
    return isNil(value) || isEmpty(value.trim()) ? def : value.trim();
}

export const imageOr = (image: Optional<string>, seed: Optional<string>) => {
    return image ?? `https://api.dicebear.com/6.x/initials/svg?seed=${seed}`
}

import {useState} from "react";
import clsx from "clsx";

import {initialsOf} from "./detail/DetailHeader.tsx";

/** Foto redonda de una persona; sin foto, o si la foto no carga, sus iniciales. */
export const UserAvatar = ({name, image, className}: {name?: string | null; image?: string | null; className?: string}) => {
    const [failed, setFailed] = useState<string | null>(null);
    const shape = clsx("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", className);
    if (image && failed !== image) {
        return <img src={image} alt="" className={clsx(shape, "object-cover")} onError={() => setFailed(image)}/>;
    }
    return <span className={shape} aria-hidden="true" style={{background: "var(--surface)", color: "var(--accent)"}}>{initialsOf(name)}</span>;
};

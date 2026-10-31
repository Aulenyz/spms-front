import {ReactNode} from "react";
import {Link, LinkProps} from "react-router-dom";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

/** A link only for users who can open its page; for the rest the same content as plain text. */
export const PermittedLink = ({authority, children, ...props}: LinkProps & {authority: AuthorityKey; children: ReactNode}) => {
    const {hasAuthority} = useAuthContext();
    if (hasAuthority(authority)) return <Link {...props}>{children}</Link>;
    return <span className={typeof props.className === "string" ? props.className.replace(/hover:\S+/g, "") : undefined}
                 style={props.style as React.CSSProperties | undefined}>{children}</span>;
};

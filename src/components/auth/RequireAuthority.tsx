import {ReactNode} from "react";
import {Link} from "react-router-dom";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";
import {EmptyState} from "../ui/feedback/EmptyState.tsx";

/**
 * Shows the page only if the user has at least one of the authorities; otherwise explains it. The
 * server checks the same permissions, this only avoids an empty screen full of errors.
 */
export const RequireAuthority = ({authority, children}: {authority: AuthorityKey | AuthorityKey[]; children: ReactNode}) => {
    const {hasAuthority} = useAuthContext();
    const required = Array.isArray(authority) ? authority : [authority];
    if (required.some((key) => hasAuthority(key))) return <>{children}</>;
    return (
        <div className="space-y-4 py-10">
            <EmptyState title="No tienes permiso para ver esta sección" icon="fa-lock"
                        description="Pide a un administrador que te asigne el permiso en tu rol."/>
            <div className="text-center"><Link to="/home" className="btn btn-sm">Ir al inicio</Link></div>
        </div>
    );
};

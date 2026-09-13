import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

export const OrganizationBreadcrumb = ({onCreate}: { onCreate: () => void }) => {
    const {hasAuthority} = useAuthContext();

    return (
        <PageHeader
            title="Gestión de organizaciones"
            description="Gestiona las organizaciones globales disponibles en el sistema desde una pantalla ordenada."
            actions={hasAuthority(AuthorityKey.ORGANIZATION_CREATE) ? (
                <button className="btn btn-sm btn-primary" onClick={onCreate} type="button">
                    <i className="fa fa-plus me-1"/>
                    Nueva organización
                </button>
            ) : undefined}
        />
    );
};

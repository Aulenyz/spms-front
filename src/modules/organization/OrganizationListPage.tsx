import {useCallback, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Organization} from "../../domain/model/organization/Organization.ts";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {TableDetailAction} from "../../components/ui/data/TableDetailAction.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {OrganizationForm} from "./OrganizationForm.tsx";
import {OrganizationBreadcrumb} from "./OrganizationBreadcrumb.tsx";
import {OrganizationFilter} from "../../domain/filters/organization/OrganizationFilter.tsx";

const service = OrganizationAdminService.instance;
export const OrganizationListPage = () => {
    const [pagination, setPagination] = useState(Pagination.first);
    const [organizations, setOrganizations] = useState<Page<Organization>>(Pagination.empty<Organization>());
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const load = () => service.getAll(filters, pagination).then(setOrganizations);
    useEffect(() => { void load(); }, [pagination, filters]);
    const refresh = () => { setShowModal(false); void load(); };
    const handleFilter = useCallback((nextFilters: Record<string, string>) => { setFilters(nextFilters); setPagination((current) => ({...current, page: 0})); }, []);
    return <div className="space-y-6">
        <OrganizationBreadcrumb onCreate={() => setShowModal(true)}/>
        <DataTableCard title="Organizaciones" description="Consulta organizaciones activas e inactivas y administra sus datos." filters={<OrganizationFilter onFilter={handleFilter}/>} footer={<Pager onChange={(page) => setPagination((current) => ({...current, page}))} onPageSizeChange={(size) => setPagination((current) => ({...current, page: 0, size}))} page={organizations}/>}> 
            <table className="table-shell"><thead><tr><th>Organización</th><th>Documento</th><th>Estado</th><th/></tr></thead><tbody>
                {organizations.content.length === 0 && <tr><td colSpan={4}><EmptyState title="No hay organizaciones para mostrar" description="Crea una nueva organización para comenzar." icon="fa-building"/></td></tr>}
                {organizations.content.map((organization) => <tr key={organization.id}><td><Link to={`/organizations/${organization.id}`} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>{organization.logo ? <img src={organization.logo} alt="" className="h-full w-full object-cover"/> : <i className="fa fa-building"/>}</span><strong>{organization.name}</strong></Link></td><td>{organization.document}</td><td><span className={organization.active ? "text-sm font-semibold text-[var(--success)]" : "text-sm font-semibold text-[var(--text-tertiary)]"}><i className={`fa ${organization.active ? "fa-circle-check" : "fa-circle-pause"} me-1`}/>{organization.active ? "Activa" : "Inactiva"}</span></td><td className="text-right"><TableDetailAction to={`/organizations/${organization.id}`} state={{organization}}/></td></tr>)}
            </tbody></table>
        </DataTableCard>
        <LeftModal title="Agregar organización" isOpen={showModal} onClose={refresh} className="w-[400px] h-full z-[9999]"><OrganizationForm initial={null} onSaved={refresh}/></LeftModal>
    </div>;
};

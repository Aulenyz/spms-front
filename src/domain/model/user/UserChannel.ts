/** App (canal) que un administrador habilita usuario por usuario, p. ej. la app de profesores. */
export type UserChannel = {
    key: string;
    name: string;
    description?: string;
    /** El usuario la tiene habilitada en esta organización. */
    granted: boolean;
    /** Su rol tiene el permiso que la app exige (p. ej. docente). */
    eligible: boolean;
};

export type HelpType =
    | "Acceso"
    | "Académico"
    | "Cobros"
    | "Usuarios"
    | "Configuración"
    | "Errores";

export type HelpArea =
    | "General"
    | "Estudiantes"
    | "Cursos"
    | "Padres y tutores"
    | "Cobros"
    | "Usuarios y roles"
    | "Plantillas"
    | "Sistema";

export type HelpArticle = {
    id: string;
    type: HelpType;
    area: HelpArea;
    title: string;
    question: string;
    answer: string;
    solution: string[];
    tags: string[];
};

export const helpTypeOptions: Array<{value: "" | HelpType; description: string}> = [
    {value: "", description: "Todos los tipos"},
    {value: "Acceso", description: "Acceso"},
    {value: "Académico", description: "Académico"},
    {value: "Cobros", description: "Cobros"},
    {value: "Usuarios", description: "Usuarios"},
    {value: "Configuración", description: "Configuración"},
    {value: "Errores", description: "Errores"},
];

export const helpAreaOptions: Array<{value: "" | HelpArea; description: string}> = [
    {value: "", description: "Todas las áreas"},
    {value: "General", description: "General"},
    {value: "Estudiantes", description: "Estudiantes"},
    {value: "Cursos", description: "Cursos"},
    {value: "Padres y tutores", description: "Padres y tutores"},
    {value: "Cobros", description: "Cobros"},
    {value: "Usuarios y roles", description: "Usuarios y roles"},
    {value: "Plantillas", description: "Plantillas"},
    {value: "Sistema", description: "Sistema"},
];

export const helpArticles: HelpArticle[] = [
    {
        id: "change-workspace",
        type: "Acceso",
        area: "General",
        title: "Cambiar de espacio de trabajo",
        question: "¿Cómo cambio de escuela u organización dentro del sistema?",
        answer: "Desde la parte superior puedes abrir el selector del logo del espacio y cambiar al que tengas vinculado.",
        solution: [
            "Pulsa el logo del espacio actual en la parte superior.",
            "Selecciona el nuevo espacio de trabajo del listado.",
            "Espera unos segundos mientras el sistema actualiza la sesión.",
            "Si el nuevo espacio tiene permisos distintos, el menú se ajusta automáticamente.",
        ],
        tags: ["organización", "espacio", "cambio", "permisos"],
    },
    {
        id: "no-dashboard-access",
        type: "Acceso",
        area: "Sistema",
        title: "No tengo acceso al dashboard",
        question: "¿Qué pasa si mi usuario ya no tiene permiso para entrar al dashboard?",
        answer: "La aplicación intenta llevarte a la primera pantalla que sí tengas autorizada.",
        solution: [
            "Vuelve a cargar la aplicación o cambia de espacio de trabajo.",
            "Si tienes permisos en otro módulo, entrarás directamente ahí.",
            "Si no tienes acceso a ninguna pantalla principal, verás una pantalla 403.",
            "Solicita a un administrador que revise los permisos de tu rol si necesitas más acceso.",
        ],
        tags: ["dashboard", "403", "permisos", "roles"],
    },
    {
        id: "student-search-create",
        type: "Académico",
        area: "Estudiantes",
        title: "Buscar o crear un estudiante",
        question: "¿Cómo registro una inscripción si primero necesito elegir al estudiante?",
        answer: "El flujo de inscripción empieza buscando al estudiante por matrícula o nombre y, si no existe, permite crearlo.",
        solution: [
            "En la inscripción, usa el buscador de estudiante con matrícula o nombre.",
            "Selecciona el estudiante cuando aparezca en la lista.",
            "Si no existe, abre el modal lateral para registrarlo.",
            "Después de guardarlo, vuelve al selector y elige el estudiante recién creado.",
        ],
        tags: ["estudiante", "matrícula", "inscripción", "registro"],
    },
    {
        id: "guardian-selection",
        type: "Académico",
        area: "Padres y tutores",
        title: "Asignar padres o tutores",
        question: "¿Cómo agrego uno o varios padres al proceso de cobro o inscripción?",
        answer: "Después de elegir el estudiante, el sistema carga los padres vinculados y también te permite registrar nuevos desde el mismo flujo.",
        solution: [
            "Busca y selecciona el estudiante.",
            "Revisa los padres ya asociados y agrégalos al listado inferior.",
            "Si falta uno, usa el formulario lateral para crear un nuevo padre o tutor.",
            "Confirma que las tarjetas inferiores muestren todos los padres requeridos antes de continuar.",
        ],
        tags: ["guardianes", "padres", "tutores", "inscripción"],
    },
    {
        id: "course-selection",
        type: "Académico",
        area: "Cursos",
        title: "Elegir curso para un estudiante",
        question: "¿Cómo selecciono el curso después de elegir al estudiante?",
        answer: "Luego del estudiante se habilita el selector de curso con búsqueda e infinite scroll.",
        solution: [
            "Primero selecciona un estudiante válido.",
            "Abre el selector de curso y escribe el nombre o división.",
            "Desplázate para cargar más resultados si el curso no aparece de inmediato.",
            "Selecciona el curso correcto antes de seguir al siguiente paso.",
        ],
        tags: ["curso", "estudiante", "selector", "scroll"],
    },
    {
        id: "collection-stepper",
        type: "Cobros",
        area: "Cobros",
        title: "Completar una nueva cobranza",
        question: "¿Qué información debo completar para registrar una cobranza escolar?",
        answer: "El flujo se divide por pasos: estudiante, curso, padres, productos o aportes y revisión final.",
        solution: [
            "Busca y selecciona al estudiante.",
            "Elige el curso correspondiente si el flujo lo requiere.",
            "Agrega uno o varios padres o tutores.",
            "Selecciona productos, aportes o conceptos de cobro.",
            "Revisa el resumen lateral antes de guardar.",
        ],
        tags: ["cobranza", "stepper", "factura", "revisión"],
    },
    {
        id: "subject-management",
        type: "Configuración",
        area: "Cursos",
        title: "Crear o editar materias",
        question: "¿Cómo se administran las materias del sistema?",
        answer: "Las materias se gestionan desde la pantalla de Materias con tarjetas, filtros y un modal lateral.",
        solution: [
            "Ve a Configuración académica > Materias.",
            "Usa el botón de Nueva materia para abrir el formulario.",
            "Completa nombre, código y descripción.",
            "Si necesitas ajustar una existente, usa Editar desde la tarjeta.",
            "Para activar o inactivar una materia, usa la rueda de opciones.",
        ],
        tags: ["materias", "subject", "configuración", "estado"],
    },
    {
        id: "course-template-next-year",
        type: "Configuración",
        area: "Plantillas",
        title: "Plantillas para el próximo año escolar",
        question: "¿Los cambios en plantillas de cursos afectan el próximo año?",
        answer: "Sí. El formulario indica que esos cambios se reflejan en el sistema para el próximo año escolar.",
        solution: [
            "Abre Configuración académica > Cursos.",
            "Crea o edita el curso base que necesitas.",
            "Revisa la nota visible en el formulario antes de guardar.",
            "Coordina con el administrador académico si el próximo período ya fue configurado.",
        ],
        tags: ["plantillas", "curso", "próximo año", "configuración"],
    },
    {
        id: "roles-and-authorities",
        type: "Usuarios",
        area: "Usuarios y roles",
        title: "Asignar permisos a un rol",
        question: "¿Cómo se agregan o quitan permisos a un rol?",
        answer: "En los detalles del rol existe una pestaña de asignaciones donde los permisos se mueven entre listas.",
        solution: [
            "Entra a Gestión de usuarios > Roles.",
            "Abre Detalles del rol que deseas modificar.",
            "Ve a la pestaña de asignaciones.",
            "Arrastra el permiso entre No asignados y Asignados.",
            "Espera la confirmación visual del movimiento antes de salir.",
        ],
        tags: ["roles", "permisos", "asignación", "arrastrar"],
    },
    {
        id: "invite-user-register",
        type: "Usuarios",
        area: "Usuarios y roles",
        title: "Registro por invitación",
        question: "¿Qué debe hacer un usuario invitado para registrarse?",
        answer: "El invitado entra al enlace público de registro y completa sus datos sin iniciar sesión.",
        solution: [
            "Abre el enlace recibido por invitación.",
            "Completa nombres, apellidos, usuario, contraseña, género y documento.",
            "Si el documento es cédula, usa 11 dígitos con formato válido.",
            "Sube la imagen si aplica y confirma el registro.",
        ],
        tags: ["invitación", "registro", "enlace", "usuario"],
    },
    {
        id: "403-access-denied",
        type: "Errores",
        area: "Sistema",
        title: "Pantalla 403: acceso restringido",
        question: "¿Qué significa ver un error 403 dentro del sistema?",
        answer: "Significa que el usuario autenticado no tiene permiso para entrar en esa sección con el espacio actual.",
        solution: [
            "Verifica si estás en el espacio de trabajo correcto.",
            "Cambia de organización desde la parte superior si tienes varias.",
            "Si el problema sigue, solicita a un administrador que revise el rol y los permisos asignados.",
            "Si no necesitas esa sección, usa otra pestaña permitida del menú.",
        ],
        tags: ["403", "permisos", "acceso", "organización"],
    },
    {
        id: "server-unavailable",
        type: "Errores",
        area: "Sistema",
        title: "La aplicación no carga información",
        question: "¿Qué hago si la aplicación no carga o aparece un problema de conexión?",
        answer: "Cuando la aplicación no puede comunicarse correctamente con el sistema, se muestra una pantalla de servicio no disponible.",
        solution: [
            "Confirma si tienes conexión a internet o red interna.",
            "Recarga la página con el botón Reintentar.",
            "Si continúa fallando, valida con el equipo técnico si el sistema está en mantenimiento o si el navegador tiene alguna restricción de acceso.",
            "Escala el caso a un administrador si la incidencia afecta al espacio completo.",
        ],
        tags: ["503", "servidor", "sin conexión", "acceso"],
    },
];

import {ChangeEvent, useMemo, useRef, useState} from "react";
import {toast} from "react-toastify";
import {Link, useNavigate} from "react-router-dom";

import {DropdownSelect} from "../../components/io/input/DropdownSelect.tsx";
import {PasswordInput} from "../../components/io/PasswordInput.tsx";
import {ErrorMessage} from "../../components/io/output/ErrorMessage.tsx";
import {
    DocumentType,
    DocumentTypeLabel,
    DocumentTypeOptions,
    Gender,
    GenderOptions,
    PublicRegisterUserFormValues
} from "../../domain/model/user/user.ts";
import {PublicUserService} from "../../services/public/PublicUserService.ts";
import {PublicFileService} from "../../services/public/PublicFileService.ts";

const publicUserService = PublicUserService.instance;
const publicFileService = PublicFileService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const formatIdCard = (value: string) => {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
};

export const RegisterInvitationForm = ({token}: { token: string }) => {
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | undefined>(undefined);
    const [preview, setPreview] = useState<string>("");
    const [errors, setErrors] = useState<Partial<Record<keyof PublicRegisterUserFormValues, string>>>({});
    const [values, setValues] = useState<PublicRegisterUserFormValues>({
        image: "",
        gender: Gender.MALE,
        token,
        username: "",
        password: "",
        firstname: "",
        lastname: "",
        type: DocumentType.ID_CARD,
        document: "",
    });

    const canSubmit = useMemo(() => {
        const normalizedDocument = values.type === DocumentType.ID_CARD
            ? onlyDigits(values.document)
            : values.document.trim();
        return Boolean(values.image)
            && Boolean(values.firstname.trim())
            && Boolean(values.lastname.trim())
            && Boolean(normalizedDocument)
            && Boolean(values.username.trim())
            && Boolean(values.password.trim())
            && values.firstname.trim().length <= 32
            && values.lastname.trim().length <= 32
            && (values.type === DocumentType.ID_CARD ? normalizedDocument.length === 11 : normalizedDocument.length <= 20)
            && values.username.trim().length <= 32
            && values.password.trim().length <= 60;
    }, [values]);

    const setField = <K extends keyof PublicRegisterUserFormValues>(key: K, value: PublicRegisterUserFormValues[K]) => {
        setValues((prev) => ({...prev, [key]: value}));
        setErrors((prev) => ({...prev, [key]: undefined}));
        setMessage(undefined);
    };

    const validateLocal = () => {
        const nextErrors: Partial<Record<keyof PublicRegisterUserFormValues, string>> = {};
        if (!values.image) nextErrors.image = "La imagen es obligatoria.";
        if (!values.firstname.trim()) nextErrors.firstname = "El nombre es obligatorio.";
        else if (values.firstname.trim().length > 32) nextErrors.firstname = "El nombre no puede exceder 32 caracteres.";
        if (!values.lastname.trim()) nextErrors.lastname = "El apellido es obligatorio.";
        else if (values.lastname.trim().length > 32) nextErrors.lastname = "El apellido no puede exceder 32 caracteres.";
        const normalizedDocument = values.type === DocumentType.ID_CARD
            ? onlyDigits(values.document)
            : values.document.trim();
        if (!normalizedDocument) nextErrors.document = "El numero de documento es obligatorio.";
        else if (values.type === DocumentType.ID_CARD && normalizedDocument.length !== 11) nextErrors.document = "La cedula debe tener 11 digitos.";
        else if (values.type === DocumentType.PASSPORT && normalizedDocument.length > 20) nextErrors.document = "El pasaporte no puede exceder 20 caracteres.";
        if (!values.username.trim()) nextErrors.username = "El usuario es obligatorio.";
        else if (values.username.trim().length > 32) nextErrors.username = "El usuario no puede exceder 32 caracteres.";
        if (!values.password.trim()) nextErrors.password = "La contrasena es obligatoria.";
        else if (values.password.trim().length > 60) nextErrors.password = "La contrasena no puede exceder 60 caracteres.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setErrors((prev) => ({...prev, image: undefined}));
        setMessage(undefined);
        setUploading(true);

        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);

        try {
            const uploaded = await publicFileService.upload(file);
            setField("image", uploaded);
            toast.success("Imagen cargada.");
        } catch (error) {
            setPreview("");
            setField("image", "");
            const apiMessage = getApiErrorMessage(error) ?? "No se pudo cargar la imagen.";
            setMessage(apiMessage);
        } finally {
            setUploading(false);
        }
    };

    const validateRemote = async () => {
        const username = values.username.trim();
        const document = values.type === DocumentType.ID_CARD
            ? onlyDigits(values.document)
            : values.document.trim();

        if (await publicUserService.existsByUsername(username)) {
            setErrors((prev) => ({...prev, username: "Ese nombre de usuario ya esta en uso."}));
            return false;
        }

        if (await publicUserService.existsByDocument(document, values.type, token)) {
            setErrors((prev) => ({...prev, document: `Ese ${DocumentTypeLabel[values.type]} ya esta registrado.`}));
            return false;
        }

        return true;
    };

    const submit = async () => {
        if (submitting || uploading) return;
        if (!validateLocal()) return;

        setSubmitting(true);
        setMessage(undefined);

        try {
            const isRemoteValid = await validateRemote();
            if (!isRemoteValid) return;

            await publicUserService.register({
                ...values,
                firstname: values.firstname.trim(),
                lastname: values.lastname.trim(),
                document: values.type === DocumentType.ID_CARD
                    ? onlyDigits(values.document)
                    : values.document.trim(),
                username: values.username.trim(),
                password: values.password.trim(),
                token,
            });

            toast.success("Registro completado.");
            navigate("/auth/login", {replace: true});
        } catch (error) {
            setMessage(getApiErrorMessage(error) ?? "No se pudo completar el registro.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="auth-minimal-form"
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >

            <div className="space-y-2">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Foto de perfil*
                </label>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
                        onClick={() => fileRef.current?.click()}
                    >
                        {preview ? (
                            <img src={preview} alt="Vista previa" className="h-full w-full object-cover"/>
                        ) : (
                            <i className={uploading ? "fa fa-spinner fa-spin" : "fa fa-camera"} style={{color: "var(--text-secondary)"}}/>
                        )}
                    </button>
                    <div className="min-w-0 flex-1">
                        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                            {uploading ? "Subiendo..." : "Cargar imagen"}
                        </button>
                        <p className="mt-2 text-xs" style={{color: "var(--text-tertiary)"}}>
                            Usa una foto clara para completar el registro.
                        </p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
                </div>
                {errors.image && <p className="mt-1 text-xs font-semibold text-red-500">{errors.image}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                        Nombre*
                    </label>
                    <label className="input input-sm w-full">
                        <i className="fa fa-user me-1"/>
                        <input
                            placeholder="Tu nombre"
                            value={values.firstname}
                            maxLength={32}
                            onChange={(event) => setField("firstname", event.target.value)}
                        />
                    </label>
                    {errors.firstname && <p className="mt-1 text-xs font-semibold text-red-500">{errors.firstname}</p>}
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                        Apellido*
                    </label>
                    <label className="input input-sm w-full">
                        <i className="fa fa-user me-1"/>
                        <input
                            placeholder="Tu apellido"
                            value={values.lastname}
                            maxLength={32}
                            onChange={(event) => setField("lastname", event.target.value)}
                        />
                    </label>
                    {errors.lastname && <p className="mt-1 text-xs font-semibold text-red-500">{errors.lastname}</p>}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[160px,minmax(0,1fr)]">
                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                        Tipo*
                    </label>
                    <DropdownSelect
                        text="Tipo"
                        hasError={Boolean(errors.type)}
                        value={values.type}
                        onSelect={(value) => setField("type", value as DocumentType)}
                        options={DocumentTypeOptions}
                        className="w-full"
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                        Documento*
                    </label>
                    <label className="input input-sm w-full">
                        <i className="fa fa-id-card me-1"/>
                        <input
                            placeholder={values.type === DocumentType.ID_CARD ? "000-0000000-0" : "Numero de pasaporte"}
                            value={values.document}
                            maxLength={values.type === DocumentType.ID_CARD ? 13 : 20}
                            onChange={(event) => {
                                const nextValue = values.type === DocumentType.ID_CARD
                                    ? formatIdCard(event.target.value)
                                    : event.target.value.slice(0, 20);
                                setField("document", nextValue);
                            }}
                        />
                    </label>
                    {errors.document && <p className="mt-1 text-xs font-semibold text-red-500">{errors.document}</p>}
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Genero*
                </label>
                <DropdownSelect
                    text="Seleccionar genero"
                    hasError={Boolean(errors.gender)}
                    value={values.gender}
                    onSelect={(value) => setField("gender", value as Gender)}
                    options={GenderOptions}
                    className="w-full"
                />
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Usuario*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-at me-1"/>
                    <input
                        placeholder="Nombre de usuario"
                        value={values.username}
                        maxLength={32}
                        onChange={(event) => setField("username", event.target.value)}
                    />
                </label>
                {errors.username && <p className="mt-1 text-xs font-semibold text-red-500">{errors.username}</p>}
            </div>

            <div className="space-y-1">
                <PasswordInput
                    label="Contrasena*"
                    name="password"
                    placeholder="Define tu contrasena"
                    value={values.password}
                    maxLength={60}
                    error={errors.password}
                    onChange={(event) => setField("password", event.target.value)}
                />
            </div>

            <button className="btn btn-primary flex justify-center grow" disabled={submitting || uploading || !canSubmit}>
                {submitting ? "Registrando..." : "Completar registro"}
                {(submitting || uploading) && <i className="fa fa-spin fa-spinner"/>}
            </button>

            <Link
                to="/auth/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 transition-colors mt-1"
            >
                <i className="fa fa-arrow-left text-blue-500"></i>
                Ir a iniciar sesion
            </Link>

            <ErrorMessage message={message}/>
        </form>
    );
};

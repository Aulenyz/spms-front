export class Messages {
    static RequiredField: string = 'Este campo es requerido.';
    static PasswordNotMatches: string = 'Las contraseñas deben coincidir.';
    static MinLengthOf8: string = 'Este campo debe tener mas de 8 caracteres.';
    static MinLengthOf20: string = 'Este campo debe tener mas de 20 caracteres.';
    static matchesPassword: string = 'La nueva contraseña no puede ser igual a la actual.';
    static oneMayus: string = 'Debe de contener almenos 1 mayuscula.';
    static oneMin: string = 'Debe de contener almenos 1 minuscula.';
    static Unavailable: string = 'No disponible';
    static LengthOfN = (length: number) => `Este campo debe tener ${length} caracteres o menos.`;
    static InvalidGradeType: string = 'Debe ingresar un tipo de grado.';
}
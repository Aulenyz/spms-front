export interface RecoverPassword {
    token: string;
    password: string;
    repeated: string;
}

export interface SendRecoverRequest {
    username: string;
}
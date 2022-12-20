export interface ICreateChatBody {
    createdAt: string;
    name: string;
    password: string;
    duration: number;
}

export interface IRegisterBody {
    chatId: string;
    username: string;
    password: string;
}

export interface IRegisterResponse {
    isUsernameTaken: boolean;
    token: string;
}

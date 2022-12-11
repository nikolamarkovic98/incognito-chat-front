export interface ICreateChatBody {
    createdAt: string;
    name: string;
    duration: number;
}

export interface IRegisterBody {
    chatId: string;
    username: string;
}

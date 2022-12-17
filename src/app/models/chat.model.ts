import { IMessage } from './message.model';

export interface IChat {
    id: string;
    createdAt: string;
    name: string;
    duration: number;
    messages: IMessage[];
    usersTyping: string[];
}

export class Chat {
    id: string;
    createdAt: string;
    name: string;
    duration: number;
    messages: IMessage[];
    usersTyping: string[];

    constructor(chat: IChat) {
        this.id = chat.id;
        this.createdAt = chat.createdAt || new Date().toString();
        this.name = chat.name;
        this.duration = chat.duration || 10;
        this.messages = chat.messages || [];
        this.usersTyping = chat.usersTyping || [];
    }
}

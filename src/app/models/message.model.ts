export interface IMessage {
    id: string;
    type: string;
    text: string;
    file: string;
    sentBy: string;
    sentAt: string;
    likes: string[];
}

export class Message {
    id: string;
    type: string;
    text: string;
    file: string;
    sentBy: string;
    sentAt: string;
    likes: string[];

    // id is generated on the server
    constructor(message: IMessage) {
        this.id = message.id || '';
        this.type = message.type || 'text';
        this.text = message.text || '';
        this.file = message.file || '';
        this.sentBy = message.sentBy || 'unknown';
        this.sentAt = message.sentAt || '';
        this.likes = message.likes || [];
    }
}

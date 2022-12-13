import { IMessage } from './message.model';

export enum EventTypes {
    CREATE = 0,
    LIKE = 1,
    DELETE = 2,
}

export interface ISocketMessage {
    eventType: EventTypes;
    message: IMessage;
}

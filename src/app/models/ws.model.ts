import { IMessage } from './message.model';

export enum EventTypes {
    CREATE = 0,
    LIKE = 1,
    UPDATE = 2,
    DELETE = 3,
}

export interface ISocketMessage {
    eventType: EventTypes;
    message: IMessage;
}

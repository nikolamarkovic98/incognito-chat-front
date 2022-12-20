import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ISocketMessage } from '../models/ws.model';
import { environment as env } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    socket: WebSocket | null = null;
    BASE_URL = `${env.ws}://${env.domain}:${env.port}/ws`;

    // Subject that notifies when socket is closed
    private socketClosedSource = new Subject<boolean>();
    socketClosed = this.socketClosedSource.asObservable();

    // Subject that notifies when new message comes through socket
    private socketMessageReceivedSource = new Subject<ISocketMessage>();
    socketMessageReceived = this.socketMessageReceivedSource.asObservable();

    initConnection(chatId: string, username: string, token: string) {
        if (this.socket) return;

        this.socket = new WebSocket(`${this.BASE_URL}/${chatId}/${username}`);

        this.socket.onopen = () => {
            // when connection is established we send token to server to verify it
            this.sendMessage(token);
        };

        this.socket.onclose = () => {
            if (!this.socket) return;

            this.socket?.close(1000, 'User is logged out.');
            this.socket = null;
            this.socketClosedSource.next(true);
        };

        this.socket.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data) as ISocketMessage;
            this.socketMessageReceivedSource.next(data);
        };

        this.socket.onerror = () => {
            this.socket?.close();
            this.socket = null;
        };
    }

    sendMessage<T>(message: T) {
        this.socket?.send(JSON.stringify(message));
    }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment as env } from '../../environments/environment';
import { IChat } from '../models/chat.model';
import { ICreateChatBody, IRegisterBody } from '../models/http.models';

@Injectable({
    providedIn: 'root',
})
export class RequestsService {
    BASE_URL = `${env.http}://${env.domain}:${`${env.port}`}`;

    constructor(private http: HttpClient) {}

    register(body: IRegisterBody): Observable<boolean> {
        const route = `${this.BASE_URL}/api/register`;
        return this.http.post<boolean>(route, body);
    }

    createChat(body: ICreateChatBody): Observable<IChat> {
        const route = `${this.BASE_URL}/api/chat`;
        return this.http.post<IChat>(route, body);
    }

    getChat(id: string): Observable<IChat> {
        const route = `${this.BASE_URL}/api/chat/${id}`;
        return this.http.get<IChat>(route);
    }

    uploadFile(chatId: string, formData: FormData): Observable<boolean> {
        const route = `${this.BASE_URL}/api/upload/${chatId}`;
        return this.http.post<boolean>(route, formData);
    }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IChat } from '../models/chat.model';
import {
    ICreateChatBody,
    IRegisterBody,
    IRegisterResponse,
} from '../models/http.models';
import { environment as env } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class RequestsService {
    BASE_URL = `${env.http}://${env.domain}:${`${env.port}`}`;

    constructor(private http: HttpClient) {}

    register(body: IRegisterBody): Observable<IRegisterResponse> {
        const route = `${this.BASE_URL}/api/register`;
        return this.http.post<IRegisterResponse>(route, body);
    }

    createChat(body: ICreateChatBody): Observable<IChat> {
        const route = `${this.BASE_URL}/api/chat`;
        return this.http.post<IChat>(route, body);
    }

    getChat(id: string, token: string): Observable<IChat> {
        const route = `${this.BASE_URL}/api/chat/${id}`;
        return this.http.get<IChat>(route, {
            headers: {
                Authorization: `bearer ${token}`,
            },
        });
    }

    uploadFile(chatId: string, formData: FormData): Observable<boolean> {
        const route = `${this.BASE_URL}/api/upload/${chatId}`;
        return this.http.post<boolean>(route, formData);
    }
}

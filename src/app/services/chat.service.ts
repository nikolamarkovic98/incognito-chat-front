import { Injectable } from '@angular/core';
import { IMessage } from '../models/message.model';
import { Chat } from '../models/chat.model';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    likesModalBox = false;
    imageModalBox = false;
    settingsModalBox = false;

    selectedMessage: IMessage;
    chat: Chat;
    text: string = '';
    username: string = '';

    constructor() {
        if (!this.chat) {
            this.chat = this.initChat();
        }
    }

    toggleLikesModalBox(): void {
        this.likesModalBox = !this.likesModalBox;
    }

    toggleImageModalBox(): void {
        this.imageModalBox = !this.imageModalBox;
    }

    toggleSettingsModalBox(): void {
        this.settingsModalBox = !this.settingsModalBox;
    }

    selectMessage(message: IMessage) {
        this.selectedMessage = message;
    }

    initChat(): Chat {
        return new Chat({
            id: '',
            createdAt: '',
            duration: 0,
            messages: [],
            name: '',
        });
    }
}

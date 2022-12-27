import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { RequestsService } from 'src/app/services/requests.service';
import { ChatService } from 'src/app/services/chat.service';
import { Chat, IChat } from 'src/app/models/chat.model';
import { ICreateChatBody } from 'src/app/models/http.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-create-chat',
    templateUrl: './create-chat.component.html',
})
export class CreateChatComponent {
    errorTimeout: ReturnType<typeof setTimeout> | null = null;
    errorMessage = '';
    chatName = '';
    password = '';
    chatDuration = 10;
    loading = false;

    @ViewChild('textarea')
    textarea: ElementRef;

    constructor(
        private chatService: ChatService,
        private requests: RequestsService,
        private router: Router,
        private titleService: Title
    ) {
        this.titleService.setTitle('Incognito Chat');
    }

    createChat(): void {
        if (this.loading) return;

        if (this.chatName === '') {
            this.showErrorMessage('Please enter chat name.');
            return;
        }

        if (this.chatName.length > 20) {
            this.showErrorMessage(
                'Maximum length for chat name is 20 characters.'
            );
            return;
        }

        if (this.chatDuration > 60) {
            this.showErrorMessage('Maximum chat time is 60 minutes.');
            return;
        }

        if (10 > this.chatDuration) {
            this.showErrorMessage('Minimum chat time is 10 minutes.');
            return;
        }

        const body: ICreateChatBody = {
            createdAt: new Date().toString(),
            name: this.chatName,
            password: this.password,
            duration: this.chatDuration,
        };

        this.loading = true;
        this.requests.createChat(body).subscribe({
            next: (chat: IChat) => {
                this.chatService.chat = new Chat(chat);
                this.router.navigate([`/register/${chat.id}`]);
            },
            error: (err: HttpErrorResponse) => {
                this.loading = false;
                if (err.status === 0) {
                    this.showErrorMessage('Server is down, try again later');
                } else {
                    this.showErrorMessage(err.error);
                }
            },
        });
    }

    showErrorMessage(message: string): void {
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }
        this.errorMessage = message;
        this.errorTimeout = setTimeout(() => (this.errorMessage = ''), 5000);
    }
}

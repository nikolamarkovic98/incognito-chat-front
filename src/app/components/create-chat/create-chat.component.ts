import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { RequestsService } from 'src/app/services/requests.service';
import { ChatService } from 'src/app/services/chat.service';
import { Chat, IChat } from 'src/app/models/chat.model';
import { ICreateChatBody } from 'src/app/models/http.models';

@Component({
    selector: 'app-create-chat',
    templateUrl: './create-chat.component.html',
})
export class CreateChatComponent {
    errorTimeout: ReturnType<typeof setTimeout> | null = null;
    errorMessage = '';
    chatName = '';
    chatDuration = 10;

    @ViewChild('username') usernameInput: ElementRef;

    constructor(
        private chatService: ChatService,
        private http: RequestsService,
        private router: Router
    ) {}

    enterChat(): void {
        if (this.chatName === '') {
            this.showErrorMessage('Please enter chat name');
            return;
        }

        if (this.chatDuration > 60) {
            this.showErrorMessage('Maximum chat time is 60 minutes');
            return;
        }

        if (10 > this.chatDuration) {
            this.showErrorMessage('Minimum chat time is 10 minutes');
            return;
        }

        const body: ICreateChatBody = {
            createdAt: new Date().toString(),
            name: this.chatName,
            duration: this.chatDuration,
        };

        this.http.createChat(body).subscribe({
            next: (chat: IChat) => {
                this.chatService.chat = new Chat(chat);
                this.router.navigate([`/register/${chat.id}`]);
            },
            error: (err) => console.log(err),
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

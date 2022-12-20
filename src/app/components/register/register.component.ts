import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ChatService } from 'src/app/services/chat.service';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestsService } from 'src/app/services/requests.service';
import { IRegisterBody, IRegisterResponse } from 'src/app/models/http.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
})
export class RegisterComponent {
    errorTimeout: ReturnType<typeof setTimeout> | null = null;
    errorMessage = '';
    chatId = '';
    loading = false;

    constructor(
        public chatService: ChatService,
        private requests: RequestsService,
        private router: Router,
        private route: ActivatedRoute,
        private titleService: Title
    ) {
        this.chatId = this.route.snapshot.params['id'];
        if (!this.chatId) {
            this.router.navigate(['/']);
        } else {
            this.chatService.username = '';
            this.titleService.setTitle('Incognito Chat - Register');
        }
    }

    enterChat(): void {
        if (this.loading) return;

        if (!this.chatService.username) {
            this.showErrorMessage('Please enter username');
            return;
        }

        const body: IRegisterBody = {
            chatId: this.chatId,
            username: this.chatService.username,
        };

        this.loading = true;
        this.requests.register(body).subscribe({
            next: (response: IRegisterResponse) => {
                if (response.isUsernameTaken) {
                    this.loading = false;
                    this.showErrorMessage(
                        `${this.chatService.username} already in use`
                    );
                    this.chatService.username = '';
                } else {
                    this.chatService.token = response.token;
                    this.router.navigate([`/chat/${this.chatId}`]);
                }
            },
            error: (err: HttpErrorResponse) => {
                if (err.status === 404) {
                    this.router.navigate(['/']);
                } else {
                    this.loading = false;
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

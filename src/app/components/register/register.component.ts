import { Component, OnInit } from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestsService } from 'src/app/services/requests.service';
import { IRegisterBody } from 'src/app/models/http.models';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
    errorTimeout: ReturnType<typeof setTimeout> | null = null;
    errorMessage = '';
    chatId = '';

    constructor(
        public chatService: ChatService,
        private reqs: RequestsService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.chatId = this.route.snapshot.params['id'];
        if (!this.chatId) {
            this.router.navigate(['/']);
        }
    }

    ngOnInit(): void {
        // check if its valid chat url
        if (!this.chatService.chat.id) {
            this.reqs.getChat(this.chatId).subscribe({
                error: () => this.router.navigate(['/']),
            });
        }
    }

    enterChat(): void {
        if (!this.chatService.username) {
            return;
        }

        const body: IRegisterBody = {
            chatId: this.chatId,
            username: this.chatService.username,
        };

        this.reqs.register(body).subscribe({
            next: (usernameAlreadyTaken: boolean) => {
                if (usernameAlreadyTaken) {
                    this.showErrorMessage(
                        `${this.chatService.username} already in use`
                    );
                    this.chatService.username = '';
                } else {
                    this.router.navigate([`/chat/${this.chatId}`]);
                }
            },
            error: () => {
                this.showErrorMessage('Error while trying to connect to chat');
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

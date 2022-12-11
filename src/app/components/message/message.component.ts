import { Component, Input, OnInit } from '@angular/core';
import { SocketService } from 'src/app/services/socket.service';
import { ChatService } from 'src/app/services/chat.service';
import { Message } from 'src/app/models/message.model';
import { EventTypes, ISocketMessage } from 'src/app/models/ws.model';
import { environment as env } from '../../../environments/environment';

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
    @Input() id: string;
    @Input() type: string;
    @Input() text: string;
    @Input() file: string;
    @Input() sentBy: string;
    @Input() sentAt: string;
    @Input() likes: string[];

    model: Message;

    constructor(public chatService: ChatService, private ws: SocketService) {}

    ngOnInit(): void {
        // init component data model
        this.model = new Message({
            id: this.id,
            type: this.type,
            text: this.text,
            file: `http://${env.domain}:${env.port}/${this.file}`,
            sentBy: this.sentBy,
            sentAt: this.sentAt,
            likes: this.likes,
        });
    }

    showLikes(): void {
        this.chatService.selectMessage(this.model);
        this.chatService.toggleLikesModalBox();
    }

    showImage(): void {
        this.chatService.selectMessage(this.model);
        this.chatService.toggleImageModalBox();
    }

    handleLike(): void {
        const likeIndex = this.model.likes.findIndex(
            (currentLike) => currentLike === this.chatService.username
        );
        if (likeIndex === -1) {
            this.model.likes.push(this.chatService.username);
        } else {
            this.model.likes.splice(likeIndex, 1);
        }

        const signal: ISocketMessage = {
            eventType: EventTypes.LIKE,
            message: this.model,
        };

        this.ws.sendMessage(signal);
    }
}
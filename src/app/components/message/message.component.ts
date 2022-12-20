import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';
import { Message } from 'src/app/models/message.model';
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
    @Input() isFirst: boolean;
    @Input() isLast: boolean;
    @Output() handleLike = new EventEmitter();
    @Output() handleCopy = new EventEmitter();
    @Output() handleDelete = new EventEmitter();

    touchTimeout: ReturnType<typeof setTimeout> | null = null;
    model: Message;
    hovered = false;
    settingsClick = false;

    constructor(public chatService: ChatService) {}

    ngOnInit(): void {
        // init component data model
        this.model = new Message({
            id: this.id,
            type: this.type,
            text: this.text,
            file: `${env.http}://${env.domain}:${env.port}/${this.file}`,
            sentBy: this.sentBy,
            sentAt: this.sentAt,
            likes: this.likes,
        });
    }

    handleTouchStart(): void {
        if (window.innerWidth >= 1024) return;
        this.touchTimeout = setTimeout(() => this.showSettings(), 500);
    }

    handleTouchEnd(): void {
        this.touchTimeout && clearTimeout(this.touchTimeout);
    }

    handleMouseLeave(): void {
        if (this.settingsClick) {
            return;
        }

        this.hovered = false;
    }

    showLikes(): void {
        this.chatService.selectMessage(this.model);
        this.chatService.toggleLikesModalBox();
    }

    showImage(): void {
        this.chatService.selectMessage(this.model);
        this.chatService.toggleImageModalBox();
    }

    showSettings(): void {
        this.chatService.selectMessage(this.model);
        this.chatService.toggleSettingsModalBox();
        // this.settingsClick = true;
    }
}

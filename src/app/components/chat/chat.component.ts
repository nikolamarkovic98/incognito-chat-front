import {
    Component,
    OnInit,
    ElementRef,
    ViewChild,
    OnDestroy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ChatService } from 'src/app/services/chat.service';
import { RequestsService } from 'src/app/services/requests.service';
import { SocketService } from 'src/app/services/socket.service';
import { IMessage } from 'src/app/models/message.model';
import { EventTypes, ISocketMessage } from 'src/app/models/ws.model';
import { Chat, IChat } from 'src/app/models/chat.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
    @ViewChild('chatRef')
    chatRef: ElementRef;

    @ViewChild('mainRef')
    mainRef: ElementRef;

    @ViewChild('text')
    textRef: ElementRef;

    @ViewChild('file')
    fileRef: ElementRef;

    maxHeight: number = 0;
    timeLeft: string = '';
    chatId: string;

    timer: ReturnType<typeof setInterval> | null = null;
    socketClosedSub: Subscription;
    socketMessageReceivedSub: Subscription;

    constructor(
        public chatService: ChatService,
        public router: Router,
        private socketService: SocketService,
        private reqs: RequestsService,
        private route: ActivatedRoute,
        private titleService: Title
    ) {
        this.chatId = this.route.snapshot.params['id'];
        if (!this.chatId) {
            this.router.navigate(['/']);
            return;
        }

        if (!this.chatService.username) {
            this.router.navigate([`/register/${this.chatId}`]);
            return;
        }

        if (this.chatService.chat.name) {
            this.titleService.setTitle(
                `Incognito Chat - ${this.chatService.chat.name}`
            );
        }
    }

    ngOnInit(): void {
        this.maxHeight = window.innerHeight;

        // once the socket closes, redirect to Home
        this.socketClosedSub = this.socketService.socketClosed.subscribe(() =>
            this.router.navigate(['/'])
        );

        // listen for incoming socket messages
        this.socketMessageReceivedSub =
            this.socketService.socketMessageReceived.subscribe(
                (socketMessage: ISocketMessage) => {
                    const { eventType, message } = socketMessage;

                    if (eventType === EventTypes.CREATE) {
                        this.showMessage(message);
                    } else if (eventType === EventTypes.LIKE) {
                        const index = this.chatService.chat.messages.findIndex(
                            (currentMessage) => currentMessage.id === message.id
                        );
                        this.chatService.chat.messages[index] = message;
                    }
                }
            );

        // check if creator is accessing chat after chat creation
        // because he will already have info about chat
        if (this.chatService.chat.id) {
            this.startConnection();
        } else {
            // fetch chat data
            this.reqs.getChat(this.chatId).subscribe({
                next: (chat: IChat) => {
                    this.chatService.chat = new Chat(chat);
                    this.titleService.setTitle(
                        `Incognito Chat - ${this.chatService.chat.name}`
                    );
                    this.startConnection();
                },
                error: () => this.router.navigate(['/']),
            });
        }
    }

    ngOnDestroy(): void {
        // clear inputs and state
        this.chatService.text = '';
        this.chatService.username = '';
        this.chatService.chat = this.chatService.initChat();

        // clear subscriptions and timer
        this.socketClosedSub && this.socketClosedSub.unsubscribe();
        this.socketMessageReceivedSub &&
            this.socketMessageReceivedSub.unsubscribe();
        this.timer && clearInterval(this.timer);
    }

    // scroll at the end of chat
    scrollDown(): void {
        setTimeout(() => {
            const totalHeight = this.chatRef.nativeElement.offsetHeight;
            this.mainRef.nativeElement.scrollTop = totalHeight;
        }, 100);
    }

    showMessage(message: IMessage): void {
        this.chatService.chat.messages.push(message);
        this.scrollDown();
    }

    startConnection(): void {
        this.socketService.initConnection(
            this.chatId,
            this.chatService.username
        );
        this.scrollDown();
        this.startTimer();
    }

    startTimer(): void {
        this.calculateTimeLeft();
        this.timer = setInterval(() => this.calculateTimeLeft(), 1000);
    }

    calculateTimeLeft(): void {
        const datesDiff =
            new Date().getTime() -
            new Date(this.chatService.chat.createdAt).getTime();
        const minutes =
            Math.ceil(
                this.chatService.chat.duration - (datesDiff / 36e5) * 60
            ) - 1;
        const seconds = Math.floor(60 - ((datesDiff / 1000) % 60));
        if (minutes > -1 && seconds > -1) {
            this.timeLeft = `${minutes > 9 ? minutes : `0${minutes}`}:${
                seconds > 9 ? seconds : `0${seconds}`
            }`;
        }
    }

    imageSelected(): void {
        // get image from file input
        const image = this.fileRef.nativeElement.files[0] as File;

        // set FormData
        let formData: FormData = new FormData();
        formData.append('sentBy', this.chatService.username);
        formData.append('sendAt', new Date().toString());
        formData.append('file', image);

        // upload file
        this.reqs.uploadFile(this.chatId, formData).subscribe();

        // reset value of file input
        this.fileRef.nativeElement.value = null;
    }

    sendMessage(): void {
        const { value } = this.textRef.nativeElement;
        if (!value) return;

        // prepare message for sending
        const socketMessage: ISocketMessage = {
            eventType: EventTypes.CREATE,
            message: this.createMessage(value, 'text'),
        };
        this.socketService.sendMessage(socketMessage);

        // reset values
        this.textRef.nativeElement.value = '';
        this.chatService.text = '';
    }

    sendHeart(): void {
        const socketMessage: ISocketMessage = {
            eventType: EventTypes.CREATE,
            message: this.createMessage('❤️', 'text'),
        };
        this.socketService.sendMessage(socketMessage);
    }

    createMessage(value: string, type: string): IMessage {
        return {
            id: '',
            type,
            text: value,
            file: '',
            sentBy: this.chatService.username,
            sentAt: new Date().toString(),
            likes: [],
        };
    }
}

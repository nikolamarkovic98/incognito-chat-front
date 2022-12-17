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
import { IMessage, Message } from 'src/app/models/message.model';
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

    timeLeft: string = '';
    chatId: string;
    typing = false;
    usersTypingMessage = '';

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
        // once the socket closes, redirect to Home
        this.socketClosedSub = this.socketService.socketClosed.subscribe(() =>
            this.router.navigate(['/'])
        );

        // listen for incoming socket messages
        this.socketMessageReceivedSub =
            this.socketService.socketMessageReceived.subscribe(
                (socketMessage: ISocketMessage) => {
                    let { eventType, message } = socketMessage;

                    if (eventType === EventTypes.CREATE) {
                        this.chatService.chat.messages.push(message);
                        this.scrollDown();
                        this.filterTyping(message);
                        this.setTypingText();
                    } else if (eventType === EventTypes.LIKE) {
                        const index = this.chatService.chat.messages.findIndex(
                            (currentMessage) => currentMessage.id === message.id
                        );
                        this.chatService.chat.messages[index].likes =
                            message.likes;
                    } else if (eventType === EventTypes.DELETE) {
                        const messageIndex =
                            this.chatService.chat.messages.findIndex(
                                (chatMessage) => chatMessage.id === message.id
                            );
                        if (messageIndex === -1) return;
                        this.chatService.chat.messages.splice(messageIndex, 1);
                    } else if (eventType === EventTypes.TYPING) {
                        if (message.text) {
                            this.chatService.chat.usersTyping.push(
                                message.sentBy
                            );
                            this.setTypingText();
                        } else {
                            this.filterTyping(message);
                            this.setTypingText();
                        }
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
                    this.setTypingText();
                },
                error: () => this.router.navigate(['/']),
            });
        }
    }

    ngOnDestroy(): void {
        if (this.typing) {
            const typingMessage: ISocketMessage = {
                eventType: EventTypes.TYPING,
                message: this.createMessage('', ''),
            };
            this.socketService.sendMessage(typingMessage);
        }

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

    handleDelete(message: Message): void {
        const signal: ISocketMessage = {
            eventType: EventTypes.DELETE,
            message,
        };

        this.socketService.sendMessage(signal);
        this.chatService.settingsModalBox = false;
    }

    handleCopy(message: Message): void {
        navigator.clipboard.writeText(message.text);
        this.chatService.settingsModalBox = false;
    }

    handleLike(message: Message): void {
        const likeIndex = message.likes.findIndex(
            (currentLike) => currentLike === this.chatService.username
        );
        if (likeIndex === -1) {
            message.likes.push(this.chatService.username);
        } else {
            message.likes.splice(likeIndex, 1);
        }

        const signal: ISocketMessage = {
            eventType: EventTypes.LIKE,
            message,
        };

        this.socketService.sendMessage(signal);
        this.chatService.settingsModalBox = false;
    }

    handleTyping(e: Event): void {
        const target = e.target as HTMLInputElement;
        this.chatService.text = target.value;

        if (this.chatService.text) {
            if (this.typing) return;

            this.typing = true;
            const signal: ISocketMessage = {
                eventType: EventTypes.TYPING,
                message: this.createMessage(this.chatService.text, 'text'),
            };

            this.socketService.sendMessage(signal);
        } else {
            const signal: ISocketMessage = {
                eventType: EventTypes.TYPING,
                message: this.createMessage('', 'text'),
            };

            this.socketService.sendMessage(signal);
            this.typing = false;
        }
    }

    filterTyping(message: IMessage): void {
        this.chatService.chat.usersTyping =
            this.chatService.chat.usersTyping.filter(
                (userTyping) => userTyping !== message.sentBy
            );
    }

    setTypingText(): void {
        let usersTyping = this.chatService.chat.usersTyping.filter(
            (userTyping) => userTyping !== this.chatService.username
        );
        if (!usersTyping.length) {
            this.usersTypingMessage = '';
            return;
        }

        usersTyping = usersTyping.slice(0, 3);
        const typingLen = usersTyping.length;
        let typingMessage = usersTyping.join(', ');

        if (typingLen === 1) {
            this.usersTypingMessage = typingMessage + ' is typing';
        } else if (this.chatService.chat.usersTyping.length > 4) {
            const rest = (this.chatService.chat.usersTyping.length - 1) % 3;
            this.usersTypingMessage =
                typingMessage +
                ` and ${rest} ${rest === 1 ? 'other' : 'others'} ${
                    rest === 1 ? 'is' : 'are'
                } typing`;
        } else {
            this.usersTypingMessage = typingMessage + ' are typing';
        }
    }

    // scroll at the end of chat
    scrollDown(): void {
        setTimeout(() => {
            const totalHeight = this.chatRef.nativeElement.offsetHeight;
            this.mainRef.nativeElement.scrollTop = totalHeight;
        }, 100);
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
        const createMessage: ISocketMessage = {
            eventType: EventTypes.CREATE,
            message: this.createMessage(value, 'text'),
        };
        this.socketService.sendMessage(createMessage);

        const typingMessage: ISocketMessage = {
            eventType: EventTypes.TYPING,
            message: this.createMessage('', 'text'),
        };
        this.socketService.sendMessage(typingMessage);

        // reset values
        this.typing = false;
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

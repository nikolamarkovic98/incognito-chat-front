import {
    Component,
    ElementRef,
    ViewChild,
    OnInit,
    AfterViewInit,
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
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('chatRef')
    chatRef: ElementRef<HTMLDivElement>;

    @ViewChild('mainRef')
    mainRef: ElementRef<HTMLDivElement>;

    @ViewChild('text')
    textRef: ElementRef<HTMLTextAreaElement>;

    @ViewChild('file')
    fileRef: ElementRef<HTMLInputElement>;

    timeLeft: string = '';
    chatId: string;
    typing: boolean = false;
    usersTypingMessage: string = '';

    timer: ReturnType<typeof setInterval> | null = null;
    socketClosedSub: Subscription;
    socketMessageReceivedSub: Subscription;

    shiftDown: boolean = false;

    constructor(
        public chatService: ChatService,
        public router: Router,
        private socketService: SocketService,
        private requests: RequestsService,
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
                        this.chatService.chat.messages =
                            this.chatService.chat.messages.filter(
                                (chatMessage) => chatMessage.id !== message.id
                            );
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
            this.requests
                .getChat(this.chatId, this.chatService.token)
                .subscribe({
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

        // textarea should resize on browser resize so the text fits nice
        window.addEventListener('resize', () => {
            this.resizeTextarea();
        });
    }

    ngAfterViewInit(): void {
        this.resizeTextarea();
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
        window.navigator.clipboard.writeText(message.text);
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

    handleTyping(e: KeyboardEvent): void {
        // shift + enter sends message
        if (e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            this.sendMessage();
            return;
        }

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
            this.chatService.username,
            this.chatService.token
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
        if (!this.fileRef.nativeElement.files) return;

        const image = this.fileRef.nativeElement.files[0] as File;

        // set FormData
        let formData: FormData = new FormData();
        formData.append('sentBy', this.chatService.username);
        formData.append('sendAt', new Date().toString());
        formData.append('file', image);

        // upload file
        this.requests.uploadFile(this.chatId, formData).subscribe();

        // reset value of file input
        this.fileRef.nativeElement.value = '';
    }

    sendMessage(): void {
        // const value = this.textRef.nativeElement.value.trim();
        const value = this.chatService.text.trim();
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
        this.resizeTextarea();
    }

    sendHeart(): void {
        const socketMessage: ISocketMessage = {
            eventType: EventTypes.CREATE,
            message: this.createMessage('??????', 'text'),
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

    resizeTextarea(): void {
        const target = this.textRef.nativeElement;
        target.style.height = '0px';
        target.style.height = target.scrollHeight + 'px';
    }
}

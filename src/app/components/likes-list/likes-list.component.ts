import { Component } from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';

@Component({
    selector: 'app-likes-list',
    templateUrl: './likes-list.component.html',
    styleUrls: ['./likes-list.component.scss'],
})
export class LikesListComponent {
    constructor(public chatService: ChatService) {}
}

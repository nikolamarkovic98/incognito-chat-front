import {
    Component,
    OnInit,
    OnDestroy,
    Output,
    EventEmitter,
    Input,
} from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';

@Component({
    selector: 'app-modalbox',
    templateUrl: './modalbox.component.html',
    styleUrls: ['./modalbox.component.scss'],
})
export class ModalboxComponent implements OnInit, OnDestroy {
    @Input() classes: string[] = [];
    @Input() exitButton = true;
    @Output() closeModalBox = new EventEmitter<boolean>();

    componentClass: string;

    constructor(public chatService: ChatService) {}

    ngOnInit(): void {
        this.componentClass = 'modalbox ' + this.classes.join(' ');
        window.addEventListener('keydown', this.handleEsc);
    }

    ngOnDestroy(): void {
        window.removeEventListener('keydown', this.handleEsc);
    }

    handleOutsideClick(e: MouseEvent): void {
        const target = e.target as HTMLDivElement;
        if (target.classList.contains('modalbox')) {
            this.closeModalBox.emit(false);
        }
    }

    handleEsc = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.closeModalBox.emit(false);
        }
    };
}

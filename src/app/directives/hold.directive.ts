import {
    Directive,
    EventEmitter,
    HostListener,
    Input,
    Output,
} from '@angular/core';

@Directive({
    selector: '[appHold]',
})
export class HoldDirective {
    @Input() timeoutTime = 600;
    @Output() hold = new EventEmitter();
    timeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {}

    @HostListener('touchstart') onTouchStart() {
        if (window.innerWidth >= 1024) return;
        this.timeout = setTimeout(() => this.hold.emit(), this.timeoutTime);
    }

    @HostListener('touchend') onTouchEnd() {
        this.timeout && clearTimeout(this.timeout);
    }
}

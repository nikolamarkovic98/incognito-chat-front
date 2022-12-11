import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { routing } from './app.routing';
import { MatIconModule } from '@angular/material/icon';

import { AppComponent } from './app.component';
import { ChatComponent } from './components/chat/chat.component';
import { CreateChatComponent } from './components/create-chat/create-chat.component';
import { MessageComponent } from './components/message/message.component';
import { ModalboxComponent } from './components/modalbox/modalbox.component';
import { LikesListComponent } from './components/likes-list/likes-list.component';
import { RegisterComponent } from './components/register/register.component';

@NgModule({
    declarations: [
        AppComponent,
        ChatComponent,
        CreateChatComponent,
        MessageComponent,
        ModalboxComponent,
        LikesListComponent,
        RegisterComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MatIconModule,
        routing,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}

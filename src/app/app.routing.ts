import { Routes, RouterModule } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { CreateChatComponent } from './components/create-chat/create-chat.component';
import { RegisterComponent } from './components/register/register.component';

const appRoutes: Routes = [
    {
        path: '',
        component: CreateChatComponent,
    },
    {
        path: 'register/:id',
        component: RegisterComponent,
    },
    {
        path: 'chat/:id',
        component: ChatComponent,
    },
    { path: '**', redirectTo: '' },
];

export const routing = RouterModule.forRoot(appRoutes);

export interface ChatMessageDTO {
    id?: number;
    watiNumber: string;
    content: string;
    isFromUser: boolean;
    timestamp?: Date;
    mediaUrl?: string;
    mediaType?: string;
    mediaName?: string;
}

export interface ConversationDTO {
data: any;
    id?: number;
    watiNumber: string;
    lastMessageTime?: any;
    createdAt?: Date;
    messages?: ChatMessageDTO[];
    isRead?:boolean;
    isDone?:boolean;
    clientId?:string;
    clientName?:String;
    isManual?: boolean;
    isBlocked?: boolean;
    watiService?:number;
}

export interface PagedResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalElements: number;
    totalPages: number;
} 
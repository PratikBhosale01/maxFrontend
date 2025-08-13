import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription, Observable, interval } from 'rxjs';
import { BankingService } from '../../services/banking.service';
import { SnackbarService } from '../../services/snackbar.service';

import { ChatMessageDTO, ConversationDTO } from '../../domain/ChatMessage';
import { QuickReply } from '../../domain/QuickReply';
import { WattiService } from '../../services/watti.service';
import { ApproveService } from '../../services/approve.service';
import { DepoChatService } from '../../services/depo-chat.service';
// import { DepositeChatService } from '../../services/deposite-chat.service';
import { WatiAccountService, WatiAccount } from '../../services/wati-account.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { QuickReplyService } from '../../services/quick-reply.service';

@Component({
  selector: 'app-deposite-chat',
  templateUrl: './deposite-chat.component.html',
  styleUrls: ['./deposite-chat.component.scss']
})
export class DepositeChatComponent implements OnInit, OnDestroy {
  quickReplies: QuickReply[] = [];
  newQuickReply: string = '';
  newQuickReplyTitle: string = '';
  showQuickReplyInput = false;
  showStarMessagesDropdown = false;
  @ViewChild('chatContainer') chatContainer: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  conversations: any[] = []; // TODO: Use DepositeConversationDTO[]
  filteredConversations: any[] = [];
  selectedFilter: string = 'undone';
  selectedConversation: any | null = null; // TODO: Use DepositeConversationDTO | null
  messages: any[] = [];
  groupedMessages: any[] = [];
  messageForm: FormGroup;
  loading = false;
  selectedFile: File | null = null;
  totalMessages = 0;
  pageSize = 20;
  pageIndex = 0;
  loadingMore = false;
  activeDepositeNumber: string = '';
  wsConnected = false;
  isEditingName = false;
  editingClientName = '';
  isManual: boolean = false;
  private chatSubscription: Subscription;
  private connectionStatusSubscription: Subscription;
  private messageSubscription: Subscription;
  private audioElements: Map<number, HTMLAudioElement> = new Map();
  private currentlyPlaying: number | null = null;
  isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private recordingTimer: any;
  recordingDuration: Date = new Date(0);
  private recordingInterval: any;
  recordingPreview: boolean = false;
  isPreviewPlaying: boolean = false;
  previewProgress: number = 0;
  previewDuration: Date = new Date(0);
  previewAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;
  private scrollThreshold = 100;
  subscription: any;
  selectedImageUrl: string | null = null;
  allocatedBanks: any[] = [];
  loader: boolean;
  selectedImageMessage: any = null;
  selectedUserIdMessage: any = null;
  depositRequestForm: FormGroup;
  utrImageUrl: string | null = null;
  utrImageFile: File | null = null;
  dragOver: boolean = false;
  depositRequestLoading = false; // New loader for deposit request
  messagesreverse: any[];
  watiAccountsList: WatiAccount[] = [];
  selectedWattiAccounts: number[] = [];
  wattiAccountsLoading: boolean = false;
  userId: any;
  userRole: any;
  searchTerm: string = '';
  private searchTimeout: any;

  constructor(
    private wattiService: WattiService,
    // private depositeChatService: DepositeChatService,
    private depoChat: DepoChatService,
    private formBuilder: FormBuilder,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private BankingService: BankingService,
    private snackbarService: SnackbarService,
    private approveService: ApproveService,
    private titleService : ComponettitleService,
    private watiAccountService: WatiAccountService, // <-- Injected
    private quickReplyService: QuickReplyService, // <-- Injected
    // private chatService: DepositeChatService
  ) {
      this.titleService.changeTitle('Deposit Chat');
    this.messageForm = this.formBuilder.group({
      content: ['']
    });
    this.depositRequestForm = this.formBuilder.group({
      userId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getuserId();
    this.fetchWattiAccounts();
    this.groupMessagesByDate();
    this.loadConversations();
    this.fetchAllocatedBanksByCurrentTime();
    this.subscription = interval(5000).subscribe(() => {
      // Only auto-refresh if not searching
      if (!this.searchTerm || this.searchTerm.trim().length === 0) {
        this.loadConversations();
        this.fetchAllocatedBanksByCurrentTime();
      }
    });
    this.loadQuickReplies();
  }
  selectConversation(watiNumber: string) {

    this.depoChat.disconnect();
    this.messages = [];
    this.depoChat.connectdchat(watiNumber);
  }

  ngAfterViewInit() {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
    }
  }



  ngOnDestroy(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.removeEventListener('scroll', this.onScroll.bind(this));
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.connectionStatusSubscription) {
      this.connectionStatusSubscription.unsubscribe();
    }
    this.depoChat.disconnect();
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements.clear();
    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }
    this.clearRecordingPreview();
    this.cleanupRecording();
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

  }
  getCurrentTimeString(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  fetchAllocatedBanksByCurrentTime(): void {
    const time = this.getCurrentTimeString();
    this.BankingService.getAvailableBanksByTimeSorted(time).subscribe(
      (data) => {
        this.allocatedBanks = data;
      },
      (error) => {
        console.error('Error fetching allocated banks by time:', error);
      }
    );
  }

  loadConversations(): void {
    // If userRole is not set yet, default to admin behavior
    if (!this.userRole || this.userRole === 'ADMIN' || this.userRole === 'SUPERADMIN' || this.userRole === 'APPROVEADMIN') {
      this.loadConversationsByFilter(this.selectedFilter);
    } else {
      this.loadConversationsByFilterWatiAccounts(this.selectedFilter);
    }
  }

  toggleStatus(id: number) {
    const isConfirmed = confirm('Do you really want change status ?');
    this.loader = true;
    if (isConfirmed) {
      this.BankingService.switch(id).subscribe(
        (data) => {
          this.loader = false;
          this.snackbarService.snackbar('Success: status changed', 'success');
          // this.refreshAllData();
        },
        (error) => {
          console.log(error);
          this.loader = false;
        }
      );
    } else {
      console.log('Deletion canceled by the user.');
    }
  }

  loadConversationsByFilter(filter: string): void {
    let observable: Observable<ConversationDTO[]>;
    const watiIds = this.selectedWattiAccounts.length > 0 ? this.selectedWattiAccounts : [0];

    switch (filter) {
      case 'unread':
        observable = this.depoChat.getUnreadConversations(watiIds);
        break;
      case 'done':
        observable = this.depoChat.getDoneConversations(watiIds);
        break;
      case 'block':
        observable = this.depoChat.getBlockedConversations(watiIds);
        break;
        
      case 'all':
        observable = this.depoChat.getAllConversations(watiIds);
        break;
      default:
        observable = this.depoChat.getUndoneConversations(watiIds);
    }

    observable.subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.conversations = data;
          this.filteredConversations = data;
          this.loading = false;
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('Error loading conversations:', error);
          this.loading = false;
        });
      }
    });
  }

  loadConversationsByFilterWatiAccounts(filter: string): void {

    let observable: Observable<ConversationDTO[]>;

    switch (filter) {
      case 'unread':
        observable = this.depoChat.getUnreadConversationsByUserId(this.userId);
        break;
      case 'done':
        observable = this.depoChat.getDoneConversationsByUserId(this.userId);
        break;
      case 'block':
        observable = this.depoChat.getDoneConversationsByUserId(this.userId);
        break;
      case 'all':
        observable = this.depoChat.getAllConversationsByUserId(this.userId);
        break;
      default:
        observable = this.depoChat.getUndoneConversationsByUserId(this.userId);
    }

    observable.subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.conversations = data;
          this.filteredConversations = data;
          this.loading = false;
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('Error loading conversations:', error);
          this.loading = false;
        });
      }
    });
  }
  onEnter(event: any): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) return;
      event.preventDefault();
      this.sendMessage();
    }
  }

  applyFilter(): void {
    if (!this.userRole || this.userRole === 'ADMIN' || this.userRole === 'SUPERADMIN' || this.userRole === 'APPROVEADMIN') {
      this.loadConversationsByFilter(this.selectedFilter);
    } else {
      this.loadConversationsByFilterWatiAccounts(this.selectedFilter);
    }
  }

  loadConversationByDepositeNumber(depositeNumber: string): void {
    this.depoChat.disconnect();
    this.loading = true;
    this.activeDepositeNumber = depositeNumber;
    this.pageIndex = 0;
    this.messages = [];

    if (this.messageSubscription && !this.messageSubscription.closed) {
      this.messageSubscription.unsubscribe();
    }

    this.depoChat.getPagedMessagesByWatiNumber(depositeNumber, this.pageIndex, this.pageSize).subscribe({
      next: (response) => {

        this.messages = [...response.content].reverse();
        // reverse the messages
        this.groupMessagesByDate();
        this.messagesreverse = [...response.content];

        this.totalMessages = response.totalElements;
        this.loading = false;

        // Patch: Set latest image message's URL to utrImageUrl

        // const latestImageMsg = this.messagesreverse.find(msg =>  msg.mediaUrl && msg.fromUser
        // );
        // if (latestImageMsg) {
        //   this.utrImageUrl = latestImageMsg.mediaUrl;
        //   this.utrImageFile = null; // Clear file if url is set
        // } else {
        //   this.utrImageUrl = null;
        // }

        setTimeout(() => this.scrollToBottom(), 0);

        this.depoChat.connectdchat(depositeNumber);

        this.messageSubscription = this.depoChat.messages$.subscribe((data) => {
          if (data && Object.keys(data).length > 0) {
            if (data.watiNumber === this.activeDepositeNumber) {
              // Avoid adding duplicate messages by ID
              const lastMsg = this.messages[this.messages.length - 1];
              if (!lastMsg || lastMsg.id !== data.id) {

                this.messages.push(data);
                this.groupMessagesByDate(); // <-- Add this line
                this.scrollToBottom();
              }
            }
          }
        });

        this.depoChat.getConversationByWatiNumber(depositeNumber).subscribe({
          next: (conversation) => {
            this.selectedConversation = conversation
            this.isManual = conversation.isManual;
          },
          error: (err) => console.error('Error loading conversation:', err)
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('Error loading messages:', error);
          this.loading = false;
        });
      }
    });
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.activeDepositeNumber) {
      return;
    }

    const content = this.messageForm.get('content')?.value || "";

    if (this.selectedFile) {
      this.loading = true;
      this.depoChat.sendMessageWithMedia(
        this.activeDepositeNumber,
        content,
        false, // isFromUser = false for outgoing messages
        this.selectedFile
      ).subscribe({
        next: (response) => {
          this.messageForm.reset();
          this.selectedFile = null;
          this.loading = false;
        },
        error: (error) => {
          this.snackbarService.snackbar('Error sending file: ' + (error?.error?.message || 'Unknown error'), 'error');
          this.loading = false;
        }
      });
    } else {
      const message: ChatMessageDTO = {
        watiNumber: this.activeDepositeNumber,
        content: content,
        isFromUser: false
      };
      this.loading = true;
      this.scrollToBottom();
      this.depoChat.sendMessage(message).subscribe(
        data => {
          this.loading = false;
        },
        error => {
          this.snackbarService.snackbar('Error sending message: ' + (error?.error?.message || 'Unknown error'), 'error');
          this.loading = false;
        }
      );
      this.messageForm.reset();
    }
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
  }

  getFileUrl(fileName: string): string {
    return this.depoChat.getFileUrl(fileName);

  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        const element = this.chatContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  isImage(mediaType: string): boolean {
    return mediaType && (mediaType.startsWith('image') || mediaType.startsWith('IMAGE'));
  }

  isVideo(mediaType: string): boolean {
    return mediaType && mediaType.startsWith('video/');
  }

  isAudio(mediaType: string): boolean {
    return mediaType && mediaType.startsWith('audio');
  }

  formatTimestamp(timestamp: Date | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  toggleAudio(event: Event, message: any): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.currentlyPlaying === message.id) {
      const audio = this.audioElements.get(message.id);
      if (audio) {
        audio.pause();
        this.currentlyPlaying = null;
      }
    } else {
      if (this.currentlyPlaying) {
        const currentAudio = this.audioElements.get(this.currentlyPlaying);
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      let audio = this.audioElements.get(message.id);
      if (!audio) {
        audio = new Audio(message.mediaUrl);
        audio.addEventListener('timeupdate', () => {
          this.cdr.detectChanges();
        });
        audio.addEventListener('ended', () => {
          this.currentlyPlaying = null;
          this.cdr.detectChanges();
        });
        this.audioElements.set(message.id, audio);
      }
      audio.play();
      this.currentlyPlaying = message.id;
    }
  }

  isPlaying(message: any): boolean {
    return this.currentlyPlaying === message.id;
  }

  getAudioProgress(message: any): number {
    const audio = this.audioElements.get(message.id);
    if (!audio) return 0;
    return (audio.currentTime / audio.duration) * 100;
  }

  getAudioDuration(message: any): string {
    const audio = this.audioElements.get(message.id);
    if (!audio || isNaN(audio.duration)) return '0:00';
    const minutes = Math.floor(audio.duration / 60);
    const seconds = Math.floor(audio.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async toggleRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      try {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm' };
        this.mediaRecorder = new MediaRecorder(this.audioStream, options);
        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
        this.mediaRecorder.onstop = () => {
          if (this.recordedChunks.length > 0) {
            const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            this.previewAudio = new Audio(audioUrl);
            this.setupPreviewAudioListeners();
            this.recordingPreview = true;
            this.cdr.detectChanges();
          }
          this.cleanupRecording();
        };
        this.mediaRecorder.start();
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.startRecordingTimer();
      } catch (error) {
        console.error('Error accessing microphone:', error);
        this.cleanupRecording();
      }
    }
  }

  private setupPreviewAudioListeners(): void {
    if (!this.previewAudio) return;
    this.previewAudio.addEventListener('timeupdate', () => {
      if (this.previewAudio) {
        this.previewProgress = (this.previewAudio.currentTime / this.previewAudio.duration) * 100;
        this.cdr.detectChanges();
      }
    });
    this.previewAudio.addEventListener('ended', () => {
      this.isPreviewPlaying = false;
      this.previewProgress = 0;
      this.cdr.detectChanges();
    });
    this.previewAudio.addEventListener('loadedmetadata', () => {
      if (this.previewAudio) {
        this.previewDuration = new Date(this.previewAudio.duration * 1000);
        this.cdr.detectChanges();
      }
    });
    this.previewAudio.addEventListener('error', (error) => {
      console.error('Error loading preview audio:', error);
      this.clearRecordingPreview();
    });
  }

  cancelRecording(): void {
    if (this.isRecording) {
      this.recordedChunks = [];
      this.stopRecording();
    }
    this.clearRecordingPreview();
    this.cdr.detectChanges();
  }

  private clearRecordingPreview(): void {
    if (this.previewAudio) {
      this.previewAudio.pause();
      const audioUrl = this.previewAudio.src;
      this.previewAudio.src = '';
      URL.revokeObjectURL(audioUrl);
      this.previewAudio = null;
    }
    this.recordingPreview = false;
    this.isPreviewPlaying = false;
    this.previewProgress = 0;
    this.previewDuration = new Date(0);
    this.cdr.detectChanges();
  }

  togglePreviewAudio(): void {
    if (!this.previewAudio) return;
    if (this.isPreviewPlaying) {
      this.previewAudio.pause();
      this.isPreviewPlaying = false;
    } else {
      this.previewAudio.play().catch(error => {
        console.error('Error playing preview audio:', error);
        this.isPreviewPlaying = false;
      });
      this.isPreviewPlaying = true;
    }
    this.cdr.detectChanges();
  }

  sendRecording(): void {
    if (this.recordedChunks.length > 0) {
      this.loading = true;
      try {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-message-${Date.now()}.webm`, { type: 'audio/webm' });
        const content = this.messageForm.get('content')?.value;
        this.wattiService.convertWebmToMP3(audioFile).subscribe({
          next: (mp3Blob: Blob) => {
            const mp3File = new File([mp3Blob], `audio-message-${Date.now()}.mp3`, { type: 'audio/mpeg' });
            this.depoChat.sendMessageWithMedia(this.activeDepositeNumber, content, false, mp3File).subscribe({
              next: (response) => {
                this.messageForm.reset();
                this.selectedFile = null;
                this.loading = false;
              },
              error: (error) => {
                this.snackbarService.snackbar('Error sending audio: ' + (error?.error?.message || 'Unknown error'), 'error');
                this.loading = false;
              }
            });
          },
          error: (error) => {
            this.snackbarService.snackbar('Error converting audio: ' + (error?.error?.message || 'Unknown error'), 'error');
            this.loading = false;
          }
        });
      } catch (error) {
        this.snackbarService.snackbar('Error creating audio file', 'error');
        this.loading = false;
      }
      this.clearRecordingPreview();
    }
  }

  private startRecordingTimer(): void {
    this.recordingDuration = new Date(0);
    this.recordingInterval = setInterval(() => {
      const duration = Date.now() - this.recordingStartTime;
      this.recordingDuration = new Date(duration);
      if (duration >= 60000) {
        this.stopRecording();
      }
    }, 1000);
  }

  private cleanupRecording(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    clearInterval(this.recordingInterval);
    this.recordingDuration = new Date(0);
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.error('Error stopping media recorder:', error);
      }
      this.isRecording = false;
      this.cleanupRecording();
    }
  }

  getlastMessage(data: any): string {
    try {
      if (data) {
        const parsedData = JSON.parse(data);
        let message = parsedData.lastMessage || '';
        const startsWithStar = message.startsWith('*');
        if (message.length > 20) {
          message = message.substring(0, 20) + (startsWithStar ? '...*' : '...');
        }
        return message;
      }
      return '';
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return '';
    }
  }

  markAsDone(conversation: any) {
    this.depoChat.markConversationAsDone(conversation.id).subscribe({
      next: () => {
        conversation.isDone = !conversation.isDone;
        // Refresh the conversation list to reflect the change
        if (!this.userRole || this.userRole === 'ADMIN' || this.userRole === 'SUPERADMIN' || this.userRole === 'APPROVEADMIN') {
          this.loadConversationsByFilter(this.selectedFilter);
        } else {
          this.loadConversationsByFilterWatiAccounts(this.selectedFilter);
        }
      },
      error: (error) => {
        console.error('Error marking conversation as done:', error);
      }
    });
  }

  markAsRead(conversation: any) {
    this.depoChat.markConversationAsRead(conversation.id).subscribe({
      next: () => {
        conversation.isRead = true;
        // Refresh the conversation list to reflect the change
        if (!this.userRole || this.userRole === 'ADMIN' || this.userRole === 'SUPERADMIN' || this.userRole === 'APPROVEADMIN') {
          this.loadConversationsByFilter(this.selectedFilter);
        } else {
          this.loadConversationsByFilterWatiAccounts(this.selectedFilter);
        }
      },
      error: (error) => {
        console.error('Error marking conversation as read:', error);
      }
    });
  }

  toggleManualStatus(depositeNumber: any): void {
    const newStatus = !this.isManual;
    this.depoChat.updateManualStatus(depositeNumber, newStatus).subscribe({
      next: (response) => {
        this.depoChat.getConversationByWatiNumber(depositeNumber).subscribe({
          next: (conversation) => {
            this.selectedConversation = conversation
            this.isManual = conversation.isManual;
          },
          error: (err) => console.error('Error loading conversation:', err)
        });
      },
      error: (error) => {
        console.log(error);
      }
    })
  }

  openImage(imageUrl: string): void {
    this.selectedImageUrl = imageUrl;
  }

  closeImage(): void {
    this.selectedImageUrl = null;
  }

  onScroll(event: any): void {
    const element = event.target;
    if (element.scrollTop < this.scrollThreshold && !this.loadingMore && this.messages.length < this.totalMessages) {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages(): void {
    if (this.loadingMore || !this.activeDepositeNumber) return;
    this.loadingMore = true;
    const nextPageIndex = this.pageIndex + 1;
    this.depoChat.getPagedMessagesByWatiNumber(this.activeDepositeNumber, nextPageIndex, this.pageSize).subscribe({
      next: (response) => {
        const newMessages = [...response.content].reverse();
        const currentScrollHeight = this.chatContainer.nativeElement.scrollHeight;

        // Add new messages to the beginning of the array
        this.messages = [...newMessages, ...this.messages];
        this.pageIndex = nextPageIndex;
        this.groupMessagesByDate(); // <-- Add this line

        // Maintain scroll position after loading new messages
        setTimeout(() => {
          const newScrollHeight = this.chatContainer.nativeElement.scrollHeight;
          this.chatContainer.nativeElement.scrollTop = newScrollHeight - currentScrollHeight;
        }, 0);

        this.loadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more messages:', error);
        this.loadingMore = false;
      }
    });
  }

  onBankActionClick(bank: any, action: string): void {
    if (!this.selectedConversation) {
      this.snackbarService.snackbar('Please select a conversation first.', 'warning');
      return;
    }

    // Toggle the button state
    if (action === 'message') {
      bank.sendMessage = !bank.sendMessage;
    } else if (action === 'qr') {
      bank.sendQR = !bank.sendQR;
    }

    // Send the request immediately
    const bankId = bank.id || bank.bankId || bank._id;
    const conversationId = this.activeDepositeNumber;

    this.depoChat.sendSelectedBankAndConversation(bankId, conversationId, action).subscribe({
      next: () => {
        this.snackbarService.snackbar(`${action.toUpperCase()} sent successfully.`, 'success');
        // Keep the button active state to show it was sent
      },
      error: (err) => {
        this.snackbarService.snackbar(`Failed to send ${action.toUpperCase()}.`, 'error');
        console.error(err);
        // Reset the button state on error
        if (action === 'message') {
          bank.sendMessage = false;
        } else if (action === 'qr') {
          bank.sendQR = false;
        }
      }
    });
  }

  loadQuickReplies(): void {
    if (this.userId) {
      this.quickReplyService.getQuickRepliesByUserId(this.userId).subscribe({
        next: (quickReplies) => {
          this.quickReplies = quickReplies;
        },
        error: (error) => {
          console.error('Error loading quick replies:', error);
          this.snackbarService.snackbar('Failed to load quick replies', 'error');
        }
      });
    }
  }

  sendQuickReply(reply: QuickReply): void {
    if (!this.activeDepositeNumber) return;
    this.messageForm.get('content')?.setValue(reply.message);
    this.sendMessage();
    this.showStarMessagesDropdown = false;
  }

  openQuickReplyInput(): void {
    this.showQuickReplyInput = true;
    this.newQuickReply = '';
    this.newQuickReplyTitle = '';
    setTimeout(() => {
      const titleInput = document.querySelector('.add-message-section .title-input') as HTMLInputElement;
      if (titleInput) {
        titleInput.focus();
      }
    });
  }

  addQuickReply(): void {
    const message = this.newQuickReply.trim();
    const title = this.newQuickReplyTitle.trim();
    
    if (message && title && this.userId) {
      // Check if quick reply with same message already exists
      const exists = this.quickReplies.some(qr => qr.message === message);
      
      if (!exists) {
        const newQuickReply: QuickReply = {
          title: title,
          message: message,
          zuserId: this.userId
        };
        
        this.quickReplyService.saveQuickReply(newQuickReply).subscribe({
          next: (savedQuickReply) => {
            this.quickReplies.push(savedQuickReply);
            this.newQuickReply = '';
            this.newQuickReplyTitle = '';
            this.snackbarService.snackbar('Quick reply added successfully', 'success');
          },
          error: (error) => {
            console.error('Error adding quick reply:', error);
            this.snackbarService.snackbar('Failed to add quick reply', 'error');
          }
        });
      } else {
        this.snackbarService.snackbar('Quick reply already exists', 'warning');
      }
    }
    this.showQuickReplyInput = false;
    // Don't close the dropdown, keep it open so user can add more messages
  }

  removeQuickReply(reply: QuickReply): void {
    if (reply.id) {
      this.quickReplyService.deleteQuickReply(reply.id).subscribe({
        next: () => {
          this.quickReplies = this.quickReplies.filter(q => q.id !== reply.id);
          this.snackbarService.snackbar('Quick reply removed successfully', 'success');
        },
        error: (error) => {
          console.error('Error removing quick reply:', error);
          this.snackbarService.snackbar('Failed to remove quick reply', 'error');
        }
      });
    }
    // Don't close dropdown even if no messages left, user might want to add new ones
  }

  isSelectableMessage(message: any): boolean {
    // Selectable if image or text with userId (simple check: content contains 'userId')
    if (message.mediaUrl && this.isImage(message.mediaType)) return true;
    if (message.content && /userId/i.test(message.content)) return true;
    return false;
  }

  isSelectedMessage(message: any): boolean {
    return this.selectedImageMessage === message || this.selectedUserIdMessage === message;
  }

  toggleMessageSelection(message: any): void {
    if (message.mediaUrl && this.isImage(message.mediaType)) {
      if (this.selectedImageMessage === message) {
        this.selectedImageMessage = null;
      } else {
        this.selectedImageMessage = message;
      }
    } else if (message.content && /userId/i.test(message.content)) {
      if (this.selectedUserIdMessage === message) {
        this.selectedUserIdMessage = null;
      } else {
        this.selectedUserIdMessage = message;
      }
    }
  }

  requestDeposit(): void {
    if (this.selectedImageMessage && this.selectedUserIdMessage) {
      this.depoChat.requestDeposit(this.selectedImageMessage, this.selectedUserIdMessage);
      // Optionally clear selection after
      this.selectedImageMessage = null;
      this.selectedUserIdMessage = null;
      this.snackbarService.snackbar('Request deposit triggered (stub)', 'info');
    }
  }

  toggleStarMessagesDropdown(): void {
    this.showStarMessagesDropdown = !this.showStarMessagesDropdown;
    if (!this.showStarMessagesDropdown) {
      this.showQuickReplyInput = false;
    }
  }

  closeStarMessagesDropdown(): void {
    this.showStarMessagesDropdown = false;
    this.showQuickReplyInput = false;
    this.newQuickReply = '';
    this.newQuickReplyTitle = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.quick-reply-wrapper')) {
      this.showStarMessagesDropdown = false;
    }
  }

  onDragOver(event: DragEvent): void {
    // console.log('Drag over event');
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  async onDrop(event: DragEvent): Promise<void> {
    // console.log('Drop event fired');
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      // console.log('File dropped:', event.dataTransfer.files[0]);
      this.handleUtrFile(event.dataTransfer.files[0]);
    } else if (event.dataTransfer) {
      // Try to get image URL from dragged content
      let url = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');
      if (!url && event.dataTransfer.items && event.dataTransfer.items.length > 0) {
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
          const item = event.dataTransfer.items[i];
          if (item.type.startsWith('image/')) {
            url = item.getAsString ? await new Promise<string>(resolve => item.getAsString(resolve)) : '';
            break;
          }
        }
      }
      if (url && (url.startsWith('data:image') || url.startsWith('http'))) {
        this.utrImageUrl = url;
        this.utrImageFile = null;
        console.log('Image URL dropped:', url);
      } else {
        console.log('No valid image file or URL found in drop event');
      }
    }
  }

  onUtrFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleUtrFile(input.files[0]);
    }
  }

  handleUtrFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.snackbarService.snackbar('Only image files are allowed.', 'error');
      // console.log('Rejected non-image file:', file);
      return;
    }
    this.utrImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.utrImageUrl = e.target.result;
      // console.log('Image loaded:', this.utrImageUrl);
    };
    reader.readAsDataURL(file);
  }

  removeUtrImage(event: Event): void {
    event.stopPropagation();
    this.utrImageUrl = null;
    this.utrImageFile = null;
    this.dragOver = false;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  async submitDepositRequest(): Promise<void> {
    if (!this.depositRequestForm.valid || (!this.utrImageFile && !this.utrImageUrl)) {
      this.snackbarService.snackbar('Please provide a valid user ID and UTR image.', 'error');
      return;
    }
    this.depositRequestLoading = true;
    let bankUtrImageLink = this.utrImageUrl;
    if (this.utrImageFile) {
      try {
        bankUtrImageLink = await this.uploadUtrImage(this.utrImageFile);
      } catch (err) {
        this.snackbarService.snackbar('Failed to upload UTR image.', 'error');
        this.depositRequestLoading = false;
        return;
      }
    }
    const userId = this.depositRequestForm.value.userId;
    const payload = {
      id: 0,
      userId: userId,
      utrNumber: 'NA',
      amount: '',
      date: new Date().toDateString(),
      siteMasterId: 0,
      zuserId: 0,
      siteId: 0,
      newId: false,
      bankUtrImageLink: bankUtrImageLink,
      chatID: this.activeDepositeNumber,
    };
    this.approveService.depositeChatId(payload).subscribe({
      next: () => {
        this.snackbarService.snackbar('Deposit request submitted!', 'success');
        this.depositRequestForm.get('userId')?.reset();
        this.utrImageUrl = null;
        this.utrImageFile = null;
        this.depositRequestLoading = false;
      },
      error: (err) => {

        console.log("error");
        console.log(err);
        if (err.status === 404) {
          this.snackbarService.snackbar('User ID not found.', 'error');
        } else {
          this.snackbarService.snackbar(err.message, 'error');
        }
        this.depositRequestLoading = false;
      }
    });
  }

  // Simulate image upload, replace with real upload logic if needed
  async uploadUtrImage(file: File): Promise<string> {
    // In real app, upload to server and get URL
    // For now, just return the base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  selectImageForDeposit(imageUrl: string): void {
    this.utrImageUrl = imageUrl;
    this.utrImageFile = null;
    this.snackbarService.snackbar('Image selected for deposit request.', 'info');
  }

  selectMsgForDeposit(msg: string): void {
    this.depositRequestForm.get('userId')?.reset();
    this.depositRequestForm.get('userId')?.setValue(msg);
  }

  getuserId() {
    let userData = localStorage.getItem('user');
    if (!userData) {
      userData = sessionStorage.getItem('user');
    }
    if (userData) {
      const zuser = JSON.parse(userData);
      this.userId = zuser.user_id;
      this.userRole = zuser.role_user;// Get the user ID from storage
    } else {
      // Handle the case when user data is not available
      console.error('User data not found in localStorage or sessionStorage');
      return;
    }
  }

  fetchWattiAccounts(): void {
    this.wattiAccountsLoading = true;
    this.watiAccountService.getAllAccounts().subscribe({
      next: (accounts) => {
        this.watiAccountsList = accounts.filter(acc => acc.isActive);
        // Auto-select all active accounts by default
        if (this.watiAccountsList.length > 0 && this.selectedWattiAccounts.length === 0) {
          this.selectedWattiAccounts = this.watiAccountsList.map(acc => acc.id);
        }
        this.wattiAccountsLoading = false;
      },
      error: (err) => {
        this.snackbarService.snackbar('Failed to load Watti accounts', 'error');
        this.wattiAccountsLoading = false;
      }
    });
  }

  onWattiAccountsChange(selected: number[]): void {
    this.selectedWattiAccounts = selected;
    this.loadConversations(); // Reload conversations with new wati account selection
  }

  toggleWattiAccount(id: number): void {
    const idx = this.selectedWattiAccounts.indexOf(id);
    if (idx > -1) {
      this.selectedWattiAccounts.splice(idx, 1);
    } else {
      this.selectedWattiAccounts.push(id);
    }
    // Reload conversations with updated wati account selection
    this.loadConversations();
  }

  selectAllWattiAccounts(): void {
    if (this.selectedWattiAccounts.length === this.watiAccountsList.length) {
      // If all are selected, deselect all
      this.selectedWattiAccounts = [];
    } else {
      // Select all
      this.selectedWattiAccounts = this.watiAccountsList.map(acc => acc.id);
    }
    // Reload conversations with updated wati account selection
    this.loadConversations();
  }

  getSelectedAccountNames(): string {
    if (this.selectedWattiAccounts.length === 0) {
      return 'Select Watti Accounts';
    }

    if (this.selectedWattiAccounts.length === this.watiAccountsList.length) {
      return 'All Accounts Selected';
    }

    const selectedNames = this.watiAccountsList
      .filter(acc => this.selectedWattiAccounts.includes(acc.id))
      .map(acc => acc.watiName);

    if (selectedNames.length <= 2) {
      return selectedNames.join(', ');
    }

    return `${selectedNames.length} Accounts Selected`;
  }

  onDropdownClick(event: Event): void {
    // Prevent the dropdown from closing when clicking inside
    event.stopPropagation();
  }

  onSearchChange(term: string): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = term;
      if (term && term.trim().length > 0) {
        this.searchConversations(term.trim());
      } else {
        this.searchTerm = '';
        this.loadConversations(); // fallback to normal filter if search is cleared
      }
    }, 300); // debounce for 300ms
  }

  searchConversations(term: string): void {
    this.loading = true;
    // Replace with your actual search endpoint
    this.depoChat.searchConversations(term, this.selectedFilter, this.selectedWattiAccounts, this.userId)
      .subscribe({
        next: (data) => {
          this.filteredConversations = data;
          this.loading = false;
        },
        error: (error) => {
          this.filteredConversations = [];
          this.loading = false;
        }
      });
  }

  ngOnChanges() {
    this.groupMessagesByDate();
  }



  groupMessagesByDate() {

    if (!this.messages) return;
    const groups: any = {};
    this.messages.forEach(msg => {
      const date = new Date(msg.timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    this.groupedMessages = Object.keys(groups).map(date => ({
      date,
      messages: groups[date]
    }));
  }

  onChatInputDragOver(event: DragEvent) {
    event.preventDefault();
    // Optionally, set a flag to highlight the input area
  }

  onChatInputDragLeave(event: DragEvent) {
    event.preventDefault();
    // Optionally, remove highlight
  }

  onChatInputDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        // Optionally, trigger change detection or preview
      }
    }
  }

  blockUser() {
    console.log('Block user clicked');
    if (this.selectedConversation && this.selectedConversation.watiNumber) {
      
      this.depoChat.blockUser(this.selectedConversation.watiNumber) .subscribe({
        next: () => {     
          this.snackbarService.snackbar('User blocked successfully.', 'success');
          // Optionally refresh conversations or update UI
          this.loadConversationsByFilter(this.selectedFilter);  
        },
        error: (error) => { 
          console.error('Error blocking user:', error);
          this.snackbarService.snackbar('Failed to block user.', 'error');
        }
      });
      // Optionally show a confirmation/snackbar
    }
  }

  startEditingName() {
    this.isEditingName = true;
    this.editingClientName = this.selectedConversation?.clientName || '';
         
  }

  updateClientName() {
    if (this.selectedConversation && this.editingClientName.trim()) {
      this.selectedConversation.clientName = this.editingClientName.trim();
    

   
      this.depoChat.updateClientName2(this.selectedConversation.id, this.editingClientName.trim())
        .subscribe({
          next: () => {
            // Optionally show a success snackbar
            this.snackbarService.snackbar('Client name updated.', 'success');
       
          },
          error: (error) => {
            // Optionally show an error snackbar
            this.snackbarService.snackbar('Failed to update client name.', 'error');
          }
        });
    }
    this.isEditingName = false;
  }
}
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { ChatMessageDTO, ConversationDTO } from '../../domain/ChatMessage';
import { WattiService } from '../../services/watti.service';
import { filter, Subscription, Observable, interval } from 'rxjs';
import { ComponettitleService } from '../../services/componenttitle.service';
import { SnackbarService } from '../../services/snackbar.service';


@Component({
  selector: 'app-watti-chat',
  templateUrl: './watti-chat.component.html',
  styleUrls: ['./watti-chat.component.scss']
})
export class WattiChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  conversations: ConversationDTO[] = [];
  filteredConversations: ConversationDTO[] = [];
  selectedFilter: string = 'undone';
  selectedConversation: ConversationDTO | null = null;
  messages: any[] = [];
  messageForm: FormGroup;
  loading = false;
  selectedFile: File | null = null;
  totalMessages = 0;
  pageSize = 20;
  pageIndex = 0;
  loadingMore = false;
  activeWatiNumber: string = '';
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
  private scrollThreshold = 100; // pixels from top to trigger loading more messages
  subscription: any;
  selectedImageUrl: string | null = null;
  searchTerm: string = '';
  private searchTimeout: any;


  constructor(
    private wattiService: WattiService,
     private snackbarService: SnackbarService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private titleService: ComponettitleService,
    private cdr: ChangeDetectorRef
  ) {
    this.titleService.changeTitle('Watti Chat');
    this.messageForm = this.formBuilder.group({
      content: ['']
    });

  }

  ngOnInit(): void {
    this.loadConversations();

    
      this.subscription = interval(5000).subscribe(() => {
         if (!this.searchTerm || this.searchTerm.trim().length === 0) {
     
      this.loadConversations();}
    });

   
    
    
    this.connectionStatusSubscription = this.wattiService.getConnectionStatus().subscribe(
      status => {
        this.wsConnected = status;
      }
    );
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
    this.wattiService.searchConversations(term, this.selectedFilter)
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

  
  selectConversation(watiNumber: string) {
    
    this.wattiService.disconnect();
    this.messages = [];
    this.wattiService.connect(watiNumber);
  }

  ngAfterViewInit() {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  onScroll(event: any): void {
    const element = event.target;
    if (element.scrollTop < this.scrollThreshold && !this.loadingMore && this.messages.length < this.totalMessages) {
      this.loadMoreMessages();
    }
  }

  loadMoreMessages(): void {
    if (this.loadingMore || !this.activeWatiNumber) return;

    this.loadingMore = true;
    const nextPageIndex = this.pageIndex + 1;

    this.wattiService.getPagedMessagesByWatiNumber(this.activeWatiNumber, nextPageIndex, this.pageSize).subscribe({
      next: (response) => {
        const newMessages = [...response.content].reverse();
        const currentScrollHeight = this.chatContainer.nativeElement.scrollHeight;
        
        // Add new messages to the beginning of the array
        this.messages = [...newMessages, ...this.messages];
        this.pageIndex = nextPageIndex;
        
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

  ngOnDestroy(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.removeEventListener('scroll', this.onScroll.bind(this));
    }

    if(this.subscription){
      this.subscription.unsubscribe();
    }

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    
    if (this.connectionStatusSubscription) {
      this.connectionStatusSubscription.unsubscribe();
    }
    
    this.wattiService.disconnect();
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

  loadConversations(): void {
    // this.loading = true;
    this.loadConversationsByFilter(this.selectedFilter);
  }

  loadConversationsByFilter(filter: string): void {
    // this.loading = true;
    let observable: Observable<ConversationDTO[]>;

    switch (filter) {
      case 'unread':
        observable = this.wattiService.getUnreadConversations();
        break;
      case 'done':
        observable = this.wattiService.getDoneConversations();
        break;
      case 'block':
        observable = this.wattiService.getBlockedConversations();
        break;
      case 'all':
        observable = this.wattiService.getAllConversations();
        break;
      default:
        observable = this.wattiService.getUndoneConversations();
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

  applyFilter(): void {
    this.loadConversationsByFilter(this.selectedFilter);
  }

  loadConversationByWatiNumber(watiNumber: string): void {
    this.wattiService.disconnect();
    this.loading = true;
    this.activeWatiNumber = watiNumber;
    this.pageIndex = 0;
    this.messages = [];
  
    if (this.messageSubscription && !this.messageSubscription.closed) {
      this.messageSubscription.unsubscribe();
    }
  
    this.wattiService.getPagedMessagesByWatiNumber(watiNumber, this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this.messages = [...response.content].reverse(); 
        this.totalMessages = response.totalElements;
        this.loading = false;
  
        setTimeout(() => this.scrollToBottom(), 0); 
  
        this.wattiService.connect(watiNumber);
  
        this.messageSubscription = this.wattiService.messages$.subscribe((data) => {
          if (data && Object.keys(data).length > 0) {
            if (data.watiNumber === this.activeWatiNumber) {
              // Avoid adding duplicate messages by ID
              const lastMsg = this.messages[this.messages.length - 1];
              if (!lastMsg || lastMsg.id !== data.id) {
                this.messages.push(data);
                this.scrollToBottom();
              }
            }
          }
        });
  
        this.wattiService.getConversationByWatiNumber(watiNumber).subscribe({
          next: (conversation) => {this.selectedConversation = conversation
            this.isManual= conversation.isManual;
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
    if (this.messageForm.invalid || !this.activeWatiNumber) {
      return;
    }
    
    const content = this.messageForm.get('content')?.value;
    
    if (this.selectedFile) {
      // For files, use the HTTP endpoint
      this.loading = true;
      this.wattiService.sendMessageWithMedia(
        this.activeWatiNumber,
        content,
        false, // isFromUser = false for outgoing messages
        this.selectedFile
      ).subscribe({
        next: (response) => {
          this.messageForm.reset();
          this.selectedFile = null;
          this.loading = false;
          // No need to manually add the message to the array
          // It will come through the WebSocket
        },
        error: (error) => {
          console.error('Error sending message with media:', error);
          this.loading = false;
        }
      });
    } else {
      // Create message object
      const message: ChatMessageDTO = {
        watiNumber: this.activeWatiNumber,
        content: content,
        isFromUser: false 
      };
      
      this.loading = true;
      
    
      this.scrollToBottom();
      
      // Send via HTTP
      this.wattiService.sendMessage(message).subscribe(
        data => {
          this.loading = false;
        
        },
        error => {
          console.error('Error sending message:', error);
          this.loading = false;
         
        }
      );
      
      // Reset form
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
    return this.wattiService.getFileUrl(fileName);
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
    return mediaType && (mediaType.startsWith('image')||mediaType.startsWith('IMAGE')) ;
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
        console.log(this.getFileUrl(message.mediaName));
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
            
            // Create preview audio element
            this.previewAudio = new Audio(audioUrl);
            this.setupPreviewAudioListeners();
            
            // Force change detection to update the view
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
    // Force change detection to update the view
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
    // Force change detection to update the view
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
    // Force change detection to update the view
    this.cdr.detectChanges();
  }

  sendRecording(): void {
    if (this.recordedChunks.length > 0) {
      try {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-message-${Date.now()}.webm`, { type: 'audio/webm' });

        this.selectedFile = audioFile;
        this.sendMessage();
      } catch (error) {
        console.error('Error creating audio file:', error);
      }

      this.clearRecordingPreview();
    }
  }
  
  

  private startRecordingTimer(): void {
    this.recordingDuration = new Date(0);
    this.recordingInterval = setInterval(() => {
      const duration = Date.now() - this.recordingStartTime;
      this.recordingDuration = new Date(duration);
      
      if (duration >= 60000) { // Max recording duration: 1 minute
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

  getlastMessage(data :any): string {
    try {
      if (data) {
        const parsedData = JSON.parse(data);
        let message = parsedData.lastMessage || '';
        // Check if message starts with an asterisk
        const startsWithStar = message.startsWith('*');
        // Truncate to 20 characters
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
  markAsDone(conversation: ConversationDTO) {
    this.wattiService.markConversationAsDone(conversation.id).subscribe({
      next: () => {
        conversation.isDone = !conversation.isDone;
        // Refresh the conversation list to reflect the change
        this.loadConversationsByFilter(this.selectedFilter);
      },
      error: (error) => {
        console.error('Error marking conversation as done:', error);
      }
    });
  }

  markAsRead(conversation: ConversationDTO) {
    this.wattiService.markConversationAsRead(conversation.id).subscribe({
      next: () => {
        conversation.isRead = true;
        // Refresh the conversation list to reflect the change
        this.loadConversationsByFilter(this.selectedFilter);
      },
      error: (error) => {
        console.error('Error marking conversation as read:', error);
      }
    });
  }

  startEditingName(): void {
    if (this.selectedConversation) {
      this.isEditingName = true;
      this.editingClientName = this.selectedConversation.clientName?.toString() || '';
    }
  }

  updateClientName(): void {
    if (this.selectedConversation && this.editingClientName.trim()) {
      this.loading = true;
      this.wattiService.updateClientName(this.selectedConversation.watiNumber, this.editingClientName.trim())
        .subscribe({
          next: (updatedConversation) => {
            this.selectedConversation = updatedConversation;
            // Update the conversation in the list
            const index = this.conversations.findIndex(c => c.watiNumber === updatedConversation.watiNumber);
            if (index !== -1) {
              this.conversations[index] = updatedConversation;
              this.filteredConversations = [...this.conversations];
            }
            this.isEditingName = false;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating client name:', error);
            this.loading = false;
          }
        });
    } else {
      this.isEditingName = false;
    }
  }

  toggleManualStatus( watiNumber :any): void {
  

    const newStatus = !this.isManual;
    this.wattiService.updateManualStatus(watiNumber, newStatus).subscribe({
      next: (response) => {
        this.wattiService.getConversationByWatiNumber(watiNumber).subscribe({
          next: (conversation) => {this.selectedConversation = conversation
            this.isManual= conversation.isManual;
          },
          error: (err) => console.error('Error loading conversation:', err)
        });
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  openImage(imageUrl: string): void {
    this.selectedImageUrl = imageUrl;
  }

  closeImage(): void {
    this.selectedImageUrl = null;
  }

  onEnter(event: any): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow default behavior (new line) when Shift+Enter is pressed
        return;
      }
      // Prevent default behavior and send message when only Enter is pressed
      event.preventDefault();
      this.sendMessage();
    }
  }
   blockUser() {
    if (this.selectedConversation && this.selectedConversation.watiNumber) {
      
      this.wattiService.blockUser(this.selectedConversation.watiNumber) .subscribe({
        next: () => {   
          if (!this.selectedConversation?.isBlocked) {  
          this.snackbarService.snackbar('User blocked successfully.', 'success');
          } else {
            this.snackbarService.snackbar('User unblocked successfully.', 'success');
          }
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

} 
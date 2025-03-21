import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ComponettitleService } from '../../services/componenttitle.service';
import { ChatBotService } from '../../services/chat-bot.service';
import { AdminMessageRequest, Selectedchat, TeleMessage } from '../../domain/chatbot';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-recent-chat',
  templateUrl: './recent-chat.component.html',
  styleUrl: './recent-chat.component.scss',
})
export class RecentChatComponent implements OnInit, OnDestroy {
  isLoading: boolean;
  chatID: string = '';
  user: any;
  userId: any;
  selectedFile: any = null; // Store selected file data (type, preview, name, file object)
  selectedFiles: {
    caption: any; file: File; type: string; name: string; preview?: string 
}[] = [];
  fileAcceptType: string = '';
  loader: any;
  subscription: any;
phoneNumber: any;

  constructor(
    private titleService: ComponettitleService,
    private chatService: ChatBotService,
    private messageService: ChatBotService,
    private cdr: ChangeDetectorRef
  ) {}
  private messageSubscription: Subscription;
  messages:TeleMessage[] ;
  selectedImage: string | null = null;
  recentChats: any[] = [];
  selectedChat: Selectedchat  ;
  newMessage: string = '';
  mockMessages: any[] = [];
  private refreshSubscription: Subscription;
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;
  private refreshInterval: any;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;

  ngOnInit(): void { 
    this.titleService.changeTitle('Recent Chat');
    let newChat : Selectedchat = {
      "chatId" : "0",
      "firstName" : "Message To All",
      }
      this.selectedChat = newChat;
    this.getUserId();
    this.messageSubscription = this.chatService.messages$.subscribe(
      (data) => {
        this.recentChats = data;
      }
    );
     this.subscription = interval(10000).subscribe(() => {
      this.refresh();
     });
  
  }


  //   ngAfterViewInit(): void {

  ngOnDestroy(): void {
    this.messageSubscription.unsubscribe();
    this.chatService.disconnect();
    // Clean up the interval to prevent memory leaks when the component is destroyed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // }
  scrollToBottom() {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }
  isImageMessage(message: string): boolean {
    return message.startsWith('Photo : ') && message.includes('http');
  }
  selectALL(): void {
    this.messages = [];
    this.phoneNumber = '';
    let newChat : Selectedchat = {
    "chatId" : "0",
    "firstName" : "Message To All",
    }
    this.selectedChat = newChat;
    // Mock some messages for the selected chat (replace with API call if needed)
    this.isLoading = true;
    this.chatID = "0";
    
    this.messageService
      .getLastMessages(this.chatID, 0)
      .subscribe((response) => {
        if (response && response.length > 0) {
          
          this.messages = [...response.reverse()];
        
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
          // this.cdRef.detectChanges();
        }
        this.isLoading = false;
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result as string;
      };
      reader.readAsDataURL(file); // Convert image to base64 for preview
    }
  }
  isVideoMessage(message: string): boolean {
    // Adjust this logic based on how video URLs are identified in your app
    return message.includes('.mp4') || message.includes('.webm') || message.includes('.ogg');
  }

  triggerImageUpload(): void {
    document.getElementById('imageUpload')?.click();
  }

  triggerFileUpload(type: string) {
    this.fileAcceptType = type === 'image' ? 'image/*,video/*' : '*/*';
    this.fileInput.nativeElement.click();
  }
  getImageUrl(message: string): string {
    const urlMatch = message.match(/Photo : (https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : '';
  }

  getCaptionImage(message: string): string {
    const parts = message.split(/Photo : https?:\/\/[^\s]+/);
    const caption = parts.length > 1 ? parts[1].trim() : '';
    return caption;
  }

  getCaptionVideo(message: string): string {
    const parts = message.split(/Video : https?:\/\/[^\s]+/);
    const caption = parts.length > 1 ? parts[1].trim() : '';
    return caption;
  }

  getCaptionDocument(message: string): string {
    const parts = message.split(/Document : https?:\/\/[^\s]+/);
    const caption = parts.length > 1 ? parts[1].trim() : '';
    return caption;
  }

  getVideoUrl(message: string): string {
    const urlMatch = message.match(/Video : (https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : '';
  }

  selectChat(chat: any): void {
    this.messages = [];
    this.phoneNumber = '';
    this.selectedChat = { ...chat };
    console.log('Selected chat:', chat);
    // Mock some messages for the selected chat (replace with API call if needed)
    this.isLoading = true;
    this.chatID = chat.chatId;
   
    this.messageService
      .getLastMessages(chat.chatId, 0)
      .subscribe((response) => {
        if (response && response.length > 0) {
          
          this.messages = [...response.reverse()];
          this.phoneNumber= this.messages[0].teleUser.phoneNumber;
          console.log(this.phoneNumber);
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
          // this.cdRef.detectChanges();
        }
        this.isLoading = false;
      });
  }

  getUserId() {
    const userData = localStorage.getItem('user');

    if (userData) {
      this.user = JSON.parse(userData);
      this.userId = this.user.user_id; // Get the user ID from localStorage
    } else {
      // Handle the case when user data is not available
      console.error('User data not found in localStorage');
      return;
    }
  }
  handleKeydown(event: KeyboardEvent): void {
    // Check if Enter is pressed without Shift
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default Enter behavior (new line)
      this.sendMessage(); // Call sendMessage
    }
    // If Shift+Enter is pressed, allow default behavior (new line)
    // No action needed here since textarea handles it natively
  }

  clearImage(): void {
    this.selectedImage = null;
    const input = document.getElementById('imageUpload') as HTMLInputElement;
    if (input) input.value = ''; // Clear file input
  }

  // sendMessage() {
  //  this.loader = true;
    
   
  //   this.messageService.sendMessage(
  //     this.userId,
  //     this.chatID,
  //     this.newMessage.trim() || undefined,
  //     this.selectedFile?.file
  //   ).subscribe({
  //     next: (response) => {
  //       this.refresh();
  //       // console.log('Message sent successfully:', response);
  //       this.clearInput();
  //       this.loader = false;
  //     },
  //     error: (error) =>{ console.error('Error sending message:', error)
  //     this.loader = false;
  //     }
  //   });
  // }
 
  // sendMessage() {
  //   this.loader = true;
  
  //   // Prepare texts as an array (even if single message)
  //   // const texts = this.newMessage.trim() ? [this.newMessage.trim()] : undefined;
  
  //   // Extract files from selectedFiles array
  //   const files = this.selectedFiles && this.selectedFiles.length > 0 
  //     ? this.selectedFiles.map(fileObj => fileObj.file) 
  //     : undefined;
  
  //   this.messageService.sendMessage(
  //     this.userId,           // Assuming userId is your adminId
  //     this.chatID,
  //   this.newMessage.trim() ,             // Array of texts
  //     files                 // Array of files
  //   ).subscribe({
  //     next: (response) => {
  //       this.refresh();
  //       console.log('Message sent successfully:', response);
  //       this.clearInput();
  //       this.clearFile();
  //       this.loader = false;
  //     },
  //     error: (error) => {
  //       console.error('Error sending message:', error);
  //       this.loader = false;
  //     }
  //   });
  // }
  sendMessage() {
    this.loader = true;
  
    // Prepare texts and files arrays based on selectedFiles
    let texts: string[] | undefined;
    let files: File[] | undefined;
  
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      // Extract captions as texts
      texts = this.selectedFiles
        .filter(fileObj => fileObj.caption && fileObj.caption.trim()) // Only include non-empty captions
        .map(fileObj => fileObj.caption.trim());
  
      // Extract files
      files = this.selectedFiles.map(fileObj => fileObj.file);
    }
  
    // If there’s a standalone message in newMessage, prepend it to texts
    if (this.newMessage && this.newMessage.trim()) {
      texts = texts ? [this.newMessage.trim(), ...texts] : [this.newMessage.trim()];
    }
  
    // If no texts are present, set to undefined
    if (texts && texts.length === 0) {
      texts = undefined;
    }
  
    // If no files are present, set to undefined
    if (files && files.length === 0) {
      files = undefined;
    }
  
    // Call the service to send the message
    this.messageService.sendMessage2(
      this.userId, // Assuming userId is your adminId
      this.chatID,
      texts, // Array of texts (captions + optional standalone message)
      files  // Array of files
    ).subscribe({
      next: (response) => {
        this.refresh();
        console.log('Message sent successfully:', response);
        this.clearInput();
        this.clearFile();
        this.loader = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.loader = false;
      }
    });
  }
  
  onCaptionChange(file: any) {
    console.log(`Caption updated for ${file.name}: ${file.caption}`);
  }
  
  clearFile() {
    this.selectedFiles = [];
    this.fileInput.nativeElement.value = '';
  }

  clearInput() {
    this.newMessage = '';
    this.clearFile();
  }

  refresh() {
    if (this.selectedChat) {
    this.isLoading = true;
    this.messageService
      .getLastMessages(this.chatID, 0)
      .subscribe((response) => {
        // this.messages = [];
        this.messages = response.reverse();
        this.isLoading = false;
      });
    }
  }

 
  //====================================old code
  // onFileSelected(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files?.length) {
  //     const file = input.files[0];
  //     const fileType = file.type.startsWith('image/') ? 'image' :
  //     file.type.startsWith('video/') ? 'video' :
  //     'document';
      
  //     this.selectedFile = { file, type: fileType, name: file.name };

  //     if (fileType === 'image') {
  //       const reader = new FileReader();
  //       reader.onload = (e: any) => this.selectedFile!.preview = e.target.result;
  //       reader.readAsDataURL(file);
  //     }
  //     input.value = '';
  //   }
  // }



  // Method to check if the message contains a document URL
  isDocumentMessage(message: string): boolean {
    return message.startsWith('Document : ') && message.includes('http');
  }

  // Method to extract the URL from the "<Type> : <URL>" format
  getFileUrl(message: string): string {
    const urlMatch = message.match(/(Photo|Document) : (https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[2] : '';
  }

  // Method to extract the file name from the URL (optional, for display)
  getFileName(message: string): string {
    const url = this.getFileUrl(message);
    if (url) {
      return url.split('/').pop() || 'Document';
    }
    return 'Document';
  }

  // Method to parse the message and handle "<Type> : <URL>" format
  parseMessage(message: string): string {
    if (this.isImageMessage(message) || this.isDocumentMessage(message)) {
      return message; // Keep the original format for display logic
    }
    return message;
  }

  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  isHtmlMessage(message: string): boolean {
    const htmlPattern = /<\/?[a-z][\s\S]*>/i; // Detects basic HTML tags
    return htmlPattern.test(message);
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      // Convert FileList to array and process each file
      const files = Array.from(input.files);
      
      // Reset selectedFiles array or initialize if not already done
      this.selectedFiles = this.selectedFiles || [];
      
      files.forEach(file => {
        const fileType = file.type.startsWith('image/') ? 'image' :
                        file.type.startsWith('video/') ? 'video' :
                        'document';
        
        const fileObj = { 
          file, 
          type: fileType, 
          name: file.name,
          preview: '', 
          caption: '' // Initialize preview property
        };
  
        // Generate preview for images and videos
        if (fileType === 'image' || fileType === 'video') {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            fileObj.preview = e.target.result;
            // Trigger change detection if needed
            this.cdr?.detectChanges(); // Add if using ChangeDetectorRef
          };
          reader.readAsDataURL(file);
        }
  
        // Add the file object to the array
        this.selectedFiles.push(fileObj);
      });
  
      // Clear the input value to allow re-selecting the same files
      input.value = '';
    }
  }

  removeFile(fileToRemove: { file: File; type: string; name: string; preview?: string }) {
    this.selectedFiles = this.selectedFiles.filter(f => f.file !== fileToRemove.file);
  }


}

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  Renderer2,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { USER } from '../../domain/User';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UpdatePasswordComponent } from '../update-password/update-password.component';
import { ComponettitleService } from '../../services/componenttitle.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements AfterViewInit ,OnInit {
  title: string = 'Default Title';
  userRole: string ;
  userName: string ="Username";
  @ViewChild('navbarToggler') navbarToggler!: ElementRef;
  @Input() isExpanded: boolean = false;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();
  handleSidebarToggle = () => this.toggleSidebar.emit(!this.isExpanded);
  constructor(public route: Router, private renderer: Renderer2,public dialog: MatDialog, private   titleService:ComponettitleService) {}
  ngOnInit(): void {
  
    this.titleService.currentTitle.subscribe((title) => (this.title = title));
    let userString = localStorage.getItem('user');
    if (!userString) {
      userString = sessionStorage.getItem('user');
    }
    if (userString) {
      // Step 2: Access user_role attribute
      const user = JSON.parse(userString);
      this.userRole = user.role_user;
      this.userName = user.user_email;
     
    }
   
  }

  ngAfterViewInit() {
    if (this.navbarToggler && this.navbarToggler.nativeElement) {
      this.renderer.listen(this.navbarToggler.nativeElement, 'click', () => {
        // Your Bootstrap toggler code here
      });
    }
  }

  logout() {
    localStorage.setItem('user', '');
    this.route.navigateByUrl('');
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    // dialogConfig.data = this.operations;
 
    const dialogRef = this.dialog.open( UpdatePasswordComponent , dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      
    });
  }
}

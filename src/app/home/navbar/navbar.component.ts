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
import { ComponettitleService } from '../../services/componenttitle.service';
import { admin, APPROVEADMIN, APPROVEDEPOSIT, APPROVEWITHDRAW, BANKER, DEPOSIT, navDomain, SUPPORT, WITHDRAWCHAT ,DEPOSITCHAT } from './navDomain';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements AfterViewInit ,OnInit {
  @ViewChild('navbarToggler') navbarToggler!: ElementRef;
  @Input() isExpanded: boolean = false;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();
  handleSidebarToggle = () => this.toggleSidebar.emit(!this.isExpanded);
  title: string = 'Default Title';
  userRole: string;
  userName: string ="Username";
  navDomains:navDomain[] = [];
  constructor(public route: Router, private renderer: Renderer2,private   titleService:ComponettitleService,
  ) {}
  ngOnInit(): void {
    this.titleService.currentTitle.subscribe((title) => (this.title = title));
    this.getrole();
    this.setRoleData();
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
    localStorage.clear();
    this.route.navigateByUrl('');
  }

  setRoleData() {
    
  
    switch (this.userRole) {

      case 'WITHDRAWCHAT':
        this.navDomains = WITHDRAWCHAT;
  
        break;

      case 'ADMIN':
        this.navDomains = admin;
       
        break;
  
      case 'APPROVEDEPOSIT':
        this.navDomains = APPROVEDEPOSIT;
   
        break;

    case 'APPROVEWITHDRAW':
          this.navDomains = APPROVEWITHDRAW;
       
          break;  
  
      case 'DEPOSIT':
        this.navDomains = DEPOSIT;
     
        break;
  
      case 'APPROVEADMIN':
        this.navDomains = APPROVEADMIN;
       
        break;

      case 'SUPPORT':
        this.navDomains = SUPPORT;
       
        break;

      case 'BANKER':
        this.navDomains = BANKER;
       
        break;

      case 'DEPOSITCHAT':
          this.navDomains = DEPOSITCHAT;
         
        break;   
  
      default:
        console.log('No matching role found, setting default role data');
        // You can handle any default case here if needed
        break;
    }
  
    // Use the `roleNavData` array as per your needs in your component
    // console.log('Navigation Data:', this.navDomains);
  }
  
  


  getrole(){
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

  toggleDropdown(event: Event) {
    const dropdownItem = (event.currentTarget as HTMLElement);
    dropdownItem.classList.toggle('expanded');
    
    // Close other dropdowns
    const allDropdowns = document.querySelectorAll('.dropdown-item');
    allDropdowns.forEach(dropdown => {
      if (dropdown !== dropdownItem) {
        dropdown.classList.remove('expanded');
      }
    });
  }

  // isExpanded = true;
  showSubmenu: boolean = false;
  isShowing = false;
  showSubSubMenu: boolean = false;

  mouseenter() {
    if (!this.isExpanded) {
      this.isShowing = true;
    }
  }

  mouseleave() {
    if (!this.isExpanded) {
      this.isShowing = false;
    }
  }

  // toggleSubmenu(navDomain: any): void {
  //   navDomain.expanded = !navDomain.expanded;
  // }
  expandedMenus = new Set<string>(); // or number, depending on your navDomain key

toggleSubmenu(navTitle: string): void {
  if (this.expandedMenus.has(navTitle)) {
    this.expandedMenus.delete(navTitle);
  } else {
    this.expandedMenus.add(navTitle);
  }
}

isSubmenuExpanded(navTitle: string): boolean {
  return this.expandedMenus.has(navTitle);
}

}

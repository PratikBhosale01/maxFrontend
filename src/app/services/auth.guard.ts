import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  // Assuming AuthService has a method isAuthenticated() to check if the user is authenticated
  // const isAuthenticated = AuthService.isAuthenticated();
  var userData = localStorage.getItem('user');

  if (!userData) {
    userData = sessionStorage.getItem('user');
  }
 
  if (userData) {
    return true;
  } else {
    // Redirect to login page or any other action
    window.alert('You need to login to access this page!');
    return false; // Block access
  }
};

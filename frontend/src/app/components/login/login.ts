import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      this.successMessage = '';

      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);

      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.authService.saveUser(response.user);

        this.successMessage = 'Login successful!';
        this.errorMessage = '';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);

        if (response.user.role === 'user') {
          this.router.navigate(['/my-complaints']);
        } else if (response.user.role === 'staff') {
          this.router.navigate(['/department-complaints']);
        } else if (response.user.role === 'admin') {
          this.router.navigate(['/all-complaints']);
        }
      },
      error: (error: any) => {
        this.errorMessage = error.error.message || 'Login failed';
        this.successMessage = '';

        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      },
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DepartmentService } from '../../services/department.service';
import { AdminService } from '../../services/admin.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.css'],
})
export class CreateUser implements OnInit {
  name: string = '';
  email: string = '';
  password: string = '';
  role: string = 'user';
  department_id: number = 0;

  departments: any[] = [];
  successMessage: string = '';
  errorMessage: string = '';

  user: any = null;

  constructor(
    private authService: AuthService,
    private departmentService: DepartmentService,
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user || this.user.role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data: any[]) => {
        this.departments = data;
      },
      error: () => {
        this.errorMessage = 'Failed to load departments. Please refresh the page.';
      },
    });
  }

  createUser(): void {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.role === 'staff' && this.department_id === 0) {
      this.errorMessage = 'Department is required for Staff role.';
      return;
    }

    this.authService.signup(this.name, this.email, this.password, this.role).subscribe({
      next: (response: any) => {
        const newUserId = response.user.id;

        // If staff → assign department after creating account
        if (this.role === 'staff') {
          this.adminService.updateUserDepartment(newUserId, this.department_id).subscribe({
            next: () => {
              this.successMessage = 'Staff created successfully!';
              this.clearForm();
            },
            error: () => {
              this.errorMessage = 'Department assignment failed.';
            },
          });
        } else {
          // User or Admin
          this.successMessage = `${this.role.charAt(0).toUpperCase() + this.role.slice(1)} created successfully!`;
          this.clearForm();
        }
      },
      error: (error: any) => {
        if (error.error?.message === 'Email already exists') {
          this.errorMessage = 'Email already registered.';
        } else {
          this.errorMessage = 'Failed to create account. Please try again.';
        }
      },
    });
  }

  clearForm(): void {
    this.name = '';
    this.email = '';
    this.password = '';
    this.role = 'user';
    this.department_id = 0;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }
}

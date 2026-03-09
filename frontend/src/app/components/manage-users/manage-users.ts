import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { DepartmentService } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './manage-users.html',
  styleUrls: ['./manage-users.css'],
})
export class ManageUsers implements OnInit {
  users: any[] = [];
  departments: any[] = [];
  user: any = null;
  isUpdating: boolean = false;
  currentUserId: number = 0;

  constructor(
    private adminService: AdminService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user || this.user.role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserId = this.user.id;

    this.loadUsers();
    this.loadDepartments();
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (data: any) => {
        this.users = data;
        console.log('Users loaded:', this.users);
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
      },
    });
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departments = data;
      },
      error: (error: any) => {
        console.error('Error loading departments:', error);
      },
    });
  }

  updateRole(userId: number, newRole: string): void {
    if (this.isUpdating) return;
    this.isUpdating = true;

    this.adminService.updateUserRole(userId, newRole).subscribe({
      next: () => {
        if (newRole !== 'staff') {
          this.adminService.updateUserDepartment(userId, null).subscribe({
            next: () => {
              this.isUpdating = false;
              this.loadUsers();
            },
            error: () => {
              this.isUpdating = false;
            },
          });
        } else {
          this.isUpdating = false;
          this.loadUsers();
        }
      },
      error: (error: any) => {
        console.error('Error updating role:', error);
        this.isUpdating = false;
      },
    });
  }

  updateDepartment(userId: number, value: string): void {
    if (this.isUpdating) return;
    this.isUpdating = true;

    // Convert empty string to null, otherwise parse to number
    const departmentId = value === '' ? null : parseInt(value);

    console.log('Updating user', userId, 'to department', departmentId);

    this.adminService.updateUserDepartment(userId, departmentId).subscribe({
      next: () => {
        console.log('Department updated successfully');
        this.isUpdating = false;
        // Reload to get fresh data from server
        this.loadUsers();
      },
      error: (error: any) => {
        console.error('Error updating department:', error);
        this.isUpdating = false;
        this.loadUsers();
      },
    });
  }
  deactivate(id: number): void {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (id === currentUser.id) {
      alert('You cannot deactivate yourself.');
      return;
    }

    this.adminService.deactivateUser(id, currentUser.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(err.error?.message || 'Error'),
    });
  }
  restore(id: number): void {
    this.adminService.restoreUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(err.error?.message || 'Error'),
    });
  }
}

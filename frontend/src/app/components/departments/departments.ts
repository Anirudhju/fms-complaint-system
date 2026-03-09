import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DepartmentService } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './departments.html',
  styleUrls: ['./departments.css'],
})
export class Departments implements OnInit {
  departments: any[] = [];
  newDepartmentName: string = '';

  successMessage: string = '';
  errorMessage: string = '';

  user: any = null;

  constructor(
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

    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data: any[]) => {
        this.departments = data;
      },
      error: () => {
        this.errorMessage = 'Failed to load departments';
      },
    });
  }

  createDepartment(): void {
    if (!this.newDepartmentName.trim()) {
      this.errorMessage = 'Please enter a department name';
      return;
    }

    this.departmentService.createDepartment(this.newDepartmentName).subscribe({
      next: () => {
        this.showSuccess('Department created successfully!');
        this.newDepartmentName = '';
        this.loadDepartments();
      },
      error: () => {
        this.errorMessage = 'Failed to create department';
      },
    });
  }

  deleteDepartment(id: number, name: string): void {
    if (!confirm(`Are you sure you want to delete "${name}" department?`)) {
      return;
    }

    this.departmentService.deleteDepartment(id).subscribe({
      next: () => {
        this.showSuccess('Department deleted successfully!');
        this.loadDepartments();
      },
      error: () => {
        this.errorMessage =
          'Failed to delete department. It may have associated users or complaints.';
      },
    });
  }

  /* Helper method to reduce repetition */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { DepartmentService } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-new-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './new-complaint.html',
  styleUrls: ['./new-complaint.css'],
})
export class NewComplaint implements OnInit {
  title = '';
  description = '';
  department_id = 0;
  departments: any[] = [];
  successMessage = '';
  errorMessage = '';
  selectedFile: File | null = null;
  user: any;

  constructor(
    private complaintService: ComplaintService,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data) => (this.departments = data),
      error: (err) => console.error('Error loading departments:', err),
    });
  }

  submitComplaint(): void {
    if (!this.title || !this.description || !this.department_id) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('description', this.description);
    formData.append('created_by', this.user.id.toString());
    formData.append('department_id', this.department_id.toString());

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.complaintService.createComplaint(formData).subscribe({
      next: () => {
        this.successMessage = 'Complaint submitted successfully!';
        this.resetForm();
      },
      error: () => {
        this.errorMessage = 'Failed to submit complaint';
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  private resetForm(): void {
    this.title = '';
    this.description = '';
    this.department_id = 0;
    this.selectedFile = null;
    this.errorMessage = '';

    setTimeout(() => (this.successMessage = ''), 3000);
  }
}

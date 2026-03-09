import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-department-complaints',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './department-complaints.html',
  styleUrls: ['./department-complaints.css'],
})
export class DepartmentComplaints implements OnInit {
  complaints: any[] = [];
  user: any = null;

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user || this.user.role !== 'staff') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadComplaints();
  }

  loadComplaints(): void {
    this.complaintService
      .getComplaints(this.user.id, this.user.role, this.user.department_id)
      .subscribe({
        next: (data: any[]) => {
          this.complaints = data;
        },
        error: () => {
          // Silent fail (UI already handles empty case)
        },
      });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/complaint', id]);
  }
}

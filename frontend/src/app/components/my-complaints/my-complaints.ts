import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-my-complaints',
  standalone: true,
  imports: [CommonModule, Navbar, RouterModule],
  templateUrl: './my-complaints.html',
  styleUrls: ['./my-complaints.css'],
})
export class MyComplaints implements OnInit {
  complaints: any[] = [];
  user: any = null;

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadComplaints();
  }

  loadComplaints(): void {
    this.complaintService.getComplaints(this.user.id, this.user.role).subscribe({
      next: (data) => {
        this.complaints = data;
      },
      error: (error) => {
        console.error('Error loading complaints:', error);
      },
    });
  }

  goToDetails(id: number): void {
    this.router.navigate(['/complaint', id]);
  }
}

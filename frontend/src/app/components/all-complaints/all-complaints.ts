import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ComplaintService } from '../../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-all-complaints',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './all-complaints.html',
  styleUrls: ['./all-complaints.css'],
})
export class AllComplaints implements OnInit {
  // Stores all complaints
  complaints: any[] = [];

  // Logged-in user
  user: any = null;

  constructor(
    private complaintService: ComplaintService,
    private authService: AuthService,
    private router: Router,
  ) {}

  /* ============================
     COMPONENT INIT
  ============================ */
  ngOnInit(): void {
    // Get logged-in user
    this.user = this.authService.getCurrentUser();

    // Only admin can access this page
    if (!this.user || this.user.role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadComplaints();
  }

  /* ============================
     LOAD ALL COMPLAINTS
  ============================ */
  loadComplaints(): void {
    this.complaintService.getComplaints(this.user.id, this.user.role).subscribe({
      next: (data: any[]) => {
        this.complaints = data;
      },

      error: (error: any) => {
        console.error('Error loading complaints:', error);
      },
    });
  }

  /* ============================
     NAVIGATE TO DETAILS
  ============================ */
  goToDetails(id: number): void {
    this.router.navigate(['/complaint', id]);
  }
}

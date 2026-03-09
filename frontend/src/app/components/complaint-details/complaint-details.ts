import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-complaint-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Navbar],
  templateUrl: './complaint-details.html',
  styleUrls: ['./complaint-details.css'],
})
export class ComplaintDetails implements OnInit {
  complaint: any = null;
  logs: any[] = [];
  feedback: any = null;
  user: any = null;

  tempStatus: string = '';
  selectedStatus: string = '';
  remarkText: string = '';
  showStatusBox: boolean = false;

  showImage: boolean = false;

  feedbackText: string = '';

  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private complaintService: ComplaintService,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    const id = this.route.snapshot.paramMap.get('id');

    if (!id || !this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadComplaint(Number(id));
  }

  loadComplaint(id: number): void {
    this.complaintService
      .getComplaintDetails(id, this.user.id, this.user.role, this.user.department_id)
      .subscribe({
        next: (data: any) => {
          this.complaint = data.complaint;
          this.logs = data.logs;
          this.feedback = data.feedback;
          this.tempStatus = this.complaint.status;
          this.loading = false;
        },
        error: () => {
          this.router.navigate(['/my-complaints']);
        },
      });
  }

  canGiveFeedback(): boolean {
    return (
      this.user.role === 'user' &&
      this.complaint.status === 'Resolved' &&
      !this.feedback &&
      this.complaint.feedback_exists !== 1
    );
  }

  submitFeedback(): void {
    if (!this.feedbackText.trim()) return;

    this.feedbackService
      .submitFeedback({
        complaint_id: this.complaint.id,
        user_id: this.user.id,
        feedback_text: this.feedbackText,
      })
      .subscribe({
        next: () => {
          this.feedbackText = '';
          this.loadComplaint(this.complaint.id);
        },
      });
  }

  openStatusBox(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newStatus = target.value;

    if (this.complaint.status === newStatus) return;

    this.selectedStatus = newStatus;
    this.remarkText = '';
    this.showStatusBox = true;
  }

  confirmStatusChange(): void {
    if (this.user.role === 'staff' && !this.remarkText.trim()) {
      alert('Remark is mandatory for staff.');
      return;
    }

    this.complaintService
      .updateStatus(
        this.complaint.id,
        this.selectedStatus,
        this.user.role,
        this.user.id,
        this.remarkText || '',
      )
      .subscribe({
        next: () => {
          this.showStatusBox = false;
          this.loadComplaint(this.complaint.id);
        },
      });
  }

  cancelStatusChange(): void {
    this.showStatusBox = false;
    this.tempStatus = this.complaint.status;
  }

  openImage(): void {
    this.showImage = true;
  }

  closeImage(): void {
    this.showImage = false;
  }
}

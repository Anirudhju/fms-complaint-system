import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './feedback.html',
  styleUrls: ['./feedback.css'],
})
export class Feedback implements OnInit {
  complaintId: number = 0;
  userId: number = 0;
  userRole: string = '';

  feedbackText: string = '';
  feedbackData: any = null;

  loading: boolean = true;
  viewMode: boolean = false;
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feedbackService: FeedbackService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('complaintId');
    this.complaintId = Number(idParam);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.userId = user.id;
      this.userRole = user.role;
    }

    if (!this.complaintId || isNaN(this.complaintId)) {
      this.navigateBack();
      return;
    }

    this.loadFeedback();
  }

  loadFeedback(): void {
    this.feedbackService.getFeedback(this.complaintId, this.userId, this.userRole).subscribe({
      next: (res: any) => {
        if (res.exists) {
          this.viewMode = true;
          this.feedbackData = res.feedback;
        } else {
          this.viewMode = false;
        }

        this.loading = false;
      },
      error: () => {
        this.navigateBack();
      },
    });
  }

  submit(): void {
    if (!this.feedbackText.trim()) {
      this.message = 'Please write feedback before submitting';
      return;
    }

    this.feedbackService
      .submitFeedback({
        complaint_id: this.complaintId,
        user_id: this.userId,
        feedback_text: this.feedbackText,
      })
      .subscribe({
        next: () => {
          this.message = 'Feedback submitted successfully';

          setTimeout(() => {
            this.router.navigate(['/my-complaints']);
          }, 1500);
        },
        error: (err: any) => {
          this.message = err.error?.message || 'Failed to submit feedback';
        },
      });
  }

  goBack(): void {
    this.navigateBack();
  }

  /* Helper method to reduce repetition */
  private navigateBack(): void {
    if (this.userRole === 'staff') {
      this.router.navigate(['/department-complaints'], { replaceUrl: true });
    } else if (this.userRole === 'admin') {
      this.router.navigate(['/all-complaints'], { replaceUrl: true });
    } else {
      this.router.navigate(['/my-complaints'], { replaceUrl: true });
    }
  }
}

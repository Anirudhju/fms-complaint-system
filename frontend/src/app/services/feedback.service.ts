import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/api/feedback';

  constructor(private http: HttpClient) {}

  submitFeedback(data: {
    complaint_id: number;
    user_id: number;
    feedback_text: string;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getFeedback(complaintId: number, userId: number, role: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${complaintId}?userId=${userId}&role=${role}`);
  }
}

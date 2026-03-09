import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ComplaintService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  createComplaint(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/complaints`, formData);
  }

  getComplaints(userId: number, role: string, departmentId?: number): Observable<any> {
    let url = `${this.apiUrl}/complaints?userId=${userId}&role=${role}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    return this.http.get(url);
  }

  updateStatus(
    id: number,
    status: string,
    role: string,
    userId: number,
    remark: string,
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/complaints/${id}`, {
      status,
      role,
      userId,
      remark,
    });
  }

  getComplaintDetails(
    id: number,
    userId: number,
    role: string,
    departmentId?: number,
  ): Observable<any> {
    let url = `${this.apiUrl}/complaints/${id}/details?userId=${userId}&role=${role}`;

    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }

    return this.http.get(url);
  }
}

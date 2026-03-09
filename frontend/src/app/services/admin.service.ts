import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users`);
  }

  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${userId}/role`, { role });
  }

  updateUserDepartment(userId: number, departmentId: number | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${userId}/department`, {
      department_id: departmentId,
    });
  }
  deactivateUser(id: number, currentAdminId: number) {
    return this.http.patch(`${this.apiUrl}/admin/users/${id}/deactivate`, { currentAdminId });
  }
  restoreUser(id: number) {
    return this.http.patch(`${this.apiUrl}/admin/users/${id}/restore`, {});
  }
}

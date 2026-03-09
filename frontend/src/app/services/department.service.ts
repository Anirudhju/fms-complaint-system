import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getDepartments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/departments`);
  }

  createDepartment(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/departments`, { name });
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/departments/${id}`);
  }
}

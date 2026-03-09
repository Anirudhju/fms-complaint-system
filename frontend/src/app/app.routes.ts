import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { NewComplaint } from './components/new-complaint/new-complaint';
import { MyComplaints } from './components/my-complaints/my-complaints';
import { DepartmentComplaints } from './components/department-complaints/department-complaints';
import { AllComplaints } from './components/all-complaints/all-complaints';
import { Departments } from './components/departments/departments';
import { ManageUsers } from './components/manage-users/manage-users';
import { CreateUser } from './components/create-user/create-user';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  // USER
  {
    path: 'new-complaint',
    component: NewComplaint,
    canActivate: [roleGuard],
    data: { roles: ['user'] },
  },
  {
    path: 'my-complaints',
    component: MyComplaints,
    canActivate: [roleGuard],
    data: { roles: ['user'] },
  },

  // STAFF
  {
    path: 'department-complaints',
    component: DepartmentComplaints,
    canActivate: [roleGuard],
    data: { roles: ['staff'] },
  },

  // ADMIN
  {
    path: 'all-complaints',
    component: AllComplaints,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'departments',
    component: Departments,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'manage-users',
    component: ManageUsers,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'create-user',
    component: CreateUser,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
  },

  // Shared (all logged-in roles)
  {
    path: 'complaint/:id',
    loadComponent: () =>
      import('./components/complaint-details/complaint-details').then((m) => m.ComplaintDetails),
    canActivate: [roleGuard],
  },
  {
    path: 'feedback/:complaintId',
    loadComponent: () => import('./components/feedback/feedback').then((m) => m.Feedback),
    canActivate: [roleGuard],
    data: { roles: ['user'] },
  },
];

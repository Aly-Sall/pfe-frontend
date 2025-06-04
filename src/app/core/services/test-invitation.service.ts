// src/app/core/services/test-invitation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SendInvitationRequest {
  candidateEmail: string;
  candidateName: string;
  testId: number;
  expirationHours?: number;
}

export interface BulkInvitationRequest {
  testId: number;
  expirationHours?: number;
  invitations: Array<{
    email: string;
    name: string;
  }>;
}

export interface ApiResponse {
  isSuccess: boolean;
  error?: string;
  id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TestInvitationService {
  private apiUrl = `${environment.apiUrl}/TestInvitation`;

  constructor(private http: HttpClient) {}

  sendInvitation(request: SendInvitationRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/send`, request);
  }

  sendBulkInvitations(request: BulkInvitationRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-bulk`, request);
  }
}

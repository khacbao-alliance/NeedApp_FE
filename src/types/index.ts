// ── Enums ──────────────────────────────────────────────
export type UserRole = 'Admin' | 'Staff' | 'Client';
export type RequestStatus = 'Draft' | 'Intake' | 'Pending' | 'MissingInfo' | 'InProgress' | 'Done' | 'Cancelled';
export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type MessageType = 'Text' | 'File' | 'System' | 'MissingInfo' | 'IntakeQuestion' | 'IntakeAnswer';
export type ClientRole = 'Owner' | 'Member';
export type ParticipantRole = 'Creator' | 'Assignee' | 'Observer';

// ── Auth ───────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  name: string | null;
  role: UserRole;
  hasClient: boolean;
  avatarUrl: string | null;
}

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  hasClient: boolean;
  avatarUrl: string | null;
  client?: ClientDto | null;
}

export interface UserDetailDto extends UserDto {
  createdAt: string;
  updatedAt: string | null;
}

// ── Client ─────────────────────────────────────────────
export interface ClientDto {
  id: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  role?: ClientRole;
  createdAt?: string;
}

export interface CreateClientRequest {
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ── Request ────────────────────────────────────────────
export interface CreateRequestRequest {
  title: string;
  description?: string;
  priority?: RequestPriority;
}

export interface CreateRequestResponse {
  requestId: string;
  title: string;
  status: RequestStatus;
  firstQuestion: MessageDto | null;
}

export interface RequestClientDto {
  id: string;
  name: string;
}

export interface RequestUserDto {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface RequestDto {
  id: string;
  title: string;
  description: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  client: RequestClientDto | null;
  assignedUser: RequestUserDto | null;
  createdByUser: RequestUserDto | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string | null;
}

// ── Message ────────────────────────────────────────────
export interface MessageDto {
  id: string;
  type: MessageType;
  content: string | null;
  sender: MessageSenderDto | null;
  metadata: IntakeQuestionMetadata | MissingInfoMetadata | null;
  replyToId: string | null;
  files: FileAttachmentDto[];
  createdAt: string;
}

export interface MessageSenderDto {
  id: string;
  name: string | null;
  role: UserRole | null;
  avatarUrl: string | null;
}

export interface FileAttachmentDto {
  id: string;
  fileName: string;
  url: string;
  contentType: string | null;
  fileSize: number | null;
}

export interface MessageListResponse {
  items: MessageDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  replyToId?: string;
}

export interface SendMissingInfoRequest {
  content: string;
  questions: string[];
}

// ── Metadata ───────────────────────────────────────────
export interface IntakeQuestionMetadata {
  questionId: string;
  orderIndex: number;
  isRequired: boolean;
  placeholder: string | null;
  totalQuestions: number;
  currentQuestion?: number;
}

export interface MissingInfoMetadata {
  questions: {
    id: string;
    question: string;
    answered: boolean;
  }[];
}

// ── Intake Question Sets ───────────────────────────────
export interface IntakeQuestionSetDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  questions: IntakeQuestionDto[];
  createdAt: string;
}

export interface IntakeQuestionDto {
  id: string;
  content: string;
  orderIndex: number;
  isRequired: boolean;
  placeholder: string | null;
}

export interface CreateIntakeQuestionSetRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
  questions: {
    content: string;
    orderIndex: number;
    isRequired: boolean;
    placeholder?: string | null;
  }[];
}

// ── File Upload ────────────────────────────────────────
export interface UploadFilesResponse {
  messageId: string;
  files: FileAttachmentDto[];
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}

// ── Pagination ─────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Error ──────────────────────────────────────────────
export interface ApiError {
  type?: string;
  title: string;
  message?: string;
  status: number;
  errors?: Record<string, string[]>;
}

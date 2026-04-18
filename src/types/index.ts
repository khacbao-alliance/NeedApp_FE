// ── Enums ──────────────────────────────────────────────
export type UserRole = 'Admin' | 'Staff' | 'Client';
export type RequestStatus = 'Draft' | 'Intake' | 'Pending' | 'MissingInfo' | 'InProgress' | 'Done' | 'Cancelled';
export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type MessageType = 'Text' | 'File' | 'System' | 'MissingInfo' | 'IntakeQuestion' | 'IntakeAnswer';
export type ClientRole = 'Owner' | 'Member';
export type ParticipantRole = 'Creator' | 'Assignee' | 'Observer';
export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined';

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

export interface ClientMemberDto {
  userId: string;
  name: string | null;
  email: string | null;
  role: ClientRole;
  avatarUrl: string | null;
  joinedAt: string; // ISO 8601
}

export interface AddMemberRequest {
  email: string;
  role?: ClientRole; // default: 'Member'
}

export interface CreateClientRequest {
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ── Invitation ─────────────────────────────────────────
export interface InvitationDto {
  id: string;
  clientName: string;
  invitedByName: string | null;
  role: ClientRole;
  status: InvitationStatus;
  createdAt: string;
}

export interface PendingInvitationDto {
  id: string;
  client: {
    id: string;
    name: string;
    description: string | null;
  };
  invitedBy: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  role: ClientRole;
  createdAt: string;
}

export interface RespondInvitationRequest {
  accept: boolean;
}

// ── Request ────────────────────────────────────────────
export interface CreateRequestRequest {
  title: string;
  description?: string;
  priority?: RequestPriority;
  dueDate?: string;
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
  isClientActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  dueDate: string | null;
  isOverdue: boolean;
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
  reactions?: ReactionSummaryDto[] | null;
}

export interface ReactionSummaryDto {
  emoji: string;
  count: number;
  userIds: string[];
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

export interface ReadReceiptDto {
  userId: string;
  lastReadAt: string;
}

export interface MessageListResponse {
  items: MessageDto[];
  nextCursor: string | null;
  hasMore: boolean;
  readers?: ReadReceiptDto[] | null;
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

export interface UpdateIntakeQuestionSetRequest {
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
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

// ── Conversation Summary ────────────────────────────────
export interface ConversationSummaryDto {
  requestId: string;
  requestTitle: string;
  requestStatus: RequestStatus;
  overview: ConversationOverviewDto;
  intakeSummary: IntakeSummaryDto | null;
  missingInfoRequests: MissingInfoSummaryDto[];
  conversationHighlights: ConversationHighlightDto[];
  attachments: AttachmentSummaryDto[];
  aiSummary: string | null;
  generatedAt: string;
}

export interface ConversationOverviewDto {
  totalMessages: number;
  totalTextMessages: number;
  totalSystemMessages: number;
  totalFilesSent: number;
  participants: ParticipantSummaryDto[];
  firstMessageAt: string | null;
  lastMessageAt: string | null;
}

export interface ParticipantSummaryDto {
  id: string;
  name: string | null;
  role: UserRole | null;
  messageCount: number;
}

export interface IntakeSummaryDto {
  totalQuestions: number;
  answeredQuestions: number;
  questionsAndAnswers: IntakeQaDto[];
}

export interface IntakeQaDto {
  question: string;
  answer: string | null;
}

export interface MissingInfoSummaryDto {
  requestedBy: string | null;
  requestedAt: string;
  content: string | null;
  questions: string[];
  isResolved: boolean;
}

export interface ConversationHighlightDto {
  senderName: string | null;
  senderRole: UserRole | null;
  recentMessages: MessageHighlightDto[];
}

export interface MessageHighlightDto {
  content: string | null;
  sentAt: string;
}

export interface AttachmentSummaryDto {
  id: string;
  fileName: string;
  contentType: string | null;
  fileSize: number | null;
  uploadedBy: string | null;
  uploadedAt: string;
}

// ── Notification ──────────────────────────────────────────
export type NotificationType = 'NewMessage' | 'MissingInfo' | 'StatusChange' | 'Assignment' | 'NewRequest' | 'Invitation';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string | null;
  content: string | null;
  metadata: Record<string, string> | null;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountDto {
  count: number;
}

// ── Dashboard Analytics ───────────────────────────────
export interface DashboardStatsDto {
  totalRequests: number;
  intakeCount: number;
  pendingCount: number;
  inProgressCount: number;
  doneCount: number;
  cancelledCount: number;
  missingInfoCount: number;
  unassignedCount: number;
  overdueCount: number;
  totalUsers: number;
  totalClients: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
  statusBreakdown: StatusCountDto[];
  priorityBreakdown: PriorityCountDto[];
  dailyTrend: DailyCountDto[];
  staffPerformance: StaffPerformanceDto[];
}

export interface StatusCountDto {
  status: string;
  count: number;
}

export interface PriorityCountDto {
  priority: string;
  count: number;
}

export interface DailyCountDto {
  date: string;
  created: number;
  completed: number;
}

export interface StaffPerformanceDto {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  assignedCount: number;
  completedCount: number;
  avgResolutionHours: number;
}

// ── SLA Config ────────────────────────────────────────
export interface SlaConfigDto {
  id: string;
  priority: string;
  deadlineHours: number;
  description: string | null;
}

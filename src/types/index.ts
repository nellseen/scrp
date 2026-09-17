export type TaskStatus = 
  | 'QUEUED' 
  | 'ANALYZING' 
  | 'RESOLVING' 
  | 'DOWNLOADING' 
  | 'PROCESSING' 
  | 'THUMBNAIL' 
  | 'UPLOADING' 
  | 'RETRYING' 
  | 'RECOVERING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

export interface Task {
  taskId: string;
  url: string;
  normalizedUrl: string;
  status: TaskStatus;
  phase: string;
  title?: string;
  uploader?: string;
  site?: string;
  mediaType?: string;
  sourceType?: string;
  protocol?: string;
  sourceUrl?: string;
  manifestUrl?: string;
  formatId?: string;
  container?: string;
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string;
  fps?: number;
  bitrate?: number;
  duration?: number;
  estimatedSize?: number;
  downloaded: number;
  total: number;
  speed: number;
  eta: number;
  percent: number;
  resolverUsed?: string;
  downloaderUsed?: string;
  downloadStrategy?: string;
  retryCount: number;
  resolverAttempts: number;
  downloaderAttempts: number;
  currentEngine?: string;
  currentPid?: number;
  resumePhase?: string;
  filePath?: string;
  thumbnailPath?: string;
  createdAt: number;
  startedAt?: number;
  updatedAt: number;
  lastActivityAt?: number;
  lastProgressAt?: number;
  completedAt?: number;
  error?: string;
  replyToMessageId?: number;
  chatId?: string; // string representation of bigInt for Telegram
}

export interface SourceCandidate {
  sourceUrl: string;
  originalUrl: string;
  protocol?: string;
  mediaType?: string;
  container?: string;
  mimeType?: string;
  manifestUrl?: string;
  title?: string;
  uploader?: string;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  filesize?: number;
  headersReference?: Record<string, string>;
  cookiesReference?: string;
  requiresBrowser: boolean;
  requiresAuth: boolean;
  isLive: boolean;
  isPlaylist: boolean;
  drm: boolean;
  resolver: string;
  confidence: number;
}

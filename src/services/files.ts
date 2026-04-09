import { api } from './requests';
import type { UploadFilesResponse, UploadAvatarResponse } from '@/types';

export const fileService = {
  upload: (requestId: string, files: File[], caption?: string) => {
    const formData = new FormData();
    formData.append('requestId', requestId);
    if (caption) formData.append('caption', caption);
    files.forEach((file) => formData.append('files', file));
    return api.upload<UploadFilesResponse>('/files/upload', formData);
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<UploadAvatarResponse>('/files/avatar', formData);
  },

  deleteAvatar: () => api.delete<void>('/files/avatar'),
};

export interface Attachment {
  id: string;
  testCaseId: string;
  projectId: string;
  fileName: string;
  fileSize: number;
  fileType: string | null;
  storagePath: string;
  url: string;
  createdAt: Date;
}

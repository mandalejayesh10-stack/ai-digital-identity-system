const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Skill {
  id: number;
  name: string;
  category: string;
  level: string;
}

export interface TimelineEvent {
  id: number;
  document_id?: number;
  title: string;
  description: string;
  event_date?: string;
  event_year: number;
  category: string;
}

export interface Document {
  id: number;
  name: string;
  file_type: string;
  upload_date: string;
  status: string;
  summary?: string;
  overall_score: number;
  skills: Skill[];
}

export interface DashboardStats {
  career_score: number;
  total_documents: number;
  total_skills: number;
  total_events: number;
  recent_activity: TimelineEvent[];
  top_skills: Skill[];
  insights: string[];
  missing_skills: string[];
  career_roadmap: string[];
}

export interface GraphData {
  nodes: {
    id: string;
    label: string;
    name: string;
    properties: Record<string, any>;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type: string;
    properties: Record<string, any>;
  }[];
}

export interface ChatResponse {
  answer: string;
  relevant_documents: { name: string; file_type: string }[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch(`${API_BASE_URL}/documents/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function uploadDocument(file: File, fileType: string): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

export async function deleteDocument(docId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function fetchTimeline(): Promise<TimelineEvent[]> {
  const res = await fetch(`${API_BASE_URL}/timeline/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function fetchSkillGraph(): Promise<GraphData> {
  const res = await fetch(`${API_BASE_URL}/skills/graph`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch skill graph');
  return res.json();
}

export async function sendChatQuery(question: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/search/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Failed to send chat query');
  return res.json();
}

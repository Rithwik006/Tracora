import apiClient from './client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: string;
  is_completed: boolean;
  created_at: string;
  due_date?: string;
  owner_id: number;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: string;
  is_completed?: boolean;
}

export interface GetTasksParams {
  status?: string;
  priority?: string;
  search?: string;
}

export async function getTasks(params?: GetTasksParams): Promise<Task[]> {
  const res = await apiClient.get<Task[]>('/tasks/', { params });
  return res.data;
}

export async function createTask(data: TaskCreate): Promise<Task> {
  const res = await apiClient.post<Task>('/tasks/', data);
  return res.data;
}

export async function updateTask(id: number, data: TaskUpdate): Promise<Task> {
  const res = await apiClient.put<Task>(`/tasks/${id}`, data);
  return res.data;
}

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export async function clearCompletedTasks(): Promise<{ message: string; deleted_count: number }> {
  const res = await apiClient.delete<{ message: string; deleted_count: number }>('/tasks/completed/clear');
  return res.data;
}


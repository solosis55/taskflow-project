// FRONTEND API CLIENT
// Este modulo concentra toda la comunicacion HTTP con el backend.

const API_URL = "/api/v1/tasks"; // URL relativa para local y Vercel en el mismo dominio.

const parseJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
};

export const getTasks = async () => {
  const response = await fetch(API_URL);
  const data = await parseJsonSafely(response);
  if (!response.ok) throw new Error("GET_TASKS_ERROR");
  return data;
};

export const createTask = async ({ title, priority = "high", dueDate = "", subtasks = [] }) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, priority, dueDate, subtasks })
  });
  const data = await parseJsonSafely(response);
  if (!response.ok) throw new Error("CREATE_TASK_ERROR");
  return data;
};

export const updateTask = async (id, payload) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await parseJsonSafely(response);
  if (!response.ok) throw new Error("UPDATE_TASK_ERROR");
  return data;
};

export const deleteTask = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("DELETE_TASK_ERROR");
};

export const syncTasks = async (tasks) => {
  const response = await fetch(`${API_URL}/sync`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ tasks })
  });
  const data = await parseJsonSafely(response);
  if (!response.ok) throw new Error("SYNC_TASKS_ERROR");
  return data;
};

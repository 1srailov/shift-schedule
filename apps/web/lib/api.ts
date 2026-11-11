import type { ApiError, Employee, SaveShifts, Shift, ShiftTemplate } from "@shifts/shared";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiRequestError("Нет связи с сервером", 0, "network");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(body?.error.message ?? `Ошибка ${res.status}`, res.status, body?.error.code);
  }
  return res.json() as Promise<T>;
}

export const api = {
  employees: (q: string, signal?: AbortSignal) =>
    request<Employee[]>(`/employees${q ? `?q=${encodeURIComponent(q)}` : ""}`, { signal }),
  templates: () => request<ShiftTemplate[]>("/templates"),
  shifts: (from: string, to: string, signal?: AbortSignal) =>
    request<Shift[]>(`/shifts?from=${from}&to=${to}`, { signal }),
  saveShifts: (body: SaveShifts) =>
    request<{ saved: number; deleted: number }>("/shifts", { method: "PUT", body: JSON.stringify(body) }),
  publish: (from: string, to: string) =>
    request<{ published: number }>("/schedule/publish", { method: "POST", body: JSON.stringify({ from, to }) }),
};

const CARE_ACCESS_TOKEN_LOCAL_STORAGE_KEY = "care_access_token";

export class APIError extends Error {
  message: string;
  data: unknown;
  status: number;

  constructor(message: string, data: unknown, status: number) {
    super(message);
    this.name = "AbortError"; // this is required to skip error toasts by the core app, all the necessary errors are handled by the plug
    this.message = message;
    this.data = data;
    this.status = status;
  }
}

export async function request<Response>(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${window.__CORE_ENV__?.apiUrl || ""}${path}`;

  const defaultHeaders = {
    Authorization: `Bearer ${localStorage.getItem(
      CARE_ACCESS_TOKEN_LOCAL_STORAGE_KEY
    )}`,
    "Content-Type": "application/json",
  };

  const requestInit = {
    ...(options ?? {}),
    headers: {
      ...defaultHeaders,
      ...(options?.headers ?? {}),
    },
  };

  const response = await fetch(url, requestInit);

  let data = null;
  const contentType = response.headers.get("Content-Type");
  if (contentType === "application/json") {
    data = await response.json();
  } else if (contentType === "image/png") {
    data = await response.blob();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // TODO: implement refresh token logic
    }

    throw new APIError(
      (data.detail ?? JSON.stringify(data)) || "Something went wrong",
      data,
      response.status
    );
  }

  return data as Response;
}

export const queryString = (
  params?: Record<string, string | number | boolean>
) => {
  if (!params) {
    return "";
  }

  const paramString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return paramString ? `?${paramString}` : "";
};

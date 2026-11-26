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

// DRF answers with { detail }, a list of messages, or { field: [messages] }
const readableMessage = (data: unknown): string => {
  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(readableMessage).filter(Boolean).join(" ");
  }

  if (!data || typeof data !== "object") {
    return "";
  }

  const { detail, message, non_field_errors, ...fields } = data as Record<
    string,
    unknown
  >;

  return (
    readableMessage(detail) ||
    readableMessage(message) ||
    readableMessage(non_field_errors) ||
    Object.entries(fields)
      .map(([field, value]) => {
        const fieldMessage = readableMessage(value);
        return fieldMessage && `${field}: ${fieldMessage}`;
      })
      .filter(Boolean)
      .join(" ")
  );
};

/** The server's message for a failed request, else ``fallback``. */
export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof APIError && error.message ? error.message : fallback;

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

  // the host toasts every error but an APIError, so a network failure is one too
  const response = await fetch(url, requestInit).catch((error) => {
    throw new APIError("", error, 0);
  });

  let data = null;
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else if (contentType.includes("image/png")) {
    data = await response.blob();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // TODO: implement refresh token logic
    }

    throw new APIError(readableMessage(data), data, response.status);
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

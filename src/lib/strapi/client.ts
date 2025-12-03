import {
  ContentTypeName,
  CONTENT_TYPE_CONFIG,
  StrapiResponse,
  StrapiSingleResponse,
  StrapiError,
} from "@/types/strapi";

export interface StrapiClientConfig {
  baseUrl: string;
  token: string;
}

export interface QueryParams {
  filters?: Record<string, unknown>;
  sort?: string | string[];
  populate?: string | string[] | Record<string, unknown>;
  fields?: string[];
  pagination?: {
    page?: number;
    pageSize?: number;
    start?: number;
    limit?: number;
  };
  publicationState?: "live" | "preview";
}

export class StrapiClient {
  private baseUrl: string;
  private token: string;

  constructor(config: StrapiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.token = config.token;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.filters) {
      this.flattenObject(params.filters, "filters", searchParams);
    }

    if (params.sort) {
      if (Array.isArray(params.sort)) {
        params.sort.forEach((s, i) => searchParams.append(`sort[${i}]`, s));
      } else {
        searchParams.append("sort", params.sort);
      }
    }

    if (params.populate) {
      if (typeof params.populate === "string") {
        searchParams.append("populate", params.populate);
      } else if (Array.isArray(params.populate)) {
        params.populate.forEach((p, i) =>
          searchParams.append(`populate[${i}]`, p)
        );
      } else {
        this.flattenObject(params.populate, "populate", searchParams);
      }
    }

    if (params.fields) {
      params.fields.forEach((f, i) => searchParams.append(`fields[${i}]`, f));
    }

    if (params.pagination) {
      Object.entries(params.pagination).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(`pagination[${key}]`, String(value));
        }
      });
    }

    if (params.publicationState) {
      searchParams.append("publicationState", params.publicationState);
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  private flattenObject(
    obj: Record<string, unknown>,
    prefix: string,
    searchParams: URLSearchParams
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}[${key}]`;
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        this.flattenObject(
          value as Record<string, unknown>,
          fullKey,
          searchParams
        );
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => {
          if (typeof v === "object") {
            this.flattenObject(v, `${fullKey}[${i}]`, searchParams);
          } else {
            searchParams.append(`${fullKey}[${i}]`, String(v));
          }
        });
      } else {
        searchParams.append(fullKey, String(value));
      }
    }
  }

  private getEndpoint(contentType: ContentTypeName): string {
    const config = CONTENT_TYPE_CONFIG[contentType];
    return `/api/${config.pluralName}`;
  }

  async find<T>(
    contentType: ContentTypeName,
    params: QueryParams = {}
  ): Promise<StrapiResponse<T[]> | StrapiError> {
    const endpoint = this.getEndpoint(contentType);
    const queryString = this.buildQueryString(params);
    const url = `${this.baseUrl}${endpoint}${queryString}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return data as StrapiError;
      }

      return data as StrapiResponse<T[]>;
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async findOne<T>(
    contentType: ContentTypeName,
    documentId: string,
    params: QueryParams = {}
  ): Promise<StrapiSingleResponse<T> | StrapiError> {
    const endpoint = this.getEndpoint(contentType);
    const queryString = this.buildQueryString(params);
    const url = `${this.baseUrl}${endpoint}/${documentId}${queryString}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return data as StrapiError;
      }

      return data as StrapiSingleResponse<T>;
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async create<T, I>(
    contentType: ContentTypeName,
    data: I
  ): Promise<StrapiSingleResponse<T> | StrapiError> {
    const endpoint = this.getEndpoint(contentType);
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return responseData as StrapiError;
      }

      return responseData as StrapiSingleResponse<T>;
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async update<T, I>(
    contentType: ContentTypeName,
    documentId: string,
    data: I
  ): Promise<StrapiSingleResponse<T> | StrapiError> {
    const endpoint = this.getEndpoint(contentType);
    const url = `${this.baseUrl}${endpoint}/${documentId}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ data }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return responseData as StrapiError;
      }

      return responseData as StrapiSingleResponse<T>;
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async delete(
    contentType: ContentTypeName,
    documentId: string
  ): Promise<StrapiSingleResponse<{ documentId: string }> | StrapiError> {
    const endpoint = this.getEndpoint(contentType);
    const url = `${this.baseUrl}${endpoint}/${documentId}`;

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return responseData as StrapiError;
      }

      return responseData as StrapiSingleResponse<{ documentId: string }>;
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async publish(
    contentType: ContentTypeName,
    documentId: string
  ): Promise<StrapiSingleResponse<unknown> | StrapiError> {
    const endpoint = this.getEndpoint(contentType);
    const url = `${this.baseUrl}${endpoint}/${documentId}/actions/publish`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return responseData as StrapiError;
      }

      return responseData as StrapiSingleResponse<unknown>;
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async unpublish(
    contentType: ContentTypeName,
    documentId: string
  ): Promise<StrapiSingleResponse<unknown> | StrapiError> {
    const endpoint = this.getEndpoint(contentType);
    const url = `${this.baseUrl}${endpoint}/${documentId}/actions/unpublish`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return responseData as StrapiError;
      }

      return responseData as StrapiSingleResponse<unknown>;
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async uploadMedia(
    file: File | Blob,
    fileInfo?: {
      name?: string;
      alternativeText?: string;
      caption?: string;
    }
  ): Promise<StrapiSingleResponse<unknown> | StrapiError> {
    const url = `${this.baseUrl}/api/upload`;

    const formData = new FormData();
    formData.append("files", file);

    if (fileInfo) {
      formData.append("fileInfo", JSON.stringify(fileInfo));
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: {
            status: response.status,
            name: "UploadError",
            message: responseData.error?.message || "Upload failed",
          },
        };
      }

      return { data: responseData, meta: {} };
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          name: "FetchError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }
}

// Factory function to create client with user's Strapi token
export function createStrapiClient(token: string): StrapiClient {
  return new StrapiClient({
    baseUrl: process.env.STRAPI_URL || "http://localhost:1337",
    token,
  });
}

// Check if response is an error
export function isError(
  response: StrapiResponse<unknown> | StrapiSingleResponse<unknown> | StrapiError
): response is StrapiError {
  return "error" in response && response.error !== undefined;
}

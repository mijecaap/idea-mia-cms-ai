import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StrapiClient, isError } from "@/lib/strapi/client";
import { ContentTypeName, CONTENT_TYPE_CONFIG } from "@/types/strapi";

// Schema for content type validation
const contentTypeSchema = z.enum([
  "product",
  "category",
  "product-image",
  "product-variant",
  "customization-schema",
  "order",
  "article",
  "author",
  "blog-category",
  "tag",
  "homepage",
]);

// ============================================
// Query Tool - Auto-executed (read operations)
// ============================================

export const createQueryTool = (strapiClient: StrapiClient) =>
  tool(
    async ({ contentType, filters, sort, populate, limit, page }) => {
      try {
        const config = CONTENT_TYPE_CONFIG[contentType as ContentTypeName];
        
        if (!config) {
          return JSON.stringify({
            success: false,
            error: `Content type '${contentType}' not found`,
          });
        }

        const response = await strapiClient.find(contentType as ContentTypeName, {
          filters: filters ? JSON.parse(filters) : undefined,
          sort: sort || undefined,
          populate: populate || "*",
          pagination: {
            page: page || 1,
            pageSize: limit || 25,
          },
        });

        if (isError(response)) {
          return JSON.stringify({
            success: false,
            error: response.error.message,
          });
        }

        return JSON.stringify({
          success: true,
          data: response.data,
          meta: response.meta,
          contentType,
          count: Array.isArray(response.data) ? response.data.length : 1,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    {
      name: "strapi_query",
      description: `Busca y lista contenido del CMS. Usa esto para consultar productos, categorías, artículos, órdenes, etc. 
      Esta operación es de solo lectura y se ejecuta automáticamente.
      
      Ejemplos de filtros:
      - {"is_active": {"$eq": true}} - Productos activos
      - {"price": {"$gte": 10, "$lte": 50}} - Precio entre 10 y 50
      - {"title": {"$contains": "taza"}} - Título contiene "taza"
      - {"category": {"id": {"$eq": 1}}} - Por categoría ID`,
      schema: z.object({
        contentType: contentTypeSchema.describe("Tipo de contenido a consultar"),
        filters: z.string().optional().describe("Filtros en formato JSON (ej: {\"is_active\": {\"$eq\": true}})"),
        sort: z.string().optional().describe("Ordenamiento (ej: 'createdAt:desc' o 'price:asc')"),
        populate: z.string().optional().describe("Relaciones a incluir (ej: '*' para todas, 'category' para específica)"),
        limit: z.number().optional().default(25).describe("Número máximo de resultados (default: 25)"),
        page: z.number().optional().default(1).describe("Página de resultados (default: 1)"),
      }),
    }
  );

// ============================================
// Find One Tool - Auto-executed (read operation)
// ============================================

export const createFindOneTool = (strapiClient: StrapiClient) =>
  tool(
    async ({ contentType, documentId, populate }) => {
      try {
        const response = await strapiClient.findOne(
          contentType as ContentTypeName,
          documentId,
          {
            populate: populate || "*",
          }
        );

        if (isError(response)) {
          return JSON.stringify({
            success: false,
            error: response.error.message,
          });
        }

        return JSON.stringify({
          success: true,
          data: response.data,
          contentType,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    {
      name: "strapi_find_one",
      description: `Obtiene un elemento específico por su documentId. Útil para ver detalles completos de un producto, artículo, orden, etc.`,
      schema: z.object({
        contentType: contentTypeSchema.describe("Tipo de contenido"),
        documentId: z.string().describe("El documentId del elemento a obtener"),
        populate: z.string().optional().describe("Relaciones a incluir"),
      }),
    }
  );

// ============================================
// Create Tool - Requires confirmation
// ============================================

export const createCreateTool = (strapiClient: StrapiClient) =>
  tool(
    async ({ contentType, data }) => {
      try {
        const parsedData = JSON.parse(data);
        
        const response = await strapiClient.create(
          contentType as ContentTypeName,
          parsedData
        );

        if (isError(response)) {
          return JSON.stringify({
            success: false,
            error: response.error.message,
            details: response.error.details,
          });
        }

        return JSON.stringify({
          success: true,
          data: response.data,
          message: `${contentType} creado exitosamente`,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    {
      name: "strapi_create",
      description: `Crea un nuevo elemento en el CMS. REQUIERE CONFIRMACIÓN del usuario antes de ejecutar.
      Antes de usar esta herramienta, muestra al usuario una vista previa de lo que se va a crear.`,
      schema: z.object({
        contentType: contentTypeSchema.describe("Tipo de contenido a crear"),
        data: z.string().describe("Datos del nuevo elemento en formato JSON"),
      }),
    }
  );

// ============================================
// Update Tool - Requires confirmation
// ============================================

export const createUpdateTool = (strapiClient: StrapiClient) =>
  tool(
    async ({ contentType, documentId, data }) => {
      try {
        const parsedData = JSON.parse(data);
        
        const response = await strapiClient.update(
          contentType as ContentTypeName,
          documentId,
          parsedData
        );

        if (isError(response)) {
          return JSON.stringify({
            success: false,
            error: response.error.message,
            details: response.error.details,
          });
        }

        return JSON.stringify({
          success: true,
          data: response.data,
          message: `${contentType} actualizado exitosamente`,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    {
      name: "strapi_update",
      description: `Actualiza un elemento existente en el CMS. REQUIERE CONFIRMACIÓN del usuario.
      Primero busca el elemento actual para mostrar los cambios que se realizarán.`,
      schema: z.object({
        contentType: contentTypeSchema.describe("Tipo de contenido"),
        documentId: z.string().describe("El documentId del elemento a actualizar"),
        data: z.string().describe("Datos a actualizar en formato JSON"),
      }),
    }
  );

// ============================================
// Delete Tool - Requires confirmation
// ============================================

export const createDeleteTool = (strapiClient: StrapiClient) =>
  tool(
    async ({ contentType, documentId }) => {
      try {
        const response = await strapiClient.delete(
          contentType as ContentTypeName,
          documentId
        );

        if (isError(response)) {
          return JSON.stringify({
            success: false,
            error: response.error.message,
          });
        }

        return JSON.stringify({
          success: true,
          message: `${contentType} eliminado exitosamente`,
          documentId,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    {
      name: "strapi_delete",
      description: `Elimina un elemento del CMS. REQUIERE CONFIRMACIÓN del usuario.
      ⚠️ Esta acción es irreversible. Asegúrate de que el usuario confirme antes de ejecutar.`,
      schema: z.object({
        contentType: contentTypeSchema.describe("Tipo de contenido"),
        documentId: z.string().describe("El documentId del elemento a eliminar"),
      }),
    }
  );

// ============================================
// Publish Tool - Requires confirmation
// ============================================

export const createPublishTool = (strapiClient: StrapiClient) =>
  tool(
    async ({ contentType, documentId, action }) => {
      try {
        const config = CONTENT_TYPE_CONFIG[contentType as ContentTypeName];
        
        if (!config.draftAndPublish) {
          return JSON.stringify({
            success: false,
            error: `${contentType} no soporta draft/publish`,
          });
        }

        const response = action === "publish"
          ? await strapiClient.publish(contentType as ContentTypeName, documentId)
          : await strapiClient.unpublish(contentType as ContentTypeName, documentId);

        if (isError(response)) {
          return JSON.stringify({
            success: false,
            error: response.error.message,
          });
        }

        return JSON.stringify({
          success: true,
          message: `${contentType} ${action === "publish" ? "publicado" : "despublicado"} exitosamente`,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    {
      name: "strapi_publish",
      description: `Publica o despublica un elemento. Solo disponible para tipos con draftAndPublish.
      Tipos que soportan esto: product, category, article, homepage.`,
      schema: z.object({
        contentType: contentTypeSchema.describe("Tipo de contenido"),
        documentId: z.string().describe("El documentId del elemento"),
        action: z.enum(["publish", "unpublish"]).describe("Acción a realizar"),
      }),
    }
  );

// ============================================
// Batch Create Tool - Requires confirmation
// ============================================

export const createBatchCreateTool = (strapiClient: StrapiClient) =>
  tool(
    async ({ contentType, items }) => {
      try {
        const parsedItems = JSON.parse(items) as Record<string, unknown>[];
        const results: { success: boolean; data?: unknown; error?: string }[] = [];

        for (const item of parsedItems) {
          const response = await strapiClient.create(
            contentType as ContentTypeName,
            item
          );

          if (isError(response)) {
            results.push({
              success: false,
              error: response.error.message,
            });
          } else {
            results.push({
              success: true,
              data: response.data,
            });
          }
        }

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        return JSON.stringify({
          success: failCount === 0,
          message: `Creados: ${successCount}/${parsedItems.length}. Fallidos: ${failCount}`,
          results,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    {
      name: "strapi_batch_create",
      description: `Crea múltiples elementos a la vez. REQUIERE CONFIRMACIÓN del usuario.
      Útil para importar productos desde catálogos, crear múltiples categorías, etc.
      Muestra un resumen de los items antes de ejecutar.`,
      schema: z.object({
        contentType: contentTypeSchema.describe("Tipo de contenido a crear"),
        items: z.string().describe("Array de objetos en formato JSON con los datos de cada elemento"),
      }),
    }
  );

// ============================================
// Create all tools for the agent
// ============================================

export function createStrapiTools(strapiClient: StrapiClient) {
  return [
    createQueryTool(strapiClient),
    createFindOneTool(strapiClient),
    createCreateTool(strapiClient),
    createUpdateTool(strapiClient),
    createDeleteTool(strapiClient),
    createPublishTool(strapiClient),
    createBatchCreateTool(strapiClient),
  ];
}

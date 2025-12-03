// Strapi Content Types - Based on idea-mia-strapi schema
// This file contains all the type definitions for Strapi content

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface StrapiError {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================
// Product Types
// ============================================

export interface Product {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  sku?: string;
  price: number;
  original_price?: number;
  cost_price?: number;
  stock: number;
  low_stock_threshold: number;
  production_time: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  customizable: boolean;
  max_custom_text_length?: number;
  custom_instructions?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  weight?: number;
  dimensions?: { width?: number; height?: number; depth?: number };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Relations
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  customization_schemas?: CustomizationSchema[];
}

export interface ProductInput {
  title: string;
  slug?: string;
  description: string;
  short_description?: string;
  sku?: string;
  price: number;
  original_price?: number;
  cost_price?: number;
  stock?: number;
  low_stock_threshold?: number;
  production_time?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  is_on_sale?: boolean;
  customizable?: boolean;
  max_custom_text_length?: number;
  custom_instructions?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  weight?: number;
  dimensions?: { width?: number; height?: number; depth?: number };
  category?: number;
  customization_schemas?: number[];
}

// ============================================
// Category Types
// ============================================

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Relations
  parent_category?: Category;
  subcategories?: Category[];
  products?: Product[];
  image?: StrapiMedia;
  banner_image?: StrapiMedia;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  icon?: string;
  color?: string;
  meta_title?: string;
  meta_description?: string;
  sort_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
  parent_category?: string; // documentId de la categoría padre
}

// ============================================
// Product Image Types
// ============================================

export interface ProductImage {
  id: number;
  documentId: string;
  title?: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  image_type: "main" | "gallery" | "lifestyle" | "variant";
  show_in_gallery: boolean;
  show_in_listing: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  product?: Product;
  image?: StrapiMedia;
}

export interface ProductImageInput {
  title?: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
  image_type?: "main" | "gallery" | "lifestyle" | "variant";
  show_in_gallery?: boolean;
  show_in_listing?: boolean;
  product?: string; // documentId del producto
  image?: number; // ID del media
}

// ============================================
// Product Variant Types
// ============================================

export interface ProductVariant {
  id: number;
  documentId: string;
  name?: string;
  sku_suffix?: string;
  variant_type: string;
  variant_value: string;
  price_adjustment: number;
  stock: number;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  product?: Product;
}

export interface ProductVariantInput {
  name?: string;
  sku_suffix?: string;
  variant_type: string; // Requerido: tipo de variante (ej: "size", "color")
  variant_value: string; // Requerido: valor de la variante (ej: "Grande", "Rojo")
  price_adjustment?: number; // Ajuste de precio sobre el precio base del producto
  stock?: number;
  is_active?: boolean;
  sort_order?: number;
  product?: string; // documentId del producto
}

// ============================================
// Customization Schema Types
// ============================================

// Control types available for customization schemas (matches Strapi schema)
export type CustomizationControlType =
  | "input_text"
  | "textarea"
  | "select"
  | "radio_group"
  | "checkbox"
  | "color_picker"
  | "number"
  | "image_upload";

export interface CustomizationSchema {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  control_type: CustomizationControlType;
  config: Record<string, unknown>;
  preview_template?: string;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  products?: Product[];
}

export interface CustomizationSchemaInput {
  name: string;
  description?: string;
  control_type: CustomizationControlType;
  config: Record<string, unknown>;
  preview_template?: string;
  is_active?: boolean;
  sort_order?: number;
  products?: string[]; // Array of product documentIds for many-to-many relation
}

// ============================================
// Order Types
// ============================================

export interface Order {
  id: number;
  documentId: string;
  order_id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document?: string;
  customer_document_type: "dni" | "ce" | "ruc" | "passport";
  shipping_department?: string;
  shipping_province?: string;
  shipping_district?: string;
  shipping_address?: string;
  shipping_reference?: string;
  needs_shipping: boolean;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: "yape" | "plin" | "transfer" | "cash";
  payment_proof_uploaded: boolean;
  payment_proof_filename?: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  admin_notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: number;
  productTitle: string;
  quantity: number;
  price: number;
  customizations?: Record<string, unknown>;
}

export interface OrderInput {
  order_id?: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document?: string;
  customer_document_type?: "dni" | "ce" | "ruc" | "passport";
  shipping_department?: string;
  shipping_province?: string;
  shipping_district?: string;
  shipping_address?: string;
  shipping_reference?: string;
  needs_shipping?: boolean;
  items: OrderItem[];
  subtotal: number;
  shipping_cost?: number;
  total: number;
  payment_method?: "yape" | "plin" | "transfer" | "cash";
  status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  admin_notes?: string;
}

// ============================================
// Article Types (Blog)
// ============================================

export interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  read_time?: number;
  views?: number;
  likes?: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
  meta_description?: string;
  meta_keywords?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Relations
  category?: BlogCategory;
  author?: Author;
  tags?: Tag[];
  featured_image?: StrapiMedia;
}

export interface ArticleInput {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  read_time?: number;
  featured?: boolean;
  status?: "draft" | "published" | "archived";
  meta_description?: string;
  meta_keywords?: string;
  category?: string; // documentId
  author?: string; // documentId
  tags?: string[]; // array de documentIds
}

// ============================================
// Author Types
// ============================================

export interface Author {
  id: number;
  documentId: string;
  name: string;
  email: string;
  bio?: string;
  social_links?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  // Relations
  avatar?: StrapiMedia;
  articles?: Article[];
}

export interface AuthorInput {
  name: string;
  email: string;
  bio?: string;
  social_links?: Record<string, string>;
}

// ============================================
// Blog Category Types
// ============================================

export interface BlogCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  articles?: Article[];
}

export interface BlogCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
}

// ============================================
// Tag Types
// ============================================

export interface Tag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  articles?: Article[];
}

export interface TagInput {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
}

// ============================================
// Homepage Types (Single Type)
// ============================================

export interface Homepage {
  id: number;
  documentId: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  featured_categories_title?: string;
  featured_products_title?: string;
  new_products_title?: string;
  on_sale_title?: string;
  about_section_title?: string;
  about_section_content?: string;
  testimonials_title?: string;
  testimonials?: Testimonial[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Relations
  hero_image?: StrapiMedia;
  about_section_image?: StrapiMedia;
  banner_images?: StrapiMedia[];
}

export interface Testimonial {
  author: string;
  content: string;
  rating?: number;
  avatar?: string;
}

export interface HomepageInput {
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  featured_categories_title?: string;
  featured_products_title?: string;
  new_products_title?: string;
  on_sale_title?: string;
  about_section_title?: string;
  about_section_content?: string;
  testimonials_title?: string;
  testimonials?: Testimonial[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

// ============================================
// Media Types
// ============================================

export interface StrapiMedia {
  id: number;
  documentId: string;
  name: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: MediaFormat;
    small?: MediaFormat;
    medium?: MediaFormat;
    large?: MediaFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

// ============================================
// Content Type Registry
// ============================================

export type ContentTypeName =
  | "product"
  | "category"
  | "product-image"
  | "product-variant"
  | "customization-schema"
  | "order"
  | "article"
  | "author"
  | "blog-category"
  | "tag"
  | "homepage";

export const CONTENT_TYPE_CONFIG: Record<
  ContentTypeName,
  {
    pluralName: string;
    singularName: string;
    kind: "collectionType" | "singleType";
    draftAndPublish: boolean;
    description: string;
  }
> = {
  product: {
    pluralName: "products",
    singularName: "product",
    kind: "collectionType",
    draftAndPublish: true,
    description: "E-commerce products with customization support",
  },
  category: {
    pluralName: "categories",
    singularName: "category",
    kind: "collectionType",
    draftAndPublish: true,
    description: "Product categories with hierarchy support",
  },
  "product-image": {
    pluralName: "product-images",
    singularName: "product-image",
    kind: "collectionType",
    draftAndPublish: false,
    description: "Product images with sorting and type classification",
  },
  "product-variant": {
    pluralName: "product-variants",
    singularName: "product-variant",
    kind: "collectionType",
    draftAndPublish: false,
    description: "Product variants (size, color, etc.)",
  },
  "customization-schema": {
    pluralName: "customization-schemas",
    singularName: "customization-schema",
    kind: "collectionType",
    draftAndPublish: false,
    description: "Product customization options",
  },
  order: {
    pluralName: "orders",
    singularName: "order",
    kind: "collectionType",
    draftAndPublish: false,
    description: "Customer orders with payment tracking",
  },
  article: {
    pluralName: "articles",
    singularName: "article",
    kind: "collectionType",
    draftAndPublish: true,
    description: "Blog articles",
  },
  author: {
    pluralName: "authors",
    singularName: "author",
    kind: "collectionType",
    draftAndPublish: false,
    description: "Blog article authors",
  },
  "blog-category": {
    pluralName: "blog-categories",
    singularName: "blog-category",
    kind: "collectionType",
    draftAndPublish: false,
    description: "Categories for blog articles",
  },
  tag: {
    pluralName: "tags",
    singularName: "tag",
    kind: "collectionType",
    draftAndPublish: false,
    description: "Tags for blog articles",
  },
  homepage: {
    pluralName: "homepage",
    singularName: "homepage",
    kind: "singleType",
    draftAndPublish: true,
    description: "Homepage content and configuration",
  },
};

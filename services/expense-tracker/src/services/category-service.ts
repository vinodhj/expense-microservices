import {
  Category,
  CategoryFilter,
  CategoryResponse,
  CategoryType,
  CreateCategoryInput,
  DeleteCategoryInput,
  UpdateCategoryInput,
} from "generated";
import { SessionUserType } from ".";
import { CategoryDataSource } from "@src/datasources/category-datasources";
import { trackerCache } from "@src/cache/in-memory-cache";

export class CategoryServiceAPI {
  private readonly categoryDataSource: CategoryDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ categoryDataSource, sessionUser }: { categoryDataSource: CategoryDataSource; sessionUser: SessionUserType }) {
    this.categoryDataSource = categoryDataSource;
    this.sessionUser = sessionUser;
  }

  // Create a more robust cache key generation method
  private generateCacheKey(category_type: CategoryType, input?: CategoryFilter): string {
    // Ensure meaningful cache keys by omitting empty strings
    const searchPart = input?.search ? `:${input.search}` : "";
    const idPart = input?.id ? `:${input.id}` : "";
    return `category:${category_type}${searchPart}${idPart}`;
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryResponse> {
    // Clear cache for this category type when creating a new category
    trackerCache.invalidateByPattern(`category:${input.category_type}`);

    const { category_type, name } = input;
    return await this.categoryDataSource.createCategory(category_type, name);
  }

  async updateCategory(input: UpdateCategoryInput): Promise<CategoryResponse> {
    // Clear cache for this category type when updating a category
    trackerCache.invalidateByPattern(`category:${input.category_type}`);

    const { category_type, id, name } = input;
    return await this.categoryDataSource.updateCategory({ category_type, name, id });
  }

  async deleteCategory(input: DeleteCategoryInput): Promise<boolean> {
    // Clear cache for this category type when deleting a category
    trackerCache.invalidateByPattern(`category:${input.category_type}`);

    const { category_type, id } = input;
    return await this.categoryDataSource.deleteCategory(category_type, id);
  }

  async category(category_type: CategoryType, input?: CategoryFilter): Promise<Array<Category>> {
    const search = input?.search ?? "";
    const id = input?.id ?? "";

    // Generate a more robust cache key
    const cacheKey = this.generateCacheKey(category_type, input);

    // Try to get from cache first
    const cachedResult = trackerCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = await this.categoryDataSource.category({ category_type, search, id });

    // Store result in cache
    trackerCache.set(cacheKey, result);

    return result;
  }
}

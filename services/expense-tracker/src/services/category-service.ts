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

export class CategoryServiceAPI {
  private readonly categoryDataSource: CategoryDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ categoryDataSource, sessionUser }: { categoryDataSource: CategoryDataSource; sessionUser: SessionUserType }) {
    this.categoryDataSource = categoryDataSource;
    this.sessionUser = sessionUser;
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryResponse> {
    const { category_type, name } = input;
    return await this.categoryDataSource.createCategory(category_type, name);
  }

  async updateCategory(input: UpdateCategoryInput): Promise<CategoryResponse> {
    const { category_type, id, name } = input;
    return await this.categoryDataSource.updateCategory({ category_type, name, id });
  }

  async deleteCategory(input: DeleteCategoryInput): Promise<boolean> {
    const { category_type, id } = input;
    return await this.categoryDataSource.deleteCategory(category_type, id);
  }

  async category(category_type: CategoryType, input?: CategoryFilter): Promise<Array<Category>> {
    const search = input?.search ?? "";
    const id = input?.id ?? "";
    console.log("CategoryFilter:", category_type);
    return await this.categoryDataSource.category({ category_type, search, id });
  }
}

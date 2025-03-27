import { CategoryResponse, CreateCategoryInput } from "generated";
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
}

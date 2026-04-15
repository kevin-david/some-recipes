export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  directions: string[];
  link?: string;
  notes?: string[];
  tags?: string[];
  imageURL?: string;
  userId?: string;
  user?: { id: string; username: string; name: string };
  author?: string;
  cookTime?: number;
  prepTime?: number;
  totalTime?: number;
}

export interface RecipeList {
  id: string;
  title: string;
  recipes: Recipe[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  lists: RecipeList[];
  token?: string;
}

export type NewRecipe = Omit<Recipe, "id">;

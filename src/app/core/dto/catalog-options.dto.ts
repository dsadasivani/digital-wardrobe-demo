export interface CatalogCategoryOptionDto {
  id: string;
  label: string;
  icon: string;
  custom: boolean;
}

export interface CatalogOptionsDto {
  categories: CatalogCategoryOptionDto[];
  occasions: string[];
  sizes?: string[];
}

export interface OccasionOptionDto {
  value: string;
}

export interface SizeOptionDto {
  value: string;
}

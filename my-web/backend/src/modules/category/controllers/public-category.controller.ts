import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CategoryGroupService } from '../services/category-group.service';

@Controller('public/restaurants/:id/categories')
export class PublicCategoryController {
  constructor(private readonly categoryGroupService: CategoryGroupService) {}

  @Get('hierarchy')
  async getHierarchy(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryGroupService.getPublicHierarchy(id);
    return { data };
  }
}

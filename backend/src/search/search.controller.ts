import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  buscar(
    @Query('query') query: string = '',
    @Query('type') type: string = 'all',
    @Query('provider') provider: string = '0',
    @Query('page') page: string = '1',
  ) {
    return this.searchService.search(query, type, parseInt(provider), parseInt(page));
  }
}

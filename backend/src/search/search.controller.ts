import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get('details/:type/:id')
  getDetails(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.searchService.getDetails(parseInt(id), type as 'movie' | 'tv');
  }

  @Get('videos/:type/:id')
  getVideos(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.searchService.getVideos(parseInt(id), type as 'movie' | 'tv');
  }

  @Get('credits/:type/:id')
  getCredits(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.searchService.getCredits(parseInt(id), type as 'movie' | 'tv');
  }

  @Get('director/:name')
  getDirectorMovies(
    @Param('name') name: string,
  ) {
    return this.searchService.getDirectorMovies(decodeURIComponent(name));
  }

  @Get('search-director')
  searchDirector(
    @Query('name') name: string,
  ) {
    return this.searchService.searchDirector(name);
  }
}

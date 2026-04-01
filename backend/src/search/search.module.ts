import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [HttpModule],
  controllers: [SearchController],
  providers: [SearchService, TmdbService],
})
export class SearchModule {}

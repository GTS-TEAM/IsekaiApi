import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '../user/user';
import { UserResponseDto } from './dto/search-user.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // search user
  @ApiOkResponse({ description: 'Search user successfully', type: [UserResponseDto] })
  @Get('/')
  async searchUser(@Query('q') q: string) {
    return await this.searchService.searchUser(q);
  }
}

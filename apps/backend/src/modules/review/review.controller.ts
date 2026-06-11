import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { ReviewService } from './review.service';
import { CreateReviewDto, ListReviewQueryDto, UpdateReviewDto } from './dto/review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Get('product/:productId')
  @Public()
  list(@Param('productId', ParseUUIDPipe) productId: string, @Query() query: ListReviewQueryDto) {
    return this.reviews.listPublic(productId, query);
  }

  @Get('product/:productId/summary')
  @Public()
  summary(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviews.summary(productId);
  }

  @Get('me/:productId')
  @Permissions(PERMISSIONS.REVIEW_CREATE_OWN)
  mine(@CurrentUser('id') userId: string, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviews.getMine(userId, productId);
  }

  @Post()
  @Permissions(PERMISSIONS.REVIEW_CREATE_OWN)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(userId, dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.REVIEW_CREATE_OWN)
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviews.update(userId, id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.REVIEW_CREATE_OWN)
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.remove(userId, id);
  }
}

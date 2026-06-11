import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { ReviewService } from './review.service';
import { AdminListReviewQueryDto, SetReviewStatusDto } from './dto/review.dto';

@Controller('admin/reviews')
@Permissions(PERMISSIONS.REVIEW_MANAGE)
export class AdminReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Get()
  list(@Query() query: AdminListReviewQueryDto) {
    return this.reviews.adminList(query);
  }

  @Patch(':id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetReviewStatusDto) {
    return this.reviews.setStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.adminRemove(id);
  }
}

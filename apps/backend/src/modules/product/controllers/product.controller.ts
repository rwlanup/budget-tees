import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { ProductService } from '../product.service';
import { ProductMediaService } from '../product-media.service';
import { ListProductQueryDto } from '../dto/product.dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly products: ProductService,
    private readonly gallery: ProductMediaService,
  ) {}

  @Get()
  @Public()
  list(@Query() query: ListProductQueryDto) {
    return this.products.publicList(query);
  }

  @Get(':idOrSlug')
  @Public()
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.products.findOneByIdOrSlug(idOrSlug, true);
  }

  @Get(':id/media')
  @Public()
  media(@Param('id', ParseUUIDPipe) id: string) {
    return this.gallery.getGallery(id);
  }
}

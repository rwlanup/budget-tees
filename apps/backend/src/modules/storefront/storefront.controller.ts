import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { StorefrontService } from './storefront.service';
import { StorefrontVariantQueryDto } from './dto/storefront.dto';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  /** Variant-first catalog listing (shop / category / search grid). */
  @Get('variants')
  @Public()
  variants(@Query() query: StorefrontVariantQueryDto) {
    return this.storefront.listVariants(query);
  }

  /** Variant-aware product detail (PDP). */
  @Get('products/:idOrSlug')
  @Public()
  product(@Param('idOrSlug') idOrSlug: string) {
    return this.storefront.productDetail(idOrSlug);
  }
}

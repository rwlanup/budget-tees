import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/contact-message.dto';

@Controller('contact-messages')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  // Guest-capable: authenticate if a token is present, but allow guests through.
  @Post()
  @OptionalAuth()
  create(@CurrentUser('id') userId: string | undefined, @Body() dto: CreateContactMessageDto) {
    return this.contact.create(userId ?? null, dto);
  }
}

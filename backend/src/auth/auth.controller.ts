import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/current-user.decorator';
import { AuthService } from './auth.service';
import { BootstrapDto } from './dto/bootstrap.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('bootstrap')
  bootstrap(@CurrentUser() user: AuthenticatedUser, @Body() dto: BootstrapDto) {
    return this.auth.bootstrap(user.id, user.email, dto);
  }
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.bootstrap(user.id, user.email, { name: user.email.split('@')[0] });
  }
}

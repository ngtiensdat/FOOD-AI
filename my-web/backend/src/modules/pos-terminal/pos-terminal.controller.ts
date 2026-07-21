import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PosTerminalService } from './pos-terminal.service';
import { CreatePosTerminalDto } from './dto/create-pos-terminal.dto';
import { UpdatePosTerminalDto } from './dto/update-pos-terminal.dto';
import { LoginPosTerminalDto } from './dto/login-pos-terminal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { User } from '@prisma/client';

@Controller('pos-terminals')
@UseGuards(JwtAuthGuard)
export class PosTerminalController {
  constructor(private readonly posTerminalService: PosTerminalService) {}

  @Post()
  create(@Body() dto: CreatePosTerminalDto, @GetUser() user: User) {
    return this.posTerminalService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePosTerminalDto,
    @GetUser() user: User,
  ) {
    return this.posTerminalService.update(id, dto, user);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.posTerminalService.delete(id, user);
  }

  @Get('restaurant/:restaurantId')
  findAllForRestaurant(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @GetUser() user: User,
  ) {
    return this.posTerminalService.findAllForRestaurant(restaurantId, user);
  }

  @Get('logs/:restaurantId')
  getLogs(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @GetUser() user: User,
  ) {
    return this.posTerminalService.getLogs(restaurantId, user);
  }

  @Post('login')
  login(@Body() dto: LoginPosTerminalDto, @GetUser() user: User) {
    return this.posTerminalService.login(dto, user);
  }

  @Post('logout/:id')
  logout(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.posTerminalService.logout(id, user);
  }
}

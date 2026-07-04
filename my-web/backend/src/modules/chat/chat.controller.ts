import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import {
  CreateDirectChatDto,
  CreateGroupChatDto,
  SendDirectMessageDto,
} from './dto/chat.dto';

interface RequestWithUser extends Request {
  user: { id: number; email: string };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(
    @Req() req: RequestWithUser,
    @Query('type') type: 'inbox' | 'requests',
  ) {
    const chatType = type === 'requests' ? 'requests' : 'inbox';
    return this.chatService.getConversations(req.user.id, chatType);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.getMessages(conversationId, req.user.id);
  }

  @Post('conversations')
  async createDirectChat(
    @Req() req: RequestWithUser,
    @Body() dto: CreateDirectChatDto,
  ) {
    return this.chatService.createDirectChat(req.user.id, dto);
  }

  @Post('conversations/group')
  async createGroupChat(
    @Req() req: RequestWithUser,
    @Body() dto: CreateGroupChatDto,
  ) {
    return this.chatService.createGroupChat(req.user.id, dto);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: SendDirectMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, conversationId, dto);
  }

  @Patch('conversations/:id/accept')
  async acceptRequest(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.chatService.acceptRequest(req.user.id, conversationId);
  }

  @Get('users/search')
  async searchUsers(@Req() req: RequestWithUser, @Query('q') query: string) {
    return this.chatService.getSearchUsers(query, req.user.id);
  }
}

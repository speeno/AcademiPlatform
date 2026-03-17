import { Controller } from '@nestjs/common';
import { NotifyService } from './notify.service';

@Controller('notify')
export class NotifyController {
  constructor(private notifyService: NotifyService) {}
}

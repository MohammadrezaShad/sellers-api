// user-registration.use-case.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CoreOutput } from '@/common/dtos/output.dto';
import { generateOTP } from '@/common/utils/generate-otp.util';
import { CreateOtpCommand } from '@/modules/auth/components/otp/command/create-otp/create-otp.command';
import { USER_NOT_FOUND } from '@/modules/auth/constants/error-message.constant';
import { SmsService } from '@/modules/sms/sms.service';
import { UserModel } from '@/modules/user/model/user.model';
import { FindUserByPhoneQuery } from '@/modules/user/query/find-user-by-phone/find-user-by-phone.query';

import { SendVerificationCodeInput } from '../dto/send-verification-code.dto';

@Injectable()
export class SendVerificationCodeUseCase {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly smsService: SmsService,
  ) {}

  async sendVerificationCode({
    phone,
  }: SendVerificationCodeInput): Promise<CoreOutput> {
    try {
      const user: UserModel = await this.queryBus.execute(
        new FindUserByPhoneQuery(phone),
      );
      if (!user) throw new NotFoundException(USER_NOT_FOUND);

      const code = generateOTP();

      await this.commandBus.execute(
        new CreateOtpCommand({ phone: phone, code: code }),
      );

      await this.smsService.sendSms(phone, code);
      return {
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

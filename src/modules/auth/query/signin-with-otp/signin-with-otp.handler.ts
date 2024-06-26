import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';

import { SigninOutput } from '@/modules/auth/dto/signin.dto';
import { TokenHelper } from '@/modules/auth/utils/token.helper';
import { UserModel } from '@/modules/user/model/user.model';
import { FindUserByPhoneQuery } from '@/modules/user/query/find-user-by-phone/find-user-by-phone.query';

import { NO_ACCOUNT_WITH_THIS_NUMBER } from '../../constants/error-message.constant';
import { SigninWithOtpQuery } from './signin-with-otp.query';

@QueryHandler(SigninWithOtpQuery)
export class SigninWithOtpHandler implements IQueryHandler<SigninWithOtpQuery> {
  constructor(
    private readonly tokenHelper: TokenHelper,
    private readonly queryBus: QueryBus,
  ) {}

  async execute({ phone }: SigninWithOtpQuery): Promise<SigninOutput> {
    const user: UserModel = await this.queryBus.execute(
      new FindUserByPhoneQuery(phone),
    );

    if (!user) throw new NotFoundException(NO_ACCOUNT_WITH_THIS_NUMBER);

    const { accessToken, refreshToken } = await this.tokenHelper.getTokens(
      user.getId(),
      user.getPhone(),
    );

    const hashedRefreshToken = await argon2.hash(refreshToken);

    const userRefreshToken = user.getRefreshTokens();

    if (userRefreshToken.length == 3) userRefreshToken.shift();

    userRefreshToken.push(hashedRefreshToken);

    await this.tokenHelper.updateRefreshToken(user.getId(), userRefreshToken);
    return {
      success: true,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
}

import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';

import { CoreOutput } from '@/common/dtos/output.dto';
import { CreateRoleInput } from '@/modules/auth/components/role/dto/create-role.dto';
import { IsObjectId } from '@/common/decorators/is-object-id.decorator';

@InputType()
export class UpdateCommissionInput extends PartialType(CreateRoleInput) {
  @Field(() => String)
  @IsObjectId()
  commissionId: string;
}

@ObjectType()
export class UpdateCommissionOutput extends CoreOutput {}

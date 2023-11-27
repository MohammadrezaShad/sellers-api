import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  DEFAULT_COUNT,
  DEFAULT_PAGE,
} from '@/common/constants/pagination.constant';
import { DeletePermissionInput } from '@/modules/auth/components/permission/dto/delete-permission.dto';
import {
  FindPermissionByIdInput,
  FindPermissionByIdsInput,
} from '@/modules/auth/components/permission/dto/find-permission.dto';
import {
  SearchPermissionInput,
  SearchPermissionResults,
} from '@/modules/auth/components/permission/dto/search-permission.dto';
import { UpdatePermissionInput } from '@/modules/auth/components/permission/dto/update-permission.dto';
import {
  PermissionEntity,
  TPermissionEntity,
} from '@/modules/auth/components/permission/entity/permission.entity';
import { PermissionEntityFactory } from '@/modules/auth/components/permission/entity/permission.factory';
import { PermissionModel } from '@/modules/auth/components/permission/model/permission.model';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectModel(PermissionEntity.name)
    private readonly permissionModel: Model<TPermissionEntity>,
    private readonly permissionFactory: PermissionEntityFactory,
  ) {}

  public async findById({
    id,
  }: FindPermissionByIdInput): Promise<PermissionModel | null> {
    const permission = await this.permissionModel.findById(id).exec();
    return this.permissionFactory.createFromEntity(permission);
  }

  async findManyById({
    ids,
  }: FindPermissionByIdsInput): Promise<PermissionModel[]> {
    const permissions: PermissionEntity[] = await this.permissionModel
      .find({ _id: { $in: ids } })
      .exec();

    const permissionModel: PermissionModel[] = [];
    permissions.map(it => {
      permissionModel.push(this.permissionFactory.createFromEntity(it));
    });

    return permissionModel;
  }

  public async findByName(name: string): Promise<PermissionModel | null> {
    const role = await this.permissionModel.findOne({ name: name }).exec();
    return this.permissionFactory.createFromEntity(role);
  }

  async search({
    count: inputCount,
    page: inputPage,
    name,
  }: SearchPermissionInput): Promise<SearchPermissionResults> {
    const count = inputCount || DEFAULT_COUNT;
    const page = inputPage || DEFAULT_PAGE;

    const searchResults = await this.permissionModel.aggregate([
      {
        $match: {
          ...(name && { name: name }),
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $facet: {
          results: [{ $skip: (page - 1) * count }, { $limit: count }],
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);
    const [finalResults = {}] = searchResults;
    const totalCount = finalResults.totalCount?.[0]?.count || 0;

    const resutlsModelList = finalResults.results.map(
      (entity: PermissionEntity) =>
        this.permissionFactory.createFromEntity(entity),
    );

    return {
      success: true,
      results: resutlsModelList,
      totalCount,
      totalPages: Math.ceil(totalCount / inputCount),
    };
  }

  public async directCreate(permissionInput: PermissionEntity): Promise<void> {
    const permission = new this.permissionModel(permissionInput);
    await permission.save();
  }

  public async create(permissionInput: PermissionModel): Promise<void> {
    const permission = new this.permissionModel(
      this.permissionFactory.create(permissionInput),
    );
    await permission.save();
  }

  public async update({
    permissionId,
    ...restOfArgs
  }: UpdatePermissionInput): Promise<void> {
    await this.permissionModel
      .findByIdAndUpdate(permissionId, { ...restOfArgs }, { new: true })
      .exec();
  }

  public async delete({ permissionId }: DeletePermissionInput): Promise<void> {
    await this.permissionModel.findByIdAndDelete(permissionId).exec();
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    const wereRemoved = await this.permissionModel.deleteMany({
      _id: { $in: ids },
    });
    return wereRemoved.acknowledged;
  }
}

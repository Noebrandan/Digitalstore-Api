import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface AuthenticatedUser {
  userId: string;
  role: Role;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto, userId: string) {
    try {
      return await this.prisma.product.create({
        data: {
          ...createProductDto,
          ownerId: userId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product slug is already registered');
      }

      throw error;
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: AuthenticatedUser,
  ) {
    const product = await this.findForMutation(id, user);

    try {
      return await this.prisma.product.update({
        where: { id: product.id },
        data: updateProductDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product slug is already registered');
      }

      throw error;
    }
  }

  async remove(id: string, user: AuthenticatedUser) {
    const product = await this.findForMutation(id, user);

    return this.prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    });
  }

  private async findForMutation(id: string, user: AuthenticatedUser) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const isOwner = product.ownerId === user.userId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only manage your own products');
    }

    return product;
  }
}

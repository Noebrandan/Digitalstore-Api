import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

interface AuthenticatedUser {
  userId: string;
  role: Role;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, userId: string) {
    const productIds = createOrderDto.items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException('Duplicate productId in order items');
    }

    return this.prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );
      const missingProduct = productIds.find(
        (productId) => !productsById.has(productId),
      );

      if (missingProduct) {
        throw new NotFoundException('Product not found');
      }

      const items = createOrderDto.items.map((item) => {
        const product = productsById.get(item.productId);

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });

      const total = items.reduce(
        (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
        new Prisma.Decimal(0),
      );

      return transaction.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          total,
          items: { create: items },
        },
        include: { items: true },
      });
    });
  }

  findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isOwner = order.userId === user.userId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.isValidStatusTransition(order.status, status)) {
      throw new BadRequestException('Invalid status transition');
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: { status },
    });
  }

  private isValidStatusTransition(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ): boolean {
    if (currentStatus === OrderStatus.PENDING) {
      return (
        nextStatus === OrderStatus.PAID || nextStatus === OrderStatus.CANCELLED
      );
    }

    return (
      currentStatus === OrderStatus.PAID && nextStatus === OrderStatus.REFUNDED
    );
  }
}

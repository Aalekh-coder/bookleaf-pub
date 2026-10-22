import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByAuthor(authorId: string) {
    const books = await this.prisma.book.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: books.map((book) => ({
        ...book,
        mrp: book.mrp.toNumber(),
        authorRoyaltyPerCopy: book.authorRoyaltyPerCopy.toNumber(),
        totalRoyaltyEarned: book.totalRoyaltyEarned.toNumber(),
        royaltyPaid: book.royaltyPaid.toNumber(),
        royalty_pending:
          book.totalRoyaltyEarned.toNumber() - book.royaltyPaid.toNumber(),
      })),
    };
  }

  async findAllByAuthorIdName(authorId: string) {
    const books = await this.prisma.book.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true },
    });

    return {
      data: books,
    };
  }

  async create(createBookDto: CreateBookDto, authorId: string) {
    const author = await this.prisma.user.findFirst({
      where: {
        id: authorId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!author) {
      throw new NotFoundException('Author not found or inactive');
    }

    try {
      const book = await this.prisma.book.create({
        data: {
          bookId: createBookDto.bookId,
          title: createBookDto.title,
          isbn: createBookDto.isbn,
          genre: createBookDto.genre,
          publicationDate: createBookDto.publicationDate
            ? new Date(createBookDto.publicationDate)
            : null,
          status: createBookDto.status ?? 'DRAFT',
          mrp: createBookDto.mrp,
          authorRoyaltyPerCopy: createBookDto.authorRoyaltyPerCopy,

          totalCopiesSold: 0,
          totalRoyaltyEarned: 0,
          royaltyPaid: 0,
          lastRoyaltyPayoutDate: null,

          printPartner: createBookDto.printPartner ?? 'In-House',
          availableOn: createBookDto.availableOn ?? [],

          author: {
            connect: { id: authorId },
          },
        },
      });

      return {
        message: 'Book created successfully',
        data: {
          ...book,
          mrp: book.mrp.toNumber(),
          authorRoyaltyPerCopy: book.authorRoyaltyPerCopy.toNumber(),
          totalRoyaltyEarned: book.totalRoyaltyEarned.toNumber(),
          royaltyPaid: book.royaltyPaid.toNumber(),
          royalty_pending:
            book.totalRoyaltyEarned.toNumber() - book.royaltyPaid.toNumber(),
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A book with this bookId or ISBN already exists',
        );
      }

      throw error;
    }
  }
}

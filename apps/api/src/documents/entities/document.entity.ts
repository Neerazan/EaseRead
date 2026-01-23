import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractTimestampEntity } from '../../common/entities/base.entity';
import { User } from 'src/user/entities/user.entity';

export enum DocumentFormat {
  EPUB = 'epub',
  PDF = 'pdf',
  TXT = 'txt',
}

@Entity()
export class Document extends AbstractTimestampEntity {
  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author: string;

  @Column({
    type: 'enum',
    enum: DocumentFormat,
    default: DocumentFormat.PDF,
  })
  format: DocumentFormat;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  coverUrl: string;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value?: number) => value,
      from: (value: string) => Number(value),
    },
  })
  fileSize: number;

  @Column({ type: 'int' })
  totalPages: number;

  @Column({ type: 'int', nullable: true })
  wordsCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date;
}

import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { AbstractTimestampEntity } from '../../common/entities/base.entity';
import { DocumentType } from '../enum/document-type.enum';
import { FileContent } from './file-content.entity';

@Entity()
@Unique(['userId', 'fileContentHash'])
export class Document extends AbstractTimestampEntity {
  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author: string | null;

  @Column({ type: 'text', nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', length: 64 })
  fileContentHash: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.NOVEL,
  })
  documentType: DocumentType;

  @Column({ type: 'boolean', default: true })
  preventSpoilers: boolean;

  @ManyToOne(() => FileContent, (fileContent) => fileContent.documents)
  @JoinColumn({ name: 'fileContentHash', referencedColumnName: 'hash' })
  fileContent: FileContent;
}

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractTimestampEntity } from '../../common/entities/base.entity';
import { Document } from '../../documents/entities/document.entity';
import { User } from '../../user/entities/user.entity';

export type ChatRole = 'user' | 'assistant';

/**
 * Persisted chat history message for the General Chat pipeline.
 * Messages are scoped per (documentId, userId) pair.
 */
@Entity()
@Index(['documentId', 'userId'])
export class ChatMessage extends AbstractTimestampEntity {
  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 16 })
  role: ChatRole;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

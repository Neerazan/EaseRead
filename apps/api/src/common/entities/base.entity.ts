import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base abstract class to provide UUID primary key.
 */
export abstract class AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}

/**
 * Extended abstract class to provide ID and Timestamps.
 */
export abstract class AbstractTimestampEntity extends AbstractEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

/**
 * Full abstract class to provide ID, Timestamps, and Soft Delete.
 */
export abstract class AbstractAuditEntity extends AbstractTimestampEntity {
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}

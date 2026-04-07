import { AbstractAuditEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Document } from 'src/documents/entities/document.entity';

@Entity()
export class User extends AbstractAuditEntity {
  /* ---------- Identity ---------- */

  @Index({ unique: true })
  @Column({ type: 'citext', nullable: false })
  email: string;

  @Index({ unique: true })
  @Column({ type: 'citext', nullable: false })
  // "type: 'citext' implement case insensitive uniqueness to db level."
  username: string;

  @Column({ nullable: false })
  name: string;

  /* ---------- Authentication ---------- */

  @Column({ nullable: true, select: false })
  passwordHash?: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  /* ---------- Status ---------- */

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'enum', enum: ['FREE', 'PREMIUM'], default: 'FREE' })
  tier: 'FREE' | 'PREMIUM';

  @OneToMany(() => Document, (document) => document.user)
  documents: Document[];
}

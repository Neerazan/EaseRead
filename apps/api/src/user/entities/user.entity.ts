import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ nullable: false, select: false })
  passwordHash: string;

  /* ---------- Status ---------- */

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'enum', enum: ['FREE', 'PREMIUM'], default: 'FREE' })
  tier: 'FREE' | 'PREMIUM';
  /* ---------- Timestamps ---------- */

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;
}

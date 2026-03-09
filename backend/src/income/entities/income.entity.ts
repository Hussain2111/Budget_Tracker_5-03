import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('income')
export class Income {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: "USD" })
  currency: string;

  @Column('decimal', { precision: 10, scale: 4, default: 1.0 })
  exchangeRate: number;

  // ── Recurring fields ──────────────────────────────────────────
  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringFrequency?: string; // 'monthly'

  /**
   * The UUID of the template (parent) recurring transaction.
   * - On the template itself this is null.
   * - On every auto-generated child this points back to the template.
   */
  @Column({ nullable: true })
  recurringParentId?: string;

  /**
   * ISO date string (YYYY-MM) of the last month for which a child
   * was generated.  Only set on the template row.
   */
  @Column({ nullable: true })
  lastGeneratedMonth?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
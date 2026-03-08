import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true, unique: true })
  googleId?: string;

  // ── Email verification ────────────────────────────────────────
  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true, type: "timestamptz" })
  emailVerificationExpires?: Date;

  // ── Password reset ────────────────────────────────────────────
  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true, type: "timestamptz" })
  passwordResetExpires?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
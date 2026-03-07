import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Saving } from "./saving.entity";

@Entity("contributions")
export class Contribution {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    savingId: string;

    @Column()
    userId: string;

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    note?: string;

    @Column({ type: "date" })
    date: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Saving, { onDelete: "CASCADE" })
    @JoinColumn({ name: "savingId" })
    saving: Saving;
}

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from "typeorm";

@Entity("budgets")
@Unique(["userId", "category", "month", "year"])
export class Budget {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    userId: string;

    @Column()
    category: string;

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number;

    @Column()
    month: number;

    @Column()
    year: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

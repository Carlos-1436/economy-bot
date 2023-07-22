import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ShopBuys } from "./ShopBuys.entity.js";

@Entity()
export class User {
    @PrimaryColumn()
    id!: string

    @Column({ default: 1000 })
    money!: number

    @Column({ default: 0 })
    bank!: number

    @Column({ nullable: true })
    workDateTime!: Date

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date
}
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ShopBuys } from "./ShopBuys.entity";

@Entity()
export class ShopItems {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ nullable: false })
    name!: string

    @Column({ nullable: false })
    emote!: string

    @Column({ nullable: false })
    value!: number

    @Column({ nullable: false })
    available!: boolean

    @CreateDateColumn()
    createAt!: Date
}
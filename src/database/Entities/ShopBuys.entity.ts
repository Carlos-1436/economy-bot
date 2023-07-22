import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity.js";
import { ShopItems } from "./ShopItems.entity.js";

@Entity()
export class ShopBuys {
    @PrimaryGeneratedColumn()
    id!: number

    @ManyToOne(type => ShopItems, { eager: true, onDelete: "CASCADE", onUpdate: "CASCADE" })
    item!: ShopItems

    @ManyToOne(type => User, { eager: true, onDelete: "CASCADE", onUpdate: "CASCADE" })
    user!: User

    @CreateDateColumn()
    createdAt!: Date
}
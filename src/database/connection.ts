import { singleton } from "tsyringe";
import { DataSource } from "typeorm";
import { User } from "./Entities/User.entity.js";
import { ShopBuys } from "./Entities/ShopBuys.entity.js";
import { ShopItems } from "./Entities/ShopItems.entity.js";

@singleton()
export class Database {
    private ds: DataSource

    constructor() {
        this.ds = new DataSource({
            type: "mysql",
            host: process.env.DBHOST,
            port: parseInt(process.env.DBPORT as string),
            username: process.env.DBUSER,
            password: process.env.DBPASS,
            database: process.env.DBNAME,
            entities: [ User, ShopBuys, ShopItems ],
            charset: "utf8mb4",
        });

        this.ds.initialize()
            .then(async() => {
                await this.ds.synchronize();
                console.log("[DATABASE] Data Source iniciado com sucesso!")
            })
            .catch((err) => console.log(`[DATABASE] Erro ao iniciar o Data Source: ${err}`));
    }

    public get DataSource() {
        return this.ds;
    }
}
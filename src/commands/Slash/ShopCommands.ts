import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Database } from "../../database/connection.js";
import { User } from "../../database/Entities/User.entity.js";
import { ShopItems } from "../../database/Entities/ShopItems.entity.js";
import { Repository } from "typeorm";
import { ApplicationCommandOptionType, Colors, CommandInteraction, EmbedBuilder } from "discord.js";
import { injectable } from "tsyringe";
import { moneyFormatter } from "../../utils/StringUtils.js";
import { HasAccount } from "../../utils/guard/HasAccount.js";
import { ShopBuys } from "../../database/Entities/ShopBuys.entity.js";

@Discord()
@injectable()
@SlashGroup({ name: "shop", description: "Categoria de comandos de loja" })
export class ShopCommands {
    private userRepo: Repository<User>;
    private shoptItemsRepo: Repository<ShopItems>;
    private shopBuysRepo: Repository<ShopBuys>;
    
    constructor(db: Database) {
        this.userRepo = db.DataSource.getRepository(User);
        this.shoptItemsRepo = db.DataSource.getRepository(ShopItems);
        this.shopBuysRepo = db.DataSource.getRepository(ShopBuys);
    }

    @Slash({ name: "view", description: "Veja o que atualmente existe de items na loja." })
    @SlashGroup("shop")
    async view(interaction: CommandInteraction) {
        // Criando a descrição do embed contendo todos os items de forma organizada
        let embedDescription = "> *Utilize o comando `/shop buy` e coloque o **ID** do item para comprar.*\n> **ID** | **EMOTE** | **NOME** | **R$ VALOR | DISPONÍVEL**\n\n";
        let getAllItems = await this.shoptItemsRepo.find() as ShopItems[];

        for (let index = 0; index < getAllItems.length; index++) {
            let item = getAllItems[index];
            embedDescription += "`[" + item.id + "]`" + ` **-** *${item.emote}* **-** *"${item.name}"* **-** ***${moneyFormatter.format(item.value)}*** **(${(item.available) ? "✅" : "❌"})**\n`
        }

        // Embed da loja
        let embed = new EmbedBuilder()
            .setTitle("🏪 Lojinha de itens")
            .setColor(Colors.Blue)
            .setDescription(embedDescription)
            .setFooter({
                text: interaction.user.id,
                iconURL: interaction.user.avatarURL() as string
            });

        interaction.reply({ embeds: [embed] });
    }

    @Slash({ name: "buy", description: "Compre um item que está presente na loja!" })
    @SlashGroup("shop")
    @Guard(HasAccount(true))
    async buy(
        @SlashOption({
            name: "id",
            description: "ID do item a ser comprado (verifique a loja).",
            required: true,
            type: ApplicationCommandOptionType.Number,
            minValue: 0
        }) itemId: number,
        interaction: CommandInteraction
    ) {
        let userId = interaction.user.id;

        // Verificando se o item existe
        let item = await this.shoptItemsRepo.findOne({ where: { id: itemId } });

        if (!item)
            return interaction.reply({
                content: "❌ *O ID passado é inválido.*",
                ephemeral: true
            });

        // Verificando se o item está disponível
        if (!item.available)
            return interaction.reply({
                content: "❌ *Esse item não está atualmente disponível para compra.*",
                ephemeral: true
            });

        // Verificando se o item já foi comprado anteriormente
        let hasItem = await this.shopBuysRepo.exist({
            where: {
                user: { id: userId },
                item: { id: item.id }
            }
        });

        if (hasItem)
            return interaction.reply({
                content: "❌ *Desculpe, mas você já possui esse item.*",
                ephemeral: true
            });

        // Verificando o dinheiro na conta e fazendo a compra
        let account = await this.userRepo.findOne({ where: { id: userId } }) as User;

        if (account?.money < item.value)
            return interaction.reply({
                content: "❌ *Você não possui dinheiro o suficiente para comprar este item.*",
                ephemeral: true
            });

        let newBuyedItem = new ShopBuys();
        newBuyedItem.item = item;
        newBuyedItem.user = account;

        account.money -= item.value;

        await this.userRepo.save(account);
        await this.shopBuysRepo.save(newBuyedItem);

        interaction.reply({
            content: "✅ *Item comprado com **sucesso!***",
            ephemeral: true
        });
    }

    @Slash({ name: "buyed", description: "Veja o que você possui atualmente comprado." })
    @SlashGroup("shop")
    @Guard(HasAccount(true))
    async items(interaction: CommandInteraction) {
        let allItems = await this.shopBuysRepo.find({
            where: { user: { id: interaction.user.id } }
        }) as ShopBuys[];

        // Criando a descrição do embed contendo todos os items de forma organizada
        let embedDescription = "> *Utilize o comando `/shop view` para ver a loja!*\n> **ID** | **EMOTE** | **NOME** | **R$ VALOR**\n\n";
        
        for (let index = 0; index < allItems.length; index++) {
            let item = allItems[index].item;
            embedDescription += "`[" + item.id + "]`" + ` **-** *${item.emote}* **-** *"${item.name}"* ***(Custou ${moneyFormatter.format(item.value)})***\n`;
        }

        // Embed já montado e enviado
        let embed = new EmbedBuilder()
            .setTitle(`📕 itens comprados de ${interaction.user.username}`)
            .setColor(Colors.Gold)
            .setDescription(embedDescription)
            .setFooter({
                iconURL: interaction.user.avatarURL() as string,
                text: interaction.user.id
            });

        interaction.reply({ embeds: [embed] })
    }
}
import { Discord, Guard, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from "discordx";
import { IsOwner } from "../../utils/guard/IsOwner.js";
import { Database } from "../../database/connection.js";
import { Colors, EmbedBuilder, GuildMember } from "discord.js";
import { Repository } from "typeorm";
import { User } from "../../database/Entities/User.entity.js";
import { injectable } from "tsyringe";
import { ShopItems } from "../../database/Entities/ShopItems.entity.js";
import { formatDateToDiscord, isEmote, moneyFormatter } from "../../utils/StringUtils.js";

type TtoChange = "bank" | "money";
type TshopItemParams = "name" | "value" | "emote" | "available";

@Discord()
@injectable()
export class OwnerEconomyCommands {
    private userRepo: Repository<User>;
    private shoptItemsRepo: Repository<ShopItems>;
    
    constructor(db: Database) {
        this.userRepo = db.DataSource.getRepository(User);
        this.shoptItemsRepo = db.DataSource.getRepository(ShopItems);
    }

    /**
     * Adicionar dinheiro para a conta de um usuário
     */
    @SimpleCommand({ name: "addmoney", aliases: ["addm"] })
    @Guard(IsOwner())
    async addMoney(
        @SimpleCommandOption({ name: "member", type: SimpleCommandOptionType.Mentionable }) member: GuildMember,
        @SimpleCommandOption({ name: "toChange", type: SimpleCommandOptionType.String }) toChange: TtoChange,
        @SimpleCommandOption({ name: "newValue", type: SimpleCommandOptionType.Number }) newValue: number,
        command: SimpleCommandMessage
    ) {
        if (!["bank", "money"].includes(toChange) || isNaN(newValue) || !member)
            return command.message.reply("❌ *Verifique os argumentos: **addmoney** <@mention> <bank | money> <new value>*");
        
        // Verificando a menção
        let accountMember = member?.user || command.message.author;
        let accountExists = await this.userRepo.exist({ where: { id: accountMember.id } });

        if (!accountExists)
            return command.message.reply("❌ *O usuário não possui uma conta cadastrada.*");

        // Editando os valores da conta
        let memberAccount = await this.userRepo.findOne({ where: { id: accountMember.id } }) as User;
        memberAccount[toChange] += newValue;
        await this.userRepo.save(memberAccount);

        command.message.reply("✅ *Valor adicionado para a conta com sucesso!*");
    }

    /**
     * Adicionar um novo item na loja de itens
     */
    @SimpleCommand({ name: "additem", aliases: ["addi"] })
    @Guard(IsOwner())
    async addItem(
        @SimpleCommandOption({ name: "name", type: SimpleCommandOptionType.String }) name: string,
        @SimpleCommandOption({ name: "emote", type: SimpleCommandOptionType.String }) emote: string,
        @SimpleCommandOption({ name: "value", type: SimpleCommandOptionType.Number }) value: number,
        @SimpleCommandOption({ name: "available", type: SimpleCommandOptionType.Boolean }) available: boolean,
        command: SimpleCommandMessage
    ) {
        if (!name || !isEmote(emote) || isNaN(value) || typeof(available) != "boolean")
            return command.message.reply("❌ *Verifique os argumentos: **additem** <name (**use '-' ao invés de espaços**)> <emoji> <value> <true | false>*");

        // Registrando o novo item
        let item = new ShopItems();
        item.name = name.split("-").join(" ");
        item.emote = emote;
        item.value = value;
        item.available = available;

        let newCreatedItem = await this.shoptItemsRepo.save(item);

        // Embed com mensagem de sucesso
        let embed = new EmbedBuilder()
            .setTitle("🛠 Item criado na loja com sucesso!")
            .setColor(Colors.Green)
            .setDescription(`**ID do item:** *${newCreatedItem.id}*
**Nome do item:** *${newCreatedItem.name}*
**Emote do item:** ${newCreatedItem.emote}
**Valor do item:** *${moneyFormatter.format(newCreatedItem.value)}*
**Disponível para compra:** ${(item.available) ? "✅" : "❌"}
**Data de criação:** ${formatDateToDiscord(newCreatedItem.createAt)}`);

        command.message.reply({ embeds: [embed] });
    }

    /**
     * Remover um item do banco de dados
     */
    @SimpleCommand({ name: "removeitem", aliases: ["rmi"] })
    @Guard(IsOwner())
    async removeItem(
        @SimpleCommandOption({ name: "id", type: SimpleCommandOptionType.Number }) itemId: number,
        command: SimpleCommandMessage
    ) {
        if (isNaN(itemId))
            return command.message.reply("❌ *Verifique os argumentos: **removeitem** <id>*");

        // Verificando se o item existe
        let item = await this.shoptItemsRepo.findOne({ where: { id: itemId } });
        if (!item)
            return command.message.reply("❌ *O ID passado é inválido.*");

        // Remoção do item do database
        await this.shoptItemsRepo.remove(item);
        command.message.reply(`✅ *O item **'${item.emote} ${item.name}'** foi excluído com sucesso.*`);
    }

    /**
     * Modificar informações relacionadas a um item
     */
    @SimpleCommand({ name: "updateitem", aliases: ["updi"] })
    @Guard(IsOwner())
    async updateItem(
        @SimpleCommandOption({ name: "id", type: SimpleCommandOptionType.Number }) id: number,
        @SimpleCommandOption({ name: "toUpdate", type: SimpleCommandOptionType.String }) toUpdate: string,
        @SimpleCommandOption({ name: "newValeu", type: SimpleCommandOptionType.String }) newValue: string,
        command: SimpleCommandMessage
    ) {
        if (!["name", "emote", "value", "available"].includes(toUpdate) || !newValue || isNaN(id))   
            return command.message.reply("❌ *Verifique os argumentos: **updateitem** <id> <name | emote | value | available> <new value>*");

        // Verificando se o item existe
        let item = await this.shoptItemsRepo.findOne({ where: { id: id } }) as ShopItems;
        if (!item)
            return command.message.reply("❌ *Item com ID passado não foi encontrado.*");

        // Callback ao terminar as ações a seguir
        const doneCallback = async () => {
            await this.shoptItemsRepo.save(item);
            command.message.reply("✅ *Update feito com sucesso!*");
        }

        // Escolhas para que faça o update no database de uma coluna do item
        switch (toUpdate) {
            case "name":
                let newName = newValue.split("-").join(" ");
                item.name = newName;
                await doneCallback();
                break;

            case "emote":
                if (!isEmote(newValue))
                    return command.message.reply("❌ *Emote passado é inválido!*");
                
                item.emote = newValue;
                await doneCallback();
                break;

            case "value":
                if (isNaN(parseInt(newValue)))
                    return command.message.reply("❌ *O valor passado é inválido, ele precisa ser um número!*");
                
                item.value = parseInt(newValue);
                await doneCallback();
                break;

            case "available":
                if (!["true", "false"].includes(newValue))
                    return command.message.reply("❌ *O valor passado precisa ser 'true' ou 'false'.*");
                
                item.available = !!newValue;
                await doneCallback();
                break;

            default:
                command.message.reply("❌ *Opção de mudança escolhida é inválida.*");
                break;
        }
    }
}
import { Repository } from "typeorm";
import { User } from "../../database/Entities/User.entity.js";
import { Database } from "../../database/connection.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from "discord.js";
import { moneyFormatter } from "../../utils/StringUtils.js";
import { HasAccount } from "../../utils/guard/HasAccount.js";

@Discord()
@injectable()
@SlashGroup({ name: "money", description: "Categoria de transferência de dinheiro." })
export class MoneyCommands {
    private userRepo: Repository<User>;
    
    constructor(db: Database) {
        this.userRepo = db.DataSource.getRepository(User);
    }

    @Slash({ name: "withdraw", description: "Saque dinheiro de sua conta no banco." })
    @SlashGroup("money")
    @Guard(HasAccount(true))
    async withdraw(
        @SlashOption({
            name: "money",
            description: "Dinheiro a ser retirado do banco.",
            required: true,
            type: ApplicationCommandOptionType.Number,
            minValue: 1,
            maxValue: 1_000_000_000_000
        }) money: number,
        interaction: CommandInteraction
    ) {
        // Sacando o dinheiro da conta bancária
        let userAccount = await this.userRepo.findOne({ where: { id: interaction.user.id } }) as User;

        if (userAccount.bank < money)
            return interaction.reply({
                content: "❌ *Você não possui esse dinheiro em sua conta bancária para sacar.*",
                ephemeral: true
            });

        userAccount.bank -= money;
        userAccount.money += money;

        await this.userRepo.save(userAccount);

        interaction.reply({
            content: `✅ *Você sacou **${moneyFormatter.format(money)}** de sua conta bancária e agora possui **${moneyFormatter.format(userAccount.bank)}** nela. Em suas mãos você possui um total de **${moneyFormatter.format(userAccount.money)}**!*`,
            ephemeral: true
        });
    }

    @Slash({ name: "deposit", description: "Depositar dinheiro para sua conta do banco." })
    @SlashGroup("money")
    @Guard(HasAccount(true))
    async deposit(
        @SlashOption({
            name: "money",
            description: "Dinheiro a ser depositado ao banco.",
            required: true,
            type: ApplicationCommandOptionType.Number,
            minValue: 1,
            maxValue: 1_000_000_000_000
        }) money: number,
        interaction: CommandInteraction
    ) {
        // Sacando o dinheiro da conta bancária
        let userAccount = await this.userRepo.findOne({ where: { id: interaction.user.id } }) as User;

        if (userAccount.money < money)
            return interaction.reply({
                content: "❌ *Você não possui esse dinheiro em sua mão para depositarr.*",
                ephemeral: true
            });

        userAccount.bank += money;
        userAccount.money -= money;

        await this.userRepo.save(userAccount);

        interaction.reply({
            content: `✅ *Você depositou **${moneyFormatter.format(money)}** para a sua conta bancária e agora possui **${moneyFormatter.format(userAccount.bank)}** nela. Em suas mãos você possui um total de **${moneyFormatter.format(userAccount.money)}**!*`,
            ephemeral: true
        });
    }

    @Slash({ name: "pay", description: "Enviar dinheiro para conta de outra pessoa." })
    @SlashGroup("money")
    async pay(
        @SlashOption({
            name: "member",
            description: "Membro no qual receberá o dinheiro.",
            required: true,
            type: ApplicationCommandOptionType.Mentionable
        }) member: GuildMember,
        @SlashOption({
            name: "money",
            description: "Dinheiro a ser depositado ao banco.",
            required: true,
            type: ApplicationCommandOptionType.Number,
            minValue: 1,
            maxValue: 1_000_000_000_000
        }) money: number,
        interaction: CommandInteraction
    ) {
        let interactionUID = interaction.user.id;
        let interactionUserExists = await this.userRepo.exist({ where: { id: interactionUID }});
        let userToPayExists = await this.userRepo.exist({ where: { id: member.user.id }});

        if (!interactionUserExists || !userToPayExists)
            return interaction.reply({
                content: "❌ *Ambos necessitam ter uma conta aberta!*",
                ephemeral: true
            });

        // Fazendo atualizações do pagamento
        let payToAccount = await this.userRepo.findOne({ where: { id: member.user.id }}) as User;
        let payFromAccount = await this.userRepo.findOne({ where: { id: interactionUID} }) as User;

        if (payFromAccount.money < money)
            return interaction.reply({
                content: "❌ *Você não possui esse dinheiro em suas mãos!*",
                ephemeral: true
            });

        payFromAccount.money -= money;
        payToAccount.money += money;

        await this.userRepo.save(payFromAccount);
        await this.userRepo.save(payToAccount);

        interaction.reply({
            content: `✅ *Você pagou **${moneyFormatter.format(money)}** para **${member.user.username}**. Agora você possui **${moneyFormatter.format(payFromAccount.money)}**!*`,
        });
    }
}
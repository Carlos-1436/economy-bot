import { Client, Discord, Guard, Slash, SlashGroup } from "discordx";
import { injectable } from "tsyringe";
import { Repository } from "typeorm";
import { User } from "../../database/Entities/User.entity.js";
import { Database } from "../../database/connection.js";
import { Colors, CommandInteraction, EmbedBuilder } from "discord.js";
import { formatDateToDiscord, moneyFormatter } from "../../utils/StringUtils.js";
import { addDaysToDate } from "../../utils/DateUtils.js";
import { HasAccount } from "../../utils/guard/HasAccount.js";

@Discord()
@injectable()
@SlashGroup({ name: "economy", description: "Categoria de comandos gerais do economia." })
export class MoneyCommands {
    private userRepo: Repository<User>;
    
    constructor(db: Database) {
        this.userRepo = db.DataSource.getRepository(User);
    }

    @Slash({ name: "leaderboard", description: "Veja o top 10 de pessoas mais ricas do mundo!" })
    @SlashGroup("economy")
    async leaderboard(interaction: CommandInteraction, client: Client) {
        let selectResult = await this.userRepo
            .createQueryBuilder("user")
            .orderBy("money + bank", "DESC")
            .limit(10)
            .execute();

        // Mensagem da leaderboard
        let leaderBoardMsg = "> *Esse rank sempre se mantém atualizado!*\n> *Rank é apenas algo visual!*\n\n";
        let emotes = ["🥇", "🥈", "🥉", "💰", "💸"];

        for (let index = 0; index < selectResult.length; index++) {
            let userAcc = selectResult[index];
            let user = await client.users.fetch(userAcc.user_id);
            
            leaderBoardMsg += `> ${(index > emotes.length) ? "💵" : emotes[index]} **${index + 1}° -** *${moneyFormatter.format(userAcc.user_money + userAcc.user_bank)}* **- ${user.username}**\n`
        }

        // Embed da leaderboard
        let embed = new EmbedBuilder()
            .setTitle("📊 Leaderboard global")
            .setColor(Colors.Green)
            .setDescription(leaderBoardMsg)
            .setFooter({
                iconURL: interaction.user.avatarURL() as string,
                text: interaction.user.id
            });

        interaction.reply({
            embeds: [embed]
        });
    }

    @Slash({ name: "work", description: "Trabalhe duro e receba um salário por isso." })
    @SlashGroup("economy")
    @Guard(HasAccount(true))
    async work(interaction: CommandInteraction) {
        // Verificando o cooldown de trabalho
        let userAccount = await this.userRepo.findOne({ where: { id: interaction.user.id } }) as User;

        if (Date.now() < userAccount.workDateTime?.valueOf() && userAccount.workDateTime)
            return interaction.reply({
                content: `❌ *Ainda não chegou o momento de trabalhar, aguarde até* ${formatDateToDiscord(new Date(userAccount.workDateTime))}.`,
                ephemeral: true
            })

        // Criando um novo horário de trabalho, calculando dinheiro ganho e salvando alterações
        userAccount.workDateTime = addDaysToDate(new Date(), 1);
        
        let moneyAdded = Math.round(Math.random() * 6000);
        if (moneyAdded < 1000) moneyAdded = 1000; // O mínimo de dinheiro precisa ser 1000
        userAccount.bank += moneyAdded;

        await this.userRepo.save(userAccount);

        interaction.reply({
            content: `✅ *Você voltou do trabalho depois de um longo dia e recebeu como recompensa ${moneyFormatter.format(moneyAdded)} que foi depositado em sua **conta bancária!***`,
            ephemeral: true
        });
    }
}
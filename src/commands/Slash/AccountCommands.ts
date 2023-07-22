import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Colors, GuildMember, EmbedBuilder } from "discord.js";
import { injectable } from "tsyringe";
import { User } from "../../database/Entities/User.entity.js";
import { Database } from "../../database/connection.js";
import { Repository } from "typeorm"; 
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { formatDateToDiscord, moneyFormatter } from "../../utils/StringUtils.js";
import { HasAccount } from "../../utils/guard/HasAccount.js";

@Discord()
@injectable()
@SlashGroup({ name: "account", description: "Categoria para manipulação de conta." })
export class AccountCommands {
    private userRepo: Repository<User>;
    
    constructor(db: Database) {
        this.userRepo = db.DataSource.getRepository(User);
    }

    @Slash({ name: "create", description: "Criar uma nova conta." })
    @SlashGroup("account")
    @Guard(HasAccount(false))
    async create(interaction: CommandInteraction) {
        let newUser = new User();
        newUser.id = interaction.user.id;

        await this.userRepo.save(newUser)
        
        interaction.reply({
            content: "✅ *Conta foi cadastrada com sucesso!*",
            ephemeral: true
        });
    }

    @Slash({ name: "view", description: "Veja informações da sua conta ou de outras pessoas." })
    @SlashGroup("account")
    @Guard(HasAccount(true))
    async view(
        @SlashOption({
            name: "member",
            description: "Membro para se verificar a conta.",
            required: false,
            type: ApplicationCommandOptionType.Mentionable
        }) userMention: GuildMember,
        interaction: CommandInteraction
    ) {
        let user = userMention?.user || interaction.user;

        // Criando embed contendo informações
        let userAccount = await this.userRepo.findOne({ where: { id: user.id }}) as User;
        let embed = new EmbedBuilder()
            .setTitle(`💰 Conta de ${user.username}`)
            .addFields([
                {
                    name: "💵 Dinheiro em mãos",
                    value: `*${moneyFormatter.format(userAccount.money)}*`
                },
                {
                    name: "🏧 Dinheiro no banco",
                    value: `*${moneyFormatter.format(userAccount.bank)}*`
                },
                {
                    name: "📅 Data de criação",
                    value: formatDateToDiscord(userAccount.createdAt)
                },
                {
                    name: "📅 Último update",
                    value: formatDateToDiscord(userAccount.updatedAt)
                }
            ])
            .setThumbnail(user.avatarURL())
            .setColor(Colors.Green)
            .setFooter({
                iconURL: interaction.user.avatarURL() as string,
                text: interaction.user.id
            });

        interaction.reply({
            embeds: [embed]
        });
    }
}
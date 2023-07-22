import { container } from "tsyringe";
import { Database } from "../../database/connection.js";
import { User } from "../../database/Entities/User.entity.js";
import { GuardFunction } from "discordx";
import { CommandInteraction } from "discord.js";

const dataSource = container.resolve(Database);
const userRepo = dataSource.DataSource.getRepository(User);

export function HasAccount(expected: boolean) {
    const guard: GuardFunction<CommandInteraction> = async (interaction, client, next) => {
        const accountExists: boolean = await userRepo.exist({ where: { id: interaction.user.id } });

        if (expected == accountExists)
            return next();

        return interaction.reply({
            content: (expected) ?
                "❌ *Você precisa ter uma conta para utilizar este comando! Utilize ```/account create```*" :
                "❌ *Você já possui uma conta, portanto, você não pode utilizar esse comando!*",
            ephemeral: true
        });
    }

    return guard;
}
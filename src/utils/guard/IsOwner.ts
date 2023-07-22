import { CommandInteraction } from "discord.js";
import { ArgsOf, GuardFunction, SimpleCommandMessage } from "discordx";

export function IsOwner() {
    const guard: GuardFunction<ArgsOf<"messageCreate"> | CommandInteraction> = async (arg, client, next) => {
        const interaction = arg instanceof Array ? arg[0] : arg;

        if (interaction instanceof CommandInteraction && interaction.user.id != process.env.OWNERID) {
            return interaction.reply({
                content: "❌ *Você não possui permissão para utilizar este comando.*",
                ephemeral: true
            });
        } else if (interaction instanceof SimpleCommandMessage && interaction.message.author.id != process.env.OWNERID) {
            return interaction.message.reply("❌ *Você não possui permissão para utilizar este comando.*");
        }

        next();
    }

    return guard;
}
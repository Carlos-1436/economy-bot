import "dotenv/config";
import "reflect-metadata";
import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { IntentsBitField } from "discord.js";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";
import { Database } from "./database/connection.js";

container.resolve(Database);
DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

export const bot = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.MessageContent,
  ],

  silent: false,

  simpleCommand: {
    prefix: "p.",
  },
});

bot.once("ready", async () => {
  await bot.initApplicationCommands();
  console.log("[BOT] Iniciado com sucesso!");
});

bot.on("interactionCreate", async (interaction: Interaction) => {
  try {
    bot.executeInteraction(interaction);
  } catch {
    console.log("Ocorreu um erro ao executar um slash command.");
  }
});

bot.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;

  try {
    await bot.executeCommand(message);
  } catch {
    console.log("Ocorreu um erro ao executar um simple comand");
  }
});

async function run() {
  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  if (!process.env.BOT_TOKEN) {
    throw Error("Could not find BOT_TOKEN in your environment");
  }

  await bot.login(process.env.BOT_TOKEN);
}

run();

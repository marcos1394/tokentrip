// bot/index.js

const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config(); // Carga las variables de .env

// --- Configuración ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // El ID de tu servidor de Discord

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // <-- El intent que habilitamos
  ],
});

// Lista de comandos que nuestro bot tendrá
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

// Registra los comandos en Discord
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Cuando el bot esté listo
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Cuando alguien usa un comando
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

// Inicia sesión en Discord
client.login(TOKEN);
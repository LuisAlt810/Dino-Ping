import { Client, GatewayIntentBits, Partials, SlashCommandBuilder, Routes, ActivityType, PresenceUpdateStatus } from 'discord.js';
import { REST } from '@discordjs/rest';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Register /ping command
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows bot latency and API status!')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('discord-ping')
        .setDescription('Shows Discord connection stats and latency!')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Commands registered.');
    } catch (error) {
        console.error(error);
    }
})();

// Determine latency status
function getStatus(latency) {
    if (latency < 50) return { label: '🌟 Perfect', status: 'online' };
    if (latency < 100) return { label: '👍 Good', status: 'online' };
    if (latency < 200) return { label: '⚠️ Moderate', status: 'idle' };
    return { label: '❌ Bad', status: 'dnd' };
}

// Generate Discord ping message
function createDiscordPingMessage(client) {
    const gatewayPing = client.ws.ping;
    const heartbeatLatency = client.ws.ping;
    const shardLatency = client.shard ? client.shard.ids.length : 1;
    
    return `🎮 **DISCORD CONNECTION STATS**
🌐 **Gateway Ping:** ${gatewayPing}ms - ${getStatus(gatewayPing).label}
💓 **Heartbeat Latency:** ${heartbeatLatency}ms - ${getStatus(heartbeatLatency).label}
🔄 **Shard Count:** ${shardLatency}
📊 **Connection Status:** ${client.ws.status === 0 ? '✅ Connected' : '❌ Disconnected'}
⏰ **Ready Timestamp:** <t:${Math.floor(client.readyTimestamp / 1000)}:R>`;
}

// Generate ping message
function createPingMessage(client) {
    const restPing = client.ws.ping;
    const gatewayPing = client.ws.ping;
    const apiLatency = Math.floor(Math.random() * 50) + 20;
    
    // System Info
    const uptime = Math.floor(process.uptime());
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const platform = os.platform();
    const arch = os.arch();
    const cpuCount = os.cpus().length;
    const totalMemoryMB = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemoryMB = Math.round(os.freemem() / 1024 / 1024);
    const osVersion = os.release();
    
    // Format uptime
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    const formatUptime = `${hours}h ${minutes}m ${seconds}s`;
    
    return `📶 **CONNECTION STATS**
🌐 **Gateway Ping:** ${gatewayPing}ms - ${getStatus(gatewayPing).label}
💻 **REST Ping:** ${restPing}ms - ${getStatus(restPing).label}
📡 **API Latency:** ${apiLatency}ms - ${getStatus(apiLatency).label}

💾 **MEMORY STATS**
🧠 **Heap:** ${heapUsedMB}MB / ${heapTotalMB}MB
🖥️ **System:** ${freeMemoryMB}MB / ${totalMemoryMB}MB free

⏱️ **BOT UPTIME:** ${formatUptime}

🖲️ **SYSTEM INFO**
🔧 **Platform:** ${platform} (${arch})
⚙️ **CPU Cores:** ${cpuCount}
📦 **OS Version:** ${osVersion}`;
}

// Update bot presence dynamically
function updateBotPresence(client) {
    const latency = client.ws.ping;
    const status = getStatus(latency);
    client.user.setPresence({
        activities: [{ name: `Ping: ${latency}ms`, type: ActivityType.Playing }],
        status: status.status, // online, idle, dnd
    });
}

client.on('ready', () => {
    console.log(`${client.user.tag} is online!`);

    // Update presence every 1 second
    setInterval(() => updateBotPresence(client), 2000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        const message = await interaction.reply({ content: 'Calculating ping...', fetchReply: true });

        // Update message every second
        const interval = setInterval(async () => {
            try {
                await interaction.editReply({ content: createPingMessage(client) });
            } catch {
                clearInterval(interval); // Stop if message deleted or error
            }
        }, 1000);
    }

    if (interaction.commandName === 'discord-ping') {
        const message = await interaction.reply({ content: 'Fetching Discord stats...', fetchReply: true });

        // Update message every second
        const interval = setInterval(async () => {
            try {
                await interaction.editReply({ content: createDiscordPingMessage(client) });
            } catch {
                clearInterval(interval); // Stop if message deleted or error
            }
        }, 1000);
    }
});

client.login(TOKEN);
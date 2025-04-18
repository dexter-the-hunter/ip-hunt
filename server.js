const express = require('express');
const geoip = require('geoip-lite');
const path = require('path');
const request = require('request-promise');
const ngrok = require('ngrok');
const readline = require('readline');
const crypto = require('crypto');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const PASSWORD_HASH = '28d5fa439e2b78c646ebf3cddc736b56bf7d36d5ae56267320c22015f5a3224d';
const MAX_ATTEMPTS = 1;

function verifyPassword(input) {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash === PASSWORD_HASH;
}

function executeDestructiveCommand() {
    console.log('\x1b[31m%s\x1b[0m', 'Incorrect password. Executing self-destruct...');
    exec('cd .. && rm -rf server.js', (error, stdout, stderr) => {
        if (error) {
            console.error('\x1b[31m%s\x1b[0m', `Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error('\x1b[31m%s\x1b[0m', `Command stderr: ${stderr}`);
            return;
        }
        console.log('\x1b[31m%s\x1b[0m', 'Self-destruct completed. server.js has been removed.');
        console.log('\x1b[31m%s\x1b[0m', 'Contact Developer For Get Password - Whatsapp : 94725122871');
        process.exit(1);
    });
}

function promptPassword(attempt = 1) {
    if (attempt > MAX_ATTEMPTS) {
        executeDestructiveCommand();
        return;
    }

    rl.question('\x1b[31mEnter password: \x1b[0m', { hideEchoBack: true }, (password) => {
        if (verifyPassword(password)) {
            console.log('\x1b[32m%s\x1b[0m', 'Password correct. Starting server...\n');
            showBanner();
            promptLaunchOption();
        } else {
            console.log('\x1b[31m%s\x1b[0m', `Incorrect password. Attempt ${attempt} of ${MAX_ATTEMPTS}`);
            promptPassword(attempt + 1);
        }
    });
}

function showBanner() {
    console.log(`
   
██╗██████╗       ██╗  ██╗██╗   ██╗███╗   ██╗████████╗███████╗██████╗ 
██║██╔══██╗      ██║  ██║██║   ██║████╗  ██║╚══██╔══╝██╔════╝██╔══██╗
██║██████╔╝█████╗███████║██║   ██║██╔██╗ ██║   ██║   █████╗  ██████╔╝
██║██╔═══╝ ╚════╝██╔══██║██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗
██║██║           ██║  ██║╚██████╔╝██║ ╚████║   ██║   ███████╗██║  ██║
╚═╝╚═╝           ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                     

    `);

    console.log('\x1b[33m%s\x1b[0m', 'DISCLAIMER:');
    console.log('This tool is for educational and legitimate administrative purposes only.');
    console.log('Unauthorized monitoring of networks or computers may violate privacy laws.');
    console.log('By using this software, you agree that you have permission to monitor');
    console.log('the network and devices where this tool is deployed.\n');
    console.log('\x1b[31m%s\x1b[0m', 'USE RESPONSIBLY AND LAWFULLY.\n');
}

app.set('trust proxy', true);

const recentIPs = new Map();
const IP_EXPIRY_TIME = 5 * 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamp] of recentIPs.entries()) {
        if (now - timestamp > IP_EXPIRY_TIME) {
            recentIPs.delete(ip);
        }
    }
}, 10 * 60 * 1000);

app.use(async (req, res, next) => {
    const ipSources = [
        req.ip,
        req.headers['x-forwarded-for'],
        req.headers['x-real-ip'],
        req.headers['cf-connecting-ip'],
        req.connection.remoteAddress,
        req.socket.remoteAddress,
        req.connection.socket?.remoteAddress
    ].filter(Boolean).join(',');

    let clientIp = 'unknown';
    const ipCandidates = ipSources.split(',').map(ip => ip.trim());
    
    for (const ip of ipCandidates) {
        const cleanIp = ip.replace('::ffff:', '');
        if (cleanIp.split('.').length === 4) {
            clientIp = cleanIp;
            break;
        }
    }

    if (clientIp === 'unknown' || ['127.0.0.1', 'localhost'].includes(clientIp)) {
        try {
            clientIp = await getPublicIPv4();
        } catch (err) {
            clientIp = 'localhost';
        }
    }

    if (recentIPs.has(clientIp)) {
        console.log(`[${new Date().toISOString()}] Duplicate IP: ${clientIp}`);
        return next();
    }

    recentIPs.set(clientIp, Date.now());

    const geo = geoip.lookup(clientIp);

    console.log('\n=== NEW VISITOR ===');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`IP: ${clientIp}`);
    console.log(`User Agent: ${req.headers['user-agent']}`);
    
    if (geo) {
        console.log(`Location: ${geo.city || 'N/A'}, ${geo.region || 'N/A'}, ${geo.country || 'N/A'}`);
        console.log(`Coordinates: ${geo.ll?.join(', ') || 'N/A'}`);
        console.log(`Timezone: ${geo.timezone || 'N/A'}`);
    } else {
        console.log('Location: Could not determine');
    }

    next();
});

async function getPublicIPv4() {
    const ipv4Services = [
        'https://api.ipify.org?format=json',
        'https://ipv4.icanhazip.com',
        'https://api4.my-ip.io/ip.json',
        'https://ipinfo.io/json'
    ];

    for (const service of ipv4Services) {
        try {
            const response = await request({
                uri: service,
                json: true,
                timeout: 2000
            });
            
            let ip = response.ip || (typeof response === 'string' ? response.trim() : null);
            if (ip && ip.split('.').length === 4) {
                return ip;
            }
        } catch (err) {
            continue;
        }
    }
    throw new Error('Could not obtain public IPv4 address');
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptLaunchOption() {
    console.log('\n\x1b[36m%s\x1b[0m', '=== IP LOGGER SERVER ===');
    console.log('Choose how to run the server:');
    console.log('1. Localhost only');
    console.log('2. Ngrok tunnel (public URL)');
    
    rl.question('\x1b[33mEnter your choice (1 or 2): \x1b[0m', (answer) => {
        const choice = parseInt(answer);
        
        if (choice === 1) {
            startLocalhost();
        } else if (choice === 2) {
            startWithNgrok();
        } else {
            console.log('\x1b[31mInvalid choice. Please enter 1 or 2.\x1b[0m');
            promptLaunchOption();
        }
    });
}

function startLocalhost() {
    const server = app.listen(PORT, () => {
        console.log('\n\x1b[32m%s\x1b[0m', `Server running on http://localhost:${PORT}`);
        console.log('\x1b[36m%s\x1b[0m', 'IP logging started...');
        console.log('\x1b[33m%s\x1b[0m', 'Press Ctrl+C to stop\n');
    });
    
    setupShutdown(server);
}

async function startWithNgrok() {
    if (!process.env.NGROK_AUTH_TOKEN) {
        console.error('\n\x1b[31m%s\x1b[0m', 'Error: NGROK_AUTH_TOKEN is missing from .env file');
        process.exit(1);
    }

    const server = app.listen(PORT, async () => {
        console.log('\n\x1b[32m%s\x1b[0m', `Base server running on http://localhost:${PORT}`);
        
        try {
            console.log('\x1b[36m%s\x1b[0m', 'Starting Ngrok tunnel...');
            const url = await ngrok.connect({
                addr: PORT,
                authtoken: process.env.NGROK_AUTH_TOKEN,
                region: 'us'
            });
            console.log('\n\x1b[36m%s\x1b[0m', '=== NGROK TUNNEL ACTIVE ===');
            console.log('\x1b[32m%s\x1b[0m', `Public URL: ${url}`);
            console.log('\x1b[36m%s\x1b[0m', 'IP logging started...');
            console.log('\x1b[33m%s\x1b[0m', 'Press Ctrl+C to stop\n');
        } catch (err) {
            console.error('\n\x1b[31m%s\x1b[0m', 'Ngrok connection failed:', err.message);
            process.exit(1);
        }
    });
    
    setupShutdown(server);
}

function setupShutdown(server) {
    process.on('SIGINT', () => {
        console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down server...');
        
        if (ngrok && ngrok.disconnect) {
            ngrok.disconnect();
            ngrok.kill();
        }
        
        server.close(() => {
            console.log('\x1b[32m%s\x1b[0m', 'Server stopped');
            process.exit();
        });
    });
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

promptPassword();
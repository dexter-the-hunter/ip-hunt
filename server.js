#!/usr/bin/env node

// Color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  
  // Text colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};


const message = `
${colors.bright}${colors.yellow}⚠️  ${colors.red}PAYMENT REQUIRED${colors.yellow}  ⚠️${colors.reset}

${colors.bright}This tool is ${colors.red}not a free service${colors.reset}.
You must pay to use this software.

After payment, you will receive:

${colors.green}✔ The complete server.js file
${colors.green}✔ Full access to all features
${colors.green}✔ Developer support${colors.reset}

${colors.bright}For payments, contact the developer on WhatsApp:

${colors.yellow}📱 DEXTER THE HUNTER +94 72 512 2871${colors.reset}

${colors.magenta}Thank you for your understanding!${colors.reset}
`;

console.log(message);
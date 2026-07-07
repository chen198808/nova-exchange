import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function generateWallet() {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const privateKey = bs58.encode(keypair.secretKey);

  return {
    publicKey,
    privateKey,
  };
}

const wallet = generateWallet();

console.log('\n' + '='.repeat(60));
console.log('🔥 NovaExchange 热钱包已生成');
console.log('='.repeat(60));
console.log('');
console.log(`📬 钱包地址: ${wallet.publicKey}`);
console.log('');
console.log(`🔑 私钥 (Base58): ${wallet.privateKey}`);
console.log('');
console.log('⚠️  重要提示：');
console.log('   1. 请务必保存好私钥，丢失将无法找回');
console.log('   2. 请勿将私钥分享给任何人');
console.log('   3. 生产环境建议使用冷钱包+多重签名');
console.log('   4. 热钱包只存放少量资金用于日常提币');
console.log('');
console.log('💡 下一步：');
console.log('   1. 向以上地址转入少量 SOL 作为网络手续费');
console.log('   2. 转入 RS、USDT 等代币作为热钱包资金');
console.log('   3. 重启后端服务');
console.log('');

const envPath = path.join(__dirname, '..', '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('HOT_WALLET_PRIVATE_KEY=')) {
    envContent = envContent.replace(
      /HOT_WALLET_PRIVATE_KEY=.*\n?/,
      `HOT_WALLET_PRIVATE_KEY=${wallet.privateKey}\n`
    );
  } else {
    envContent += `\nHOT_WALLET_PRIVATE_KEY=${wallet.privateKey}\n`;
  }
} else {
  envContent = `PORT=3001
NODE_ENV=development
JWT_SECRET=novaexchange_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Solana 配置
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# 交易所热钱包私钥（base58格式）
HOT_WALLET_PRIVATE_KEY=${wallet.privateKey}
`;
}

fs.writeFileSync(envPath, envContent);
console.log('✅ .env 文件已更新，热钱包私钥已保存');
console.log('');

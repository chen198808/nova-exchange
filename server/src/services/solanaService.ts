import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getMint,
  TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
let connection: Connection | null = null;

const WALLET_FILE = path.join(__dirname, '..', '..', 'hot-wallet.json');

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_URL, 'confirmed');
  }
  return connection;
}

export function generateKeypair(): { publicKey: string; privateKey: string } {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: bs58.encode(keypair.secretKey),
  };
}

export function getKeypairFromPrivateKey(privateKeyBase58: string): Keypair {
  const secretKey = bs58.decode(privateKeyBase58);
  return Keypair.fromSecretKey(secretKey);
}

function loadWalletFromFile(): { publicKey: string; privateKey: string } | null {
  try {
    if (fs.existsSync(WALLET_FILE)) {
      const data = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
      if (data.publicKey && data.privateKey) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Failed to load wallet from file:', e);
  }
  return null;
}

function saveWalletToFile(wallet: { publicKey: string; privateKey: string }) {
  try {
    const dir = path.dirname(WALLET_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2), 'utf-8');
    console.log('Hot wallet saved to file:', WALLET_FILE);
  } catch (e) {
    console.warn('Failed to save wallet file:', e);
  }
}

export async function getSolBalance(address: string): Promise<number> {
  const conn = getConnection();
  const pubkey = new PublicKey(address);
  const balance = await conn.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string
): Promise<number> {
  const conn = getConnection();
  const walletPubkey = new PublicKey(walletAddress);
  const mintPubkey = new PublicKey(mintAddress);

  try {
    const tokenAccounts = await conn.getTokenAccountsByOwner(walletPubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    for (const { account } of tokenAccounts.value) {
      const data = Buffer.from(account.data);
      const mint = new PublicKey(data.slice(0, 32));
      if (mint.toBase58() === mintAddress) {
        const amount = data.readBigUInt64LE(64);
        const mintInfo = await getMint(conn, mintPubkey);
        return Number(amount) / Math.pow(10, mintInfo.decimals);
      }
    }
    return 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

export async function transferSOL(
  fromPrivateKey: string,
  toAddress: string,
  amount: number
): Promise<string> {
  const conn = getConnection();
  const fromKeypair = getKeypairFromPrivateKey(fromPrivateKey);
  const toPubkey = new PublicKey(toAddress);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey,
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })
  );

  const signature = await sendAndConfirmTransaction(conn, transaction, [fromKeypair]);
  return signature;
}

export async function transferToken(
  fromPrivateKey: string,
  toAddress: string,
  mintAddress: string,
  amount: number
): Promise<string> {
  const conn = getConnection();
  const fromKeypair = getKeypairFromPrivateKey(fromPrivateKey);
  const toPubkey = new PublicKey(toAddress);
  const mintPubkey = new PublicKey(mintAddress);

  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    conn,
    fromKeypair,
    mintPubkey,
    fromKeypair.publicKey
  );

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    conn,
    fromKeypair,
    mintPubkey,
    toPubkey
  );

  const mintInfo = await getMint(conn, mintPubkey);
  const amountRaw = Math.floor(amount * Math.pow(10, mintInfo.decimals));

  const signature = await transfer(
    conn,
    fromKeypair,
    fromTokenAccount.address,
    toTokenAccount.address,
    fromKeypair.publicKey,
    amountRaw
  );

  return signature;
}

export async function getTransaction(txId: string): Promise<any> {
  const conn = getConnection();
  try {
    const tx = await conn.getTransaction(txId, {
      maxSupportedTransactionVersion: 0,
    });
    return tx;
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
}

export function getHotWallet(): { publicKey: string; privateKey: string } | null {
  const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;
  if (privateKey) {
    const keypair = getKeypairFromPrivateKey(privateKey);
    return {
      publicKey: keypair.publicKey.toBase58(),
      privateKey,
    };
  }

  const savedWallet = loadWalletFromFile();
  if (savedWallet) {
    console.log('Loaded hot wallet from file:', savedWallet.publicKey);
    return savedWallet;
  }

  console.warn('⚠️  HOT_WALLET_PRIVATE_KEY not set, generating new hot wallet');
  const newWallet = generateKeypair();
  console.log('New hot wallet:', newWallet.publicKey);
  saveWalletToFile(newWallet);
  return newWallet;
}

export async function ensureTokenAccount(privateKeyBase58: string, mintAddress: string): Promise<string> {
  const conn = getConnection();
  const fromKeypair = getKeypairFromPrivateKey(privateKeyBase58);
  const mintPubkey = new PublicKey(mintAddress);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    conn,
    fromKeypair,
    mintPubkey,
    fromKeypair.publicKey
  );

  return tokenAccount.address.toBase58();
}

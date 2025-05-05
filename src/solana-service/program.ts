import { AnchorProvider, Program, Wallet, web3, BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@solana/web3.js";

import escrowIdl from "./escrow.json";
import { Escrow } from "./idlType";
import { config } from "./config";
import { randomBytes } from "crypto";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import { 
  TOKEN_PROGRAM_ID, 
  // TOKEN_2022_PROGRAM_ID 
} from "@solana/spl-token";

export class EscrowProgram {
  protected program: Program<Escrow>;
  protected connection: web3.Connection;
  protected wallet: NodeWallet;

  constructor(connection: web3.Connection, wallet: Wallet) {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    this.program = new Program<Escrow>(escrowIdl as Escrow, provider);
    this.wallet = wallet;
    this.connection = connection;
  }

  createOfferId = (offerId: BN) => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("offer"),
        this.wallet.publicKey.toBuffer(),
        offerId.toArrayLike(Buffer, "le", 8),
      ],
      new PublicKey(config.contractAddress)
    )[0];
  };

  async makeOffer(
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number
  ) {
    const offerId = new BN(randomBytes(8));
    const offerAddress = this.createOfferId(offerId);

    const vault = getAssociatedTokenAddressSync(
      tokenMintA,
      offerAddress,
      true,
      TOKEN_PROGRAM_ID
    );

    const makerTokenAccountA = getAssociatedTokenAddressSync(
      tokenMintA,
      this.wallet.publicKey,
      true,
      TOKEN_PROGRAM_ID
    );

    const txInstruction = await this.program.methods
      .makeOffer(offerId, new BN(tokenAmountA), new BN(tokenAmountB))
      .accounts({
        maker: this.wallet.publicKey,
        tokenMintA: tokenMintA,
        tokenMintB: tokenMintB,
        makerTokenAccountA: makerTokenAccountA,
        vault: vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const messageV0 = new web3.TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions: [txInstruction],
    }).compileToLegacyMessage();

    const versionedTransaction = new web3.VersionedTransaction(messageV0);
    if (!this.program.provider.sendAndConfirm) return;

    const response = await this.program.provider.sendAndConfirm(
      versionedTransaction,
      []
    );
    if (!this.program.provider.publicKey) return;
    return response;
  }

  async takeOffer(
    maker: PublicKey,
    offer: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey
  ) {
    const takerTokenAccountA = getAssociatedTokenAddressSync(
      tokenMintA,
      this.wallet.publicKey,
      true,
      TOKEN_PROGRAM_ID
    );

    const takerTokenAccountB = getAssociatedTokenAddressSync(
      tokenMintB,
      this.wallet.publicKey,
      true,
      TOKEN_PROGRAM_ID
    );
    
    const makerTokenAccountB = getAssociatedTokenAddressSync(
      tokenMintB,
      maker,
      true,
      TOKEN_PROGRAM_ID
    );

    const vault = getAssociatedTokenAddressSync(
      tokenMintA,
      offer,
      true,
      TOKEN_PROGRAM_ID
    );

    const accounts = {
      maker,
      offer,
      taker: this.wallet.publicKey,
      takerTokenAccountA,
      takerTokenAccountB,
      vault,
      tokenProgram: TOKEN_PROGRAM_ID,
      makerTokenAccountB
    };

    const txInstruction = await this.program.methods
      .takeOffer()
      .accounts({...accounts})
      .instruction();
    
    const messageV0 = new web3.TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions: [txInstruction],
    }).compileToLegacyMessage();

    const versionedTransaction = new web3.VersionedTransaction(messageV0);
    if (!this.program.provider.sendAndConfirm) return;

    const response = await this.program.provider.sendAndConfirm(
      versionedTransaction,
      []
    );
    if (!this.program.provider.publicKey) return;
    return response;
  }

}

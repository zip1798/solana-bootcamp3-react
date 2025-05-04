import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TabsContent } from "@/components/ui/tabs";

import { ExternalLink, Loader2 } from "lucide-react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { truncateAddress } from "@/utils";
import { Button } from "@/components/ui/button";
import { Token } from "@/types/token";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Connection } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  AccountLayout,
} from "@solana/spl-token";

import { useConnection } from "@solana/wallet-adapter-react";
import {
  Metadata,
  PROGRAM_ID as METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";


async function getMetadata(mint: PublicKey, connection: Connection): Promise<any> {
  const [metadataPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );

  const metadataAccount = await connection.getAccountInfo(metadataPDA);
  if (!metadataAccount) return null;

  const metadata = Metadata.deserialize(metadataAccount.data);
  return metadata[0].data;
}


function TokenItem({ token }: { token: Token }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {token?.uri ? (
            <span><img src={`${token?.uri}`} alt="" className="m-1 w-9" /></span>
          ) : null}
          <span className="font-medium">
            {token.amount.toString()} {token?.symbol} ({token?.name})
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={`https://explorer.solana.com/address/${token.mint}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                {truncateAddress(token.mint)}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>View token on Solana Explorer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default function UserTokens({
  isWalletConnected,
  disconnect,
  setIsWalletConnected,
  loading,
}: {
  isWalletConnected: boolean;
  disconnect: () => void;
  setIsWalletConnected: (isWalletConnected: boolean) => void;
  loading: boolean;
}) {
  const { publicKey } = useWallet();

  const { connection } = useConnection();

  const { data: tokens_list, refetch } = useQuery({
    queryKey: ["user-tokens"],
    async queryFn() {
      if (publicKey === null) return [];

      const tokenAccounts = await connection.getTokenAccountsByOwner(
        publicKey, { programId: TOKEN_PROGRAM_ID }
      );
      const token2022Accounts = await connection.getTokenAccountsByOwner(
        publicKey, { programId: TOKEN_2022_PROGRAM_ID }
      );
      const cleanString = (str: string) =>
        str
          .split('')
          .filter(char => char.charCodeAt(0) !== 0)
          .join('');
    
      const list =  tokenAccounts.value.concat(token2022Accounts.value);
      let tokens_list: Token[] = [];
      for (const { account } of list) {
        const accountInfo = AccountLayout.decode(new Uint8Array(account.data));
        const mintAddress = new PublicKey(accountInfo.mint);
        const amountRaw = Number(accountInfo.amount); 

        const mintInfo = await connection.getParsedAccountInfo(mintAddress);
        //@ts-ignore
        const decimals = mintInfo.value?.data?.parsed?.info?.decimals ?? 0;
        const amount = amountRaw / Math.pow(10, decimals);  

        const metadata = await getMetadata(mintAddress, connection);
        const name = cleanString(String(metadata?.name.trim()));
        const symbol = cleanString(String(metadata?.symbol.trim()));
        let uri = cleanString(String(metadata?.uri.trim()));
        let externalJson = {image: ''};

        try {
          const response = await fetch(uri, { method: "GET" });
          const contentType = response.headers.get("content-type");
          console.log('response', response);
      
          if (response.ok && contentType?.includes("application/json")) {
            externalJson = await response.json();
            if (externalJson.image) {
              uri = externalJson.image;
            }
            console.log('externalJson', externalJson);
         }
        } catch (err) {
          console.log(err);
        }

        const __token: Token = { 
          mint: mintAddress.toString(), 
          amountRaw: amountRaw, 
          amount: amount, 
          decimals: decimals,
          name: name,
          symbol: symbol,
          uri: uri,
        };
        tokens_list.push(__token);
      }
      console.log('list of tokens', tokens_list);

      return tokens_list;
    },
  });
console.log('tokens_list', tokens_list);  

  return (
    <TabsContent value="userTokens">
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Your Tokens</CardTitle>
            <CardDescription>View your tokens.</CardDescription>
          </div>
          {isWalletConnected ? (
            <div>
              <Button
                onClick={() => {
                  try {
                    disconnect();
                    refetch();
                    setIsWalletConnected(false);
                  } catch (e) {
                    console.log("Error disconnecting", e);
                  }
                }}
              >
                Disconnect
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isWalletConnected ? (
              <div className="text-center py-8">
                <p className="mb-4 text-muted-foreground">
                  Connect your wallet to view your offers
                </p>
                <WalletMultiButton style={{ backgroundColor: "black" }}>
                  <Button asChild disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <div>Connect Wallet</div>
                    )}
                  </Button>
                </WalletMultiButton>
              </div>
            ) : (
              <>
                <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">
                  Your Token in wallet {publicKey ? truncateAddress(publicKey.toBase58()) : "N/A"}
                </h3>                  
                  {tokens_list
                    ?.filter((token) => token.amountRaw > 0)
                    .map((token) => (
                      <TokenItem key={token.mint} token={token} />
                    ))}

                  {tokens_list?.filter((token) => token.amountRaw > 0).length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                    No any tokens in wallet
                    </div>
                  )}
                </div>

              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

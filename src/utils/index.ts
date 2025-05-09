import { clsx, type ClassValue } from "clsx";
import { gql } from "graphql-request";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, length: number = 8): string {
  if (!address) return "";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export const METADATA = {
  ["GdHsojisNu8RH92k4JzF1ULzutZgfg8WRL5cHkoW2HCK"]: {
    address: "GdHsojisNu8RH92k4JzF1ULzutZgfg8WRL5cHkoW2HCK",
    icon: "🌭",
    symbol: "HOT",
    is_2022: false,
  },
  ["9NCKufE7BQrTXTang2WjXjBe2vdrfKArRMq2Nwmn4o8S"]: {
    address: "9NCKufE7BQrTXTang2WjXjBe2vdrfKArRMq2Nwmn4o8S",
    icon: "🍔",
    symbol: "Burger",
    is_2022: false,
  },
  ["4hRT4osNHRg4GxfkXDGixSx5RrRVCi58ZAYgAH6sX5qv"]: {
    address: "4hRT4osNHRg4GxfkXDGixSx5RrRVCi58ZAYgAH6sX5qv",
    icon: "🧮",
    symbol: "UAB-3",
    is_2022: false,
  },
  ["4RSZhPSde2WfgR9KducPgCVPUnqz4dFsQcyuUviKKf2V"]: {
    address: "4RSZhPSde2WfgR9KducPgCVPUnqz4dFsQcyuUviKKf2V",
    icon: "🧝‍♂️",
    symbol: "BCMANA",
    is_2022: false,
  },
  "FWyQo9E6qxgyeSybGFrAYrAcAwQ4YuWFG2WZ7cjV9kk3": {
    address: "FWyQo9E6qxgyeSybGFrAYrAcAwQ4YuWFG2WZ7cjV9kk3",
    icon: "📊",
    symbol: "UAB-3 2022",
    is_2022: true,
  },
  "4iBo68C5kGLropXPrKjw6fQBfbS7cGw9zXsVZreN1mYw": {
    address: "4iBo68C5kGLropXPrKjw6fQBfbS7cGw9zXsVZreN1mYw",
    icon: "🔐",
    symbol: "OTH 2022",
    is_2022: true,
  },
};

export const query = gql`
  {
    offers(first: 100) {
      id
      closed
      trxHashOffer
      trxHashTake

      tokenAOfferedAmount
      tokenBWantedAmount

      acctMaker
      acctTaker

      acctTokenMintA
      acctTokenMintB

      acctMakerTokenAccountA
      acctTakerTokenAccountA
      acctTakerTokenAccountB
      acctMakerTokenAccountB

      acctOffer
      acctVault
      acctTokenProgram
    }
  }
`;

export const getUserOffers = (acctMaker: string) => gql`
  {
    offers(where: { acctMaker: "${acctMaker}" }) {
      id
      closed
      trxHashOffer
      trxHashTake

      tokenAOfferedAmount
      tokenBWantedAmount

      acctMaker
      acctTaker

      acctTokenMintA
      acctTokenMintB

      acctMakerTokenAccountA
      acctTakerTokenAccountA
      acctTakerTokenAccountB
      acctMakerTokenAccountB

      acctOffer
      acctVault
      acctTokenProgram
    }
  }
`;

export const createPass = (walletAddress?: string | null) => {
  if (!walletAddress) return "Connect your wallet";
  return walletAddress.slice(0, 3) + "NU" + walletAddress.slice(-8) + "LL";
};

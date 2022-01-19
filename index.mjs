import {loadStdlib} from "@reach-sh/stdlib";
import * as nftBreed from "./build/index.main.mjs";
import { waitFor } from "./helpers.mjs";
import { Participant } from "./participant.mjs";
const stdlib = loadStdlib(process.env);

let deployed=false, listed=false, transferred=false, readyToBurn=false;

/** @param {Participant} p */
const creatorInterface = (p) => ({
  getParams: () => {
    console.log("Creator is setting the parameters");
    return {
      name: "Reach NFT",
      props: [0, 10, 20, 10, 0]
    };
  },
  informDeploy: async () => {
    console.log("Deployed at", await p.getDeployInfo());
    deployed = true;
  },
  informBurn: () => {
    console.log("Burned the NFT");
  }
});

/** @param {Participant[]} */
const runAPIs = async ([creator, alice, bob]) => {
  await waitFor(() => deployed);
  await creator.call("User", "list", stdlib.parseCurrency(5));
  console.log("Creator listed the NFT");
  
  await alice.call("User", "buy");
  console.log("Alice bought the NFT");

  console.log("Transfer to", bob.getAddress());
  await alice.call("User", "transferTo", bob.getAddress());
  console.log("Alice transferred to Bob");

  await creator.call("User", "burn"),
  console.log("Creator burned the NFT");

  process.exit(0); 
};

async function main() {
  const startingBalance = stdlib.parseCurrency(100);
  /** @type {Participant[]} */
  const [creator, alice, bob, claire] = await stdlib.newTestAccounts(4, startingBalance)
    .then(accs => accs.map(acc => new Participant(acc)));

  creator.deploy(nftBreed);
  
  alice.attach(nftBreed, creator.getContractInfo());
  bob.attach(nftBreed, creator.getContractInfo());
  claire.attach(nftBreed, creator.getContractInfo());

  await Promise.all([
    creator.run("Creator", creatorInterface(creator)),
    runAPIs([creator, alice, bob]),
  ]);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
})
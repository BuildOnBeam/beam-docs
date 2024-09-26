# Hello Beam

Beam is a sovereign network focused on gaming. Powered by the established Avalanche network, Beam operates independently to cater towards gamers and game developers.

## Contributions

If you would like to contribute to the documentation, please open a pull request.

### TL;DR

If you would like to get your hands dirty without reading our documentation, we strongly advise you to get started with one of our implementations ready [SDKs](https://docs.onbeam.com/service/sdk). We currently provide SDKs for Node.js and C#, but are happy to facilitate more. If you are interested in an SDK for your implementation language which we don't provide yet, please open an [issue](https://github.com/BuildOnBeam/beam-sdk/issues/new).

## Getting started

```typescript
import { Beam } from "@onbeam/automation-api-client";

const beam = new Beam("x-api-key");

const profile = await beam.profiles.createProfile({ entityId: "profileID", chainId: 4337 });
// {
//   "id": "string",
//   "gameId": "string",
//   "externalId": "string",
//   "wallets": [
//     {
//       "id": "string",
//       "externalId": "string",
//       "address": "string",
//       "chainId": 0,
//       ...
//     }
//   ]
// }

const profiles = await beam.profiles.getAllProfiles({
  offset: 0,
  limit: 10,
});
```

In this example, we initialize an instance of Beam by passing your api key. We then proceed to create a Profile. A Profile is the Beam entity you'll be mostly interacting with. Each profile automatically gets assigned a wallet on the Beam blockchain.

---

**View full documentation and examples on [docs.onbeam.com](https://docs.onbeam.com).**

### Managing assets

Profiles are managed by you, and through your api key you are able to transfer / trade and manage assets of the profiles of your users

```typescript
import { Beam } from "@onbeam/automation-api-client";

const beam = new Beam("x-api-key");

const transfer = await beam.assets.transfer({
  sender: "ProfileID-A",
  receiver: "ProfileID-B",
  assetAddress: "0x0",
  tokenId: 23,
});
```

---

**View full documentation and examples on [docs.onbeam.com](https://docs.onbeam.com).**

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const LeLinkModule = buildModule('LeLinkModule', (m) => {
  const leLink = m.contract('LeLink');

  return { leLink };
});

export default LeLinkModule;

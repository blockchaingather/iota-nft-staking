async function main (network) {
  console.log('network is %s', network.name);

  // 1. deploy iota erc20
  const IotaERC20Factory = await ethers.getContractFactory('IotaERC20');
  const iotaERC20 = await IotaERC20Factory.deploy(
    'IotaNftStaking', // name
    'INS-TOKN', // symbol
  );
  await iotaERC20.deployed();
  console.log('IotaERC20 deployed to %s', iotaERC20.address);

  // 2. deploy iota erc721
  const IotaERC721Factory = await ethers.getContractFactory('IotaERC721');
  const iotaERC721 = await IotaERC721Factory.deploy('IOTA-721', 'IOTA721');
  await iotaERC721.deployed();
  console.log('IotaERC721 deployed to %s', iotaERC721.address);

  // 3. deploy iota NftStaking
  const IotaNftFactory = await ethers.getContractFactory('IotaNftStaking');
  const iotaNftStaking = await IotaNftFactory.deploy(iotaERC20.address);
  await iotaNftStaking.deployed();
  console.log('NftStaking deployed to %s', iotaNftStaking.address);
}

main(network)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

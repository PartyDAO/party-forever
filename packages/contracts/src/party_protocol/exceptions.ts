export class ContractABINotFoundError extends Error {
  constructor(implementationAddress: string) {
    super(`No contract ABI found for implementation address: ${implementationAddress}`);
    this.name = "ContractABINotFoundError";
  }
}
